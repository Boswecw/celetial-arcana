#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive test suite for Celestia Arcana project
Tests: Python backend, data files, configuration, and integration
"""

import unittest
import json
import os
import sys
from pathlib import Path
import astro_tarot_reader as atr


class TestProjectStructure(unittest.TestCase):
    """Test project structure and files"""
    
    def test_project_root_exists(self):
        """Test project root directory exists"""
        self.assertTrue(os.path.isdir('.'))
    
    def test_package_json_exists(self):
        """Test package.json exists"""
        self.assertTrue(os.path.isfile('package.json'))
    
    def test_src_directory_exists(self):
        """Test src directory exists"""
        self.assertTrue(os.path.isdir('src'))
    
    def test_data_directory_exists(self):
        """Test data directory exists"""
        self.assertTrue(os.path.isdir('data'))
    
    def test_scripts_directory_exists(self):
        """Test scripts directory exists"""
        self.assertTrue(os.path.isdir('scripts'))
    
    def test_static_directory_exists(self):
        """Test static directory exists"""
        self.assertTrue(os.path.isdir('static'))


class TestDataFiles(unittest.TestCase):
    """Test data files integrity"""
    
    def test_tarot_knowledge_exists(self):
        """Test tarot knowledge file exists"""
        self.assertTrue(os.path.isfile('data/tarot_knowledge.json'))
    
    def test_tarot_knowledge_valid_json(self):
        """Test tarot knowledge is valid JSON"""
        with open('data/tarot_knowledge.json', 'r') as f:
            data = json.load(f)
            self.assertIsInstance(data, dict)
    
    def test_tarot_knowledge_has_cards(self):
        """Test tarot knowledge has cards"""
        with open('data/tarot_knowledge.json', 'r') as f:
            data = json.load(f)
            self.assertGreater(len(data), 0)
    
    def test_constellation_knowledge_exists(self):
        """Test constellation knowledge file exists"""
        self.assertTrue(os.path.isfile('data/constellation_knowledge.json'))
    
    def test_constellation_knowledge_valid_json(self):
        """Test constellation knowledge is valid JSON"""
        with open('data/constellation_knowledge.json', 'r') as f:
            data = json.load(f)
            self.assertIsInstance(data, dict)
    
    def test_astrology_context_exists(self):
        """Test astrology context file exists"""
        self.assertTrue(os.path.isfile('data/astrology_context.json'))
    
    def test_astrology_context_valid_json(self):
        """Test astrology context is valid JSON"""
        with open('data/astrology_context.json', 'r') as f:
            data = json.load(f)
            self.assertIsInstance(data, dict)


class TestPythonBackend(unittest.TestCase):
    """Test Python backend functionality"""
    
    def test_astro_tarot_reader_imports(self):
        """Test astro_tarot_reader module imports"""
        self.assertIsNotNone(atr)
    
    def test_main_functions_exist(self):
        """Test main functions exist"""
        functions = [
            'call_ollama',
            'synthesize_reading',
            'load_card_kb',
            'load_constellation_kb',
        ]
        for func in functions:
            self.assertTrue(hasattr(atr, func), f"Function {func} not found")
    
    def test_kb_loading(self):
        """Test knowledge base loading"""
        card_kb = atr.load_card_kb()
        self.assertIsInstance(card_kb, dict)
        self.assertGreater(len(card_kb), 0)
    
    def test_constellation_kb_loading(self):
        """Test constellation KB loading"""
        const_kb = atr.load_constellation_kb()
        self.assertIsInstance(const_kb, dict)
    
    def test_card_lookup(self):
        """Test card lookup functionality"""
        info = atr.kb_lookup("The Hermit")
        self.assertIsInstance(info, dict)
    
    def test_element_lookup(self):
        """Test element lookup"""
        element = atr.kb_element("The Hermit")
        self.assertIsInstance(element, str)
    
    def test_major_arcana_detection(self):
        """Test major arcana detection"""
        is_major = atr.kb_is_major("The Hermit")
        self.assertIsInstance(is_major, bool)


class TestPerformanceFeatures(unittest.TestCase):
    """Test performance improvements"""
    
    def setUp(self):
        """Clear caches before each test"""
        atr.clear_all_caches()
    
    def test_http_session_exists(self):
        """Test HTTP session function exists"""
        self.assertTrue(hasattr(atr, 'get_http_session'))
    
    def test_cache_stats_function_exists(self):
        """Test cache stats function exists"""
        self.assertTrue(hasattr(atr, 'get_cache_stats'))
    
    def test_cache_stats_retrieval(self):
        """Test cache stats can be retrieved"""
        stats = atr.get_cache_stats()
        self.assertIsInstance(stats, dict)
        self.assertIn('response_cache_size', stats)
        self.assertIn('cache_enabled', stats)
    
    def test_clear_caches_function_exists(self):
        """Test clear caches function exists"""
        self.assertTrue(hasattr(atr, 'clear_all_caches'))
    
    def test_reload_kbs_function_exists(self):
        """Test reload KBs function exists"""
        self.assertTrue(hasattr(atr, 'reload_kbs'))


class TestConfigurationFiles(unittest.TestCase):
    """Test configuration files"""
    
    def test_package_json_valid(self):
        """Test package.json is valid"""
        with open('package.json', 'r') as f:
            data = json.load(f)
            self.assertIn('name', data)
            self.assertEqual(data['name'], 'celestia-arcana')
    
    def test_package_json_has_scripts(self):
        """Test package.json has scripts"""
        with open('package.json', 'r') as f:
            data = json.load(f)
            self.assertIn('scripts', data)
            self.assertIn('dev', data['scripts'])
    
    def test_package_json_has_dependencies(self):
        """Test package.json has dependencies"""
        with open('package.json', 'r') as f:
            data = json.load(f)
            self.assertIn('dependencies', data)
            self.assertGreater(len(data['dependencies']), 0)
    
    def test_tsconfig_exists(self):
        """Test tsconfig.json exists"""
        self.assertTrue(os.path.isfile('tsconfig.json'))
    
    def test_svelte_config_exists(self):
        """Test svelte.config.js exists"""
        self.assertTrue(os.path.isfile('svelte.config.js'))
    
    def test_tailwind_config_exists(self):
        """Test tailwind.config.js exists"""
        self.assertTrue(os.path.isfile('tailwind.config.js'))


class TestSourceFiles(unittest.TestCase):
    """Test source files exist"""
    
    def test_main_page_exists(self):
        """Test main page exists"""
        self.assertTrue(os.path.isfile('src/routes/+page.svelte'))
    
    def test_layout_exists(self):
        """Test layout exists"""
        self.assertTrue(os.path.isfile('src/routes/+layout.svelte'))
    
    def test_app_html_exists(self):
        """Test app.html exists"""
        self.assertTrue(os.path.isfile('src/app.html'))
    
    def test_app_css_exists(self):
        """Test app.css exists"""
        self.assertTrue(os.path.isfile('src/app.css'))
    
    def test_lib_files_exist(self):
        """Test lib files exist"""
        lib_files = [
            'src/lib/tarot.ts',
            'src/lib/ephemeris.ts',
            'src/lib/guardrails.ts',
            'src/lib/rag.ts',
            'src/lib/rulesEngine.ts',
            'src/lib/aiTrainer.ts',
        ]
        for file in lib_files:
            self.assertTrue(os.path.isfile(file), f"File {file} not found")


class TestAPIEndpoints(unittest.TestCase):
    """Test API endpoint files exist"""
    
    def test_astro_tarot_api_exists(self):
        """Test astro-tarot API exists"""
        self.assertTrue(os.path.isdir('src/routes/api/astro-tarot'))
    
    def test_reading_api_exists(self):
        """Test reading API exists"""
        self.assertTrue(os.path.isdir('src/routes/api/reading'))
    
    def test_cards_api_exists(self):
        """Test cards API exists"""
        self.assertTrue(os.path.isdir('src/routes/api/cards'))
    
    def test_ephemeris_api_exists(self):
        """Test ephemeris API exists"""
        self.assertTrue(os.path.isdir('src/routes/api/ephemeris'))


class TestComponentFiles(unittest.TestCase):
    """Test component files exist"""
    
    def test_components_directory_exists(self):
        """Test components directory exists"""
        self.assertTrue(os.path.isdir('src/lib/components'))
    
    def test_card_component_exists(self):
        """Test Card component exists"""
        self.assertTrue(os.path.isfile('src/lib/components/Card.svelte'))
    
    def test_reading_explainer_exists(self):
        """Test ReadingExplainer component exists"""
        self.assertTrue(os.path.isfile('src/lib/components/ReadingExplainer.svelte'))


class TestDeckFiles(unittest.TestCase):
    """Test deck files"""
    
    def test_decks_directory_exists(self):
        """Test decks directory exists"""
        self.assertTrue(os.path.isdir('src/lib/decks'))
    
    def test_celestia_arcana_deck_exists(self):
        """Test Celestia Arcana deck exists"""
        self.assertTrue(os.path.isfile('src/lib/decks/celestia-arcana.ts'))
    
    def test_rider_waite_deck_exists(self):
        """Test Rider-Waite deck exists"""
        self.assertTrue(os.path.isfile('src/lib/decks/rider-waite.ts'))
    
    def test_deck_index_exists(self):
        """Test deck index exists"""
        self.assertTrue(os.path.isfile('src/lib/decks/index.ts'))


class TestStaticAssets(unittest.TestCase):
    """Test static assets"""
    
    def test_static_directory_exists(self):
        """Test static directory exists"""
        self.assertTrue(os.path.isdir('static'))
    
    def test_favicon_exists(self):
        """Test favicon exists"""
        self.assertTrue(os.path.isfile('static/favicon.ico'))
    
    def test_cards_directory_exists(self):
        """Test cards directory exists"""
        self.assertTrue(os.path.isdir('static/cards'))


def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestProjectStructure))
    suite.addTests(loader.loadTestsFromTestCase(TestDataFiles))
    suite.addTests(loader.loadTestsFromTestCase(TestPythonBackend))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceFeatures))
    suite.addTests(loader.loadTestsFromTestCase(TestConfigurationFiles))
    suite.addTests(loader.loadTestsFromTestCase(TestSourceFiles))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIEndpoints))
    suite.addTests(loader.loadTestsFromTestCase(TestComponentFiles))
    suite.addTests(loader.loadTestsFromTestCase(TestDeckFiles))
    suite.addTests(loader.loadTestsFromTestCase(TestStaticAssets))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

