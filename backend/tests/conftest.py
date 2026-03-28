"""Shared test fixtures."""

import pytest


@pytest.fixture
def sample_ingredients_text():
    return "Sugar, Gelatin, Water, Citric Acid, Natural Flavors, E471"


@pytest.fixture
def sample_halal_text():
    return "Water, Sugar, Salt, Flour, Baking Soda"


@pytest.fixture
def sample_haram_text():
    return "Pork Fat, Lard, Gelatin, Ethanol"
