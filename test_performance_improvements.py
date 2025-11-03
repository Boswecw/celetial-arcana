#!/usr/bin/env python3
"""
Performance-oriented regression tests for Celestia Arcana.
These tests ensure common data-loading and processing paths remain fast
and that caching utilities behave as expected.
"""

from __future__ import annotations

import importlib
import json
import time
import unittest

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
MAX_LOAD_SECONDS = 2.0  # Generous threshold for CI / constrained environments
MAX_PROCESS_SECONDS = 1.0


def _load_json(path: str):
    with (PROJECT_ROOT / path).open(encoding="utf-8") as fh:
        return json.load(fh)


class TestJsonLoadingPerformance(unittest.TestCase):
    def test_load_celestia_kb_speed(self):
        start = time.perf_counter()
        data = _load_json("data/celestia_arcana_knowledge.json")
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_LOAD_SECONDS)
        self.assertIn("cards", data)

    def test_load_tarot_kb_speed(self):
        start = time.perf_counter()
        data = _load_json("data/tarot_knowledge.json")
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_LOAD_SECONDS)
        self.assertEqual(len(data.get("cards", [])), 78)

    def test_load_constellation_kb_speed(self):
        start = time.perf_counter()
        data = _load_json("data/constellation_knowledge.json")
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_LOAD_SECONDS)
        self.assertIn("constellations", data)

    def test_load_tarot528_speed(self):
        start = time.perf_counter()
        data = _load_json("data/tarot_528_symbolic_meanings.json")
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_LOAD_SECONDS)
        self.assertIn("meanings", data)

    def test_load_astrology_context_speed(self):
        start = time.perf_counter()
        data = _load_json("data/astrology_context.json")
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_LOAD_SECONDS)
        self.assertIn("sun", data)

    def test_cards_iteration_speed(self):
        data = _load_json("data/celestia_arcana_knowledge.json")
        start = time.perf_counter()
        names = [card["name"] for card in data["cards"]]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertEqual(len(names), 78)

    def test_keyword_filter_speed(self):
        data = _load_json("data/tarot_knowledge.json")
        start = time.perf_counter()
        filtered = [
            card["name"]
            for card in data["cards"]
            if "intuition" in " ".join(card.get("keywords_upright", [])).lower()
        ]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(filtered), 0)

    def test_grouping_cards_speed(self):
        data = _load_json("data/tarot_knowledge.json")
        start = time.perf_counter()
        grouped = {}
        for card in data["cards"]:
            grouped.setdefault(card["arcana"], []).append(card["name"])
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertIn("Major", grouped)


class TestAstroTarotCachingPerformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = importlib.import_module("astro_tarot_reader")
        cls.module.clear_all_caches()

    def test_card_kb_caching_returns_same_object(self):
        first = self.module.load_card_kb(force_reload=True)
        second = self.module.load_card_kb()
        self.assertIs(first, second)

    def test_constellation_kb_caching_returns_same_object(self):
        first = self.module.load_constellation_kb(force_reload=True)
        second = self.module.load_constellation_kb()
        self.assertIs(first, second)

    def test_clear_all_caches_resets_card_cache(self):
        original = self.module.load_card_kb()
        self.module.clear_all_caches()
        refreshed = self.module.load_card_kb(force_reload=True)
        self.assertIsNot(original, refreshed)

    def test_clear_all_caches_resets_http_session(self):
        session_a = self.module.get_http_session()
        self.module.clear_all_caches()
        session_b = self.module.get_http_session()
        self.assertIsNot(session_a, session_b)

    def test_cache_key_generation_speed(self):
        start = time.perf_counter()
        for idx in range(500):
            self.module._get_cache_key("s", f"user {idx}", "model", 0.2, 100)
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)

    def test_response_cache_stores_entries_quickly(self):
        key = self.module._get_cache_key("sys", "user", "model", 0.4, 200)
        self.module._RESPONSE_CACHE.clear()
        start = time.perf_counter()
        self.module._RESPONSE_CACHE[key] = "response"
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertIn(key, self.module._RESPONSE_CACHE)


class TestDataProcessingPerformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        module = importlib.import_module("astro_tarot_reader")
        cards_map = module.load_card_kb(force_reload=True)
        cls.cards = list(cards_map.values())

    def test_major_arcana_filter_speed(self):
        start = time.perf_counter()
        majors = [card for card in self.cards if card.get("arcana") == "Major"]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(majors), 0)

    def test_minor_arcana_filter_speed(self):
        start = time.perf_counter()
        minors = [card for card in self.cards if card.get("arcana") == "Minor"]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(minors), 0)

    def test_element_distribution_speed(self):
        start = time.perf_counter()
        counts = {}
        for card in self.cards:
            counts[card.get("element", "Unknown")] = counts.get(card.get("element", "Unknown"), 0) + 1
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertIn("Fire", counts)

    def test_keyword_flatten_speed(self):
        start = time.perf_counter()
        keywords = [
            kw
            for card in self.cards
            for kw in card.get("keywords_upright", [])
        ]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(keywords), 0)

    def test_lookup_by_name_speed(self):
        target = self.cards[0]["name"]
        start = time.perf_counter()
        found = next(card for card in self.cards if card["name"] == target)
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertEqual(found["name"], target)

    def test_reverse_lookup_speed(self):
        target = self.cards[-1]["name"]
        start = time.perf_counter()
        found = next(card for card in reversed(self.cards) if card["name"] == target)
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertEqual(found["name"], target)

    def test_card_name_sort_speed(self):
        start = time.perf_counter()
        sorted_names = sorted({card["name"] for card in self.cards})
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(sorted_names), 0)

    def test_unique_keyword_count_speed(self):
        start = time.perf_counter()
        unique_keywords = {
            kw.lower()
            for card in self.cards
            for kw in card.get("keywords_upright", [])
        }
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(unique_keywords), 0)

    def test_card_index_lookup_speed(self):
        mapping = {card["name"]: idx for idx, card in enumerate(self.cards)}
        target = self.cards[10]["name"]
        start = time.perf_counter()
        idx = mapping[target]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertEqual(self.cards[idx]["name"], target)

    def test_card_search_speed(self):
        start = time.perf_counter()
        matches = [
            card["name"]
            for card in self.cards
            if "love" in " ".join(card.get("keywords_upright", [])).lower()
        ]
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(matches), 0)

    def test_card_map_speed(self):
        start = time.perf_counter()
        energies = {card["name"]: card.get("element") for card in self.cards}
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(energies), 0)

    def test_keyword_frequency_speed(self):
        start = time.perf_counter()
        frequency = {}
        for card in self.cards:
            for kw in card.get("keywords_upright", []):
                frequency[kw] = frequency.get(kw, 0) + 1
        duration = time.perf_counter() - start
        self.assertLess(duration, MAX_PROCESS_SECONDS)
        self.assertGreater(len(frequency), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
