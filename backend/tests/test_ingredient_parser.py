"""Tests for ingredient_parser service."""

from app.services.ingredient_parser import (
    extract_parenthetical_ingredients,
    parse_ingredients,
)


class TestParseIngredients:
    def test_basic_comma_separated(self):
        result = parse_ingredients("sugar, salt, water, flour")
        assert result == ["sugar", "salt", "water", "flour"]

    def test_with_ingredients_prefix(self):
        result = parse_ingredients("Ingredients: sugar, salt, water")
        assert result == ["sugar", "salt", "water"]

    def test_with_ingredient_prefix_no_colon(self):
        result = parse_ingredients("ingredient sugar, salt, water")
        assert result == ["sugar", "salt", "water"]

    def test_semicolon_separator(self):
        result = parse_ingredients("sugar; salt; water")
        assert result == ["sugar", "salt", "water"]

    def test_and_conjunction(self):
        result = parse_ingredients("sugar, salt and water")
        assert result == ["sugar", "salt", "water"]

    def test_percentages_removed(self):
        result = parse_ingredients("sugar (10%), salt (5%), water")
        assert result == ["sugar", "salt", "water"]

    def test_empty_string(self):
        result = parse_ingredients("")
        assert result == []

    def test_none_input(self):
        result = parse_ingredients(None)
        assert result == []

    def test_whitespace_only(self):
        result = parse_ingredients("   ")
        assert result == []

    def test_single_ingredient(self):
        result = parse_ingredients("sugar")
        assert result == ["sugar"]

    def test_ocr_noise_filtered(self):
        result = parse_ingredients("sugar, , , salt, 5, water")
        assert result == ["sugar", "salt", "water"]

    def test_strips_whitespace(self):
        result = parse_ingredients("  sugar  ,  salt  ,  water  ")
        assert result == ["sugar", "salt", "water"]

    def test_trailing_period_removed(self):
        result = parse_ingredients("sugar, salt, water.")
        assert result == ["sugar", "salt", "water"]

    def test_numbered_list(self):
        result = parse_ingredients("1. sugar, 2. salt, 3. water")
        assert result == ["sugar", "salt", "water"]

    def test_real_label(self):
        text = (
            "Ingredients: Sugar, Glucose Syrup, Gelatine, Dextrose, "
            "Citric Acid, Fruit Juice Concentrate (1%) (Apple, Strawberry, "
            "Raspberry, Orange, Lemon), Flavourings, "
            "Colours (E100, E120, E160a)"
        )
        result = parse_ingredients(text)
        assert "Sugar" in result
        assert "Gelatine" in result
        assert "Citric Acid" in result


class TestExtractParentheticalIngredients:
    def test_simple_parenthetical(self):
        result = extract_parenthetical_ingredients(
            "chocolate (cocoa, sugar, lecithin)"
        )
        assert "cocoa" in result
        assert "sugar" in result
        assert "lecithin" in result

    def test_multiple_groups(self):
        result = extract_parenthetical_ingredients(
            "chocolate (cocoa, sugar), filling (cream, butter)"
        )
        assert "cocoa" in result
        assert "cream" in result

    def test_no_parentheses(self):
        result = extract_parenthetical_ingredients("sugar, salt")
        assert result == []
