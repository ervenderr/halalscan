"""LLM service: DeepSeek V3.2 classification with structured JSON output."""

import json
import logging
from typing import List

from openai import AsyncOpenAI

from app.models.schemas import ClassificationResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a halal food ingredient classifier. You MUST classify each ingredient \
according to the user's SELECTED madhab (school of thought). Do NOT default to \
the strictest opinion — use the ruling of the selected school.

Classification levels:
- HALAL: Permissible according to the selected madhab
- HARAM: Forbidden according to the selected madhab
- MUSHBOOH: Doubtful/source-dependent — needs verification

CRITICAL MADHAB-SPECIFIC RULES:
- Hanafi: Only fish (with scales) are halal seafood. However, most contemporary \
  Hanafi scholars (including Deobandi and many Hanafi fatwa councils) permit shrimp/prawns \
  as an exception. Crab, lobster, squid, octopus remain haram. Shellfish like mussels \
  and oysters are haram.
- Shafi'i: ALL seafood is halal (fish, shrimp, crab, lobster, squid, octopus, etc.)
- Maliki: ALL seafood is halal. More lenient on insect-derived ingredients (carmine). \
  Considers istihalah (transformation) for wine vinegar.
- Hanbali: ALL seafood is halal. Stricter on doubtful ingredients than Shafi'i.

Other common differences:
- Wine vinegar: Hanafi/Maliki consider halal (complete transformation). \
  Shafi'i/Hanbali consider haram (origin matters).
- Vanilla extract (alcohol carrier): Hanafi/Maliki more lenient if alcohol \
  evaporates in cooking. Shafi'i/Hanbali stricter.
- Animal rennet: Hanafi applies istihalah (transformation makes it halal). \
  Others require halal-slaughtered source.

Classification rules:
1. Use the knowledge base context AND your knowledge of fiqh for the selected madhab.
2. The status MUST reflect the SELECTED madhab's ruling, not the strictest view.
3. If the ruling differs across schools, add a "madhab_note" explaining what \
   other schools say (e.g., "Halal in Shafi'i, Maliki, and Hanbali schools").
4. If source is ambiguous (could be plant or animal), classify as MUSHBOOH.
5. Always provide a brief explanation and source reference.

STRICT RULES — DO NOT VIOLATE:
6. You MUST ONLY classify the exact ingredients provided in the list below. \
   Do NOT add, invent, or infer any ingredients not explicitly listed.
7. The "name" field in each ingredient output MUST match the exact ingredient name \
   from the user's list. Do not rename, rewrite, or embellish ingredient names.
8. If you are unsure about an ingredient, classify it as MUSHBOOH with \
   confidence < 0.5. Do NOT guess or fabricate a ruling.

Output JSON format:
{
  "product_name": "string or null",
  "overall_status": "halal|haram|mushbooh",
  "ingredients": [
    {
      "name": "ingredient name (MUST match the user's list exactly)",
      "status": "halal|haram|mushbooh",
      "confidence": 0.0-1.0,
      "explanation": "why this classification under the selected madhab",
      "e_number": "if applicable, else null",
      "source_reference": "Islamic ruling source",
      "madhab_note": "if ruling differs across schools, explain here; else null"
    }
  ],
  "summary": "brief overall assessment mentioning the selected madhab",
  "recommendation": "what the user should do"
}

Overall status logic (based on SELECTED madhab only):
- If ANY ingredient is HARAM per selected madhab, overall_status = "haram"
- If no haram but ANY is MUSHBOOH, overall_status = "mushbooh"
- Only if ALL are HALAL per selected madhab, overall_status = "halal"
"""

MAX_RETRIES = 2


async def classify_ingredients(
    client: AsyncOpenAI,
    ingredients: List[str],
    context: str,
    madhab: str,
    model: str = "deepseek-chat",
) -> ClassificationResponse:
    numbered_list = "\n".join(f"  {i+1}. {ing}" for i, ing in enumerate(ingredients))
    user_message = (
        f"Madhab (school of thought): {madhab}\n\n"
        f"Ingredients to classify (classify ONLY these {len(ingredients)} ingredients, no more, no less):\n"
        f"{numbered_list}\n\n"
        f"Knowledge base context:\n{context}"
    )

    for attempt in range(MAX_RETRIES):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0,
                response_format={"type": "json_object"},
            )

            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)
            result = ClassificationResponse(**parsed)

            # Post-validation: strip any hallucinated ingredients not in the input
            input_names = {ing.strip().lower() for ing in ingredients}
            validated_ingredients = []
            for ing_result in result.ingredients:
                if ing_result.name.strip().lower() in input_names:
                    validated_ingredients.append(ing_result)
                else:
                    logger.warning(
                        "LLM hallucinated ingredient '%s' — not in input list, stripping",
                        ing_result.name,
                    )

            # If LLM missed some ingredients, that's acceptable (they'll just not appear)
            # But make sure we recalculate overall_status from validated list
            if len(validated_ingredients) != len(result.ingredients):
                statuses = [r.status for r in validated_ingredients]
                if "haram" in statuses:
                    overall = "haram"
                elif "mushbooh" in statuses:
                    overall = "mushbooh"
                else:
                    overall = "halal"
                result = result.model_copy(update={
                    "ingredients": validated_ingredients,
                    "overall_status": overall,
                })

            return result

        except json.JSONDecodeError as e:
            logger.warning(
                "LLM returned invalid JSON (attempt %d/%d): %s",
                attempt + 1,
                MAX_RETRIES,
                e,
            )
            if attempt == MAX_RETRIES - 1:
                raise ValueError(
                    "LLM failed to return valid JSON after retries"
                ) from e

        except Exception as e:
            logger.error(
                "LLM classification error (attempt %d/%d): %s",
                attempt + 1,
                MAX_RETRIES,
                e,
            )
            if attempt == MAX_RETRIES - 1:
                raise

    raise ValueError("Classification failed after all retries")


IMAGE_EXTRACTION_PROMPT = """\
Extract the ingredient list from this food label image.

STRICT RULES:
1. Return ONLY ingredients that you can actually READ in the image text.
2. Return them as a comma-separated list.
3. Do NOT include quantities, percentages, or nutritional information.
4. Do NOT guess or infer ingredients that are blurry or unreadable.
5. If only some ingredients are readable, return ONLY those you can read.
6. If you cannot read ANY ingredients at all, respond with exactly: UNREADABLE
7. Do NOT add common ingredients that you "expect" to see — only return what the image text actually says.

Return ONLY the comma-separated ingredient list, nothing else."""


async def extract_ingredients_from_image(
    client: AsyncOpenAI,
    image_base64: str,
    model: str = "deepseek-chat",
) -> str:
    """Use DeepSeek vision to extract ingredient text from an image (fallback OCR)."""
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        },
                    },
                    {
                        "type": "text",
                        "text": IMAGE_EXTRACTION_PROMPT,
                    },
                ],
            }
        ],
        temperature=0,
    )

    return response.choices[0].message.content.strip()
