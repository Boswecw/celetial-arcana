#!/usr/bin/env python3
"""
Comprehensive backend and project structure tests for Celestia Arcana.
These tests focus on verifying critical project files, data integrity,
and Python module readiness without invoking external services.
"""

from __future__ import annotations

import importlib
import json
import pathlib
import unittest

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent


class TestProjectStructure(unittest.TestCase):
    """Validate required files and directories exist."""


def _make_path_test(path: pathlib.Path, kind: str):
    def _test(self):
        if kind == "file":
            self.assertTrue(path.is_file(), f"Expected file missing: {path}")
        else:
            self.assertTrue(path.is_dir(), f"Expected directory missing: {path}")

    return _test


_PATH_CHECKS = [
    ("package_json", PROJECT_ROOT / "package.json", "file"),
    ("svelte_config", PROJECT_ROOT / "svelte.config.js", "file"),
    ("vite_config", PROJECT_ROOT / "vite.config.ts", "file"),
    ("tailwind_config", PROJECT_ROOT / "tailwind.config.js", "file"),
    ("postcss_config", PROJECT_ROOT / "postcss.config.js", "file"),
    ("tsconfig", PROJECT_ROOT / "tsconfig.json", "file"),
    ("astro_tarot_reader", PROJECT_ROOT / "astro_tarot_reader.py", "file"),
    ("run_all_tests", PROJECT_ROOT / "run_all_tests.sh", "file"),
    ("readme", PROJECT_ROOT / "README.md", "file"),
    ("env_file", PROJECT_ROOT / ".env", "file"),
    ("src_dir", PROJECT_ROOT / "src", "dir"),
    ("routes_dir", PROJECT_ROOT / "src" / "routes", "dir"),
    ("lib_dir", PROJECT_ROOT / "src" / "lib", "dir"),
    ("components_dir", PROJECT_ROOT / "src" / "lib" / "components", "dir"),
    ("decks_dir", PROJECT_ROOT / "src" / "lib" / "decks", "dir"),
    ("assets_dir", PROJECT_ROOT / "src" / "lib" / "assets", "dir"),
    ("static_dir", PROJECT_ROOT / "static", "dir"),
    ("cards_dir", PROJECT_ROOT / "static" / "cards", "dir"),
    ("data_dir", PROJECT_ROOT / "data", "dir"),
    ("scripts_dir", PROJECT_ROOT / "scripts", "dir"),
]

for idx, (name, path, kind) in enumerate(_PATH_CHECKS, start=1):
    setattr(
        TestProjectStructure,
        f"test_{idx:02d}_{name}",
        _make_path_test(path, kind),
    )


class TestPackageJson(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with (PROJECT_ROOT / "package.json").open(encoding="utf-8") as fh:
            cls.pkg = json.load(fh)

    def test_package_has_name(self):
        self.assertEqual(self.pkg.get("name"), "celestia-arcana")

    def test_package_is_private(self):
        self.assertTrue(self.pkg.get("private"))

    def test_package_has_dev_script(self):
        self.assertIn("dev", self.pkg.get("scripts", {}))

    def test_package_has_build_script(self):
        self.assertIn("build", self.pkg.get("scripts", {}))

    def test_package_has_prepare_script(self):
        self.assertIn("prepare", self.pkg.get("scripts", {}))

    def test_package_has_vite_dependency(self):
        self.assertIn("vite", self.pkg.get("devDependencies", {}))

    def test_package_has_svelte_dependency(self):
        self.assertIn("svelte", self.pkg.get("devDependencies", {}))

    def test_package_has_typescript_dependency(self):
        self.assertIn("typescript", self.pkg.get("devDependencies", {}))


class TestDataFiles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.celestia = _load_json("data/celestia_arcana_knowledge.json")
        cls.constellations = _load_json("data/constellation_knowledge.json")
        cls.tarot = _load_json("data/tarot_knowledge.json")
        cls.tarot528 = _load_json("data/tarot_528_symbolic_meanings.json")
        cls.astrology = _load_json("data/astrology_context.json")

    def test_celestia_kb_has_meta(self):
        self.assertIn("meta", self.celestia)

    def test_celestia_kb_has_78_cards(self):
        self.assertEqual(len(self.celestia.get("cards", [])), 78)

    def test_celestia_cards_have_required_fields(self):
        required = {"name", "arcana", "element", "keywords_upright", "keywords_reversed"}
        first_card = self.celestia["cards"][0]
        self.assertTrue(required.issubset(first_card))

    def test_constellation_kb_has_meta(self):
        self.assertIn("meta", self.constellations)

    def test_constellation_kb_has_entries(self):
        self.assertGreater(len(self.constellations.get("constellations", {})), 0)

    def test_constellation_entries_have_meanings(self):
        entry = next(iter(self.constellations["constellations"].values()))
        self.assertIn("meanings", entry)
        self.assertGreater(len(entry["meanings"]), 0)

    def test_tarot_kb_has_meta(self):
        self.assertIn("meta", self.tarot)

    def test_tarot_kb_has_78_cards(self):
        self.assertEqual(len(self.tarot.get("cards", [])), 78)

    def test_tarot528_has_meta(self):
        self.assertIn("meta", self.tarot528)

    def test_astrology_context_has_core_fields(self):
        for key in ("sun", "moon", "asc", "lunar_phase"):
            self.assertIn(key, self.astrology)


def _load_json(relative_path: str):
    with (PROJECT_ROOT / relative_path).open(encoding="utf-8") as fh:
        return json.load(fh)


class TestAstroTarotModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.module = importlib.import_module("astro_tarot_reader")

    def test_schema_has_meta(self):
        self.assertIn("meta", self.module.SCHEMA_JSON)

    def test_schema_has_interpretation(self):
        self.assertIn("interpretation", self.module.SCHEMA_JSON)

    def test_default_model_is_gpt_4o_mini(self):
        self.assertEqual(self.module.DEFAULT_MODEL, "gpt-4o-mini")

    def test_load_card_kb_returns_cards(self):
        kb = self.module.load_card_kb(force_reload=True)
        self.assertGreaterEqual(len(kb), 78)
        self.assertIn("The Fool", kb)

    def test_load_constellation_kb_returns_dict(self):
        kb = self.module.load_constellation_kb(force_reload=True)
        self.assertIsInstance(kb.get("constellations"), dict)

    def test_get_http_session_is_singleton(self):
        session_a = self.module.get_http_session()
        session_b = self.module.get_http_session()
        self.assertIs(session_a, session_b)


class TestSvelteRoutes(unittest.TestCase):
    def test_main_page_exists(self):
        self.assertTrue((PROJECT_ROOT / "src" / "routes" / "+page.svelte").is_file())

    def test_reading_page_exists(self):
        self.assertTrue((PROJECT_ROOT / "src" / "routes" / "reading" / "+page.svelte").is_file())

    def test_deck_page_exists(self):
        self.assertTrue((PROJECT_ROOT / "src" / "routes" / "deck" / "+page.svelte").is_file())

    def test_alignment_page_exists(self):
        self.assertTrue((PROJECT_ROOT / "src" / "routes" / "alignment" / "+page.svelte").is_file())

    def test_dashboard_page_exists(self):
        self.assertTrue((PROJECT_ROOT / "src" / "routes" / "dashboard" / "+page.svelte").is_file())

    def test_astro_tarot_api_exists(self):
        self.assertTrue(
            (PROJECT_ROOT / "src" / "routes" / "api" / "astro-tarot" / "+server.ts").is_file()
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
