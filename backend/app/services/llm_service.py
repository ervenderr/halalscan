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

Output JSON format:
{
  "product_name": "string or null",
  "overall_status": "halal|haram|mushbooh",
  "ingredients": [
    {
      "name": "ingredient name",
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
    user_message = (
        f"Madhab (school of thought): {madhab}\n\n"
        f"Ingredients to classify:\n{', '.join(ingredients)}\n\n"
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
            return ClassificationResponse(**parsed)

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
                        "text": (
                            "Extract the ingredient list from this food label image. "
                            "Return ONLY the ingredients as a comma-separated list. "
                            "Do not include quantities, percentages, or nutritional info. "
                            "If you cannot read the ingredients, respond with 'UNREADABLE'."
                        ),
                    },
                ],
            }
        ],
        temperature=0,
    )

    return response.choices[0].message.content.strip()
