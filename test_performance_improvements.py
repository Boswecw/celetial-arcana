#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test suite for performance improvements to astro_tarot_reader.py
Tests: HTTP pooling, KB caching, response caching, JSON repair, retry logic
"""

import unittest
import time
import json
import sys
from unittest.mock import patch, MagicMock
import astro_tarot_reader as atr


class TestHTTPSessionPooling(unittest.TestCase):
    """Test HTTP connection pooling"""
    
    def test_session_creation(self):
        """Test that HTTP session is created"""
        session = atr.get_http_session()
        self.assertIsNotNone(session)
        self.assertEqual(type(session).__name__, 'Session')
    
    def test_session_reuse(self):
        """Test that HTTP session is reused"""
        session1 = atr.get_http_session()
        session2 = atr.get_http_session()
        self.assertIs(session1, session2)
    
    def test_session_has_adapters(self):
        """Test that session has HTTP adapters configured"""
        session = atr.get_http_session()
        self.assertIn('http://', session.adapters)
        self.assertIn('https://', session.adapters)


class TestKBCaching(unittest.TestCase):
    """Test knowledge base caching"""
    
    def setUp(self):
        """Clear caches before each test"""
        atr.clear_all_caches()
    
    def test_card_kb_lazy_loading(self):
        """Test that card KB is lazy loaded"""
        kb = atr.get_card_kb()
        self.assertIsInstance(kb, dict)
        self.assertGreater(len(kb), 0)
    
    def test_card_kb_caching(self):
        """Test that card KB is cached"""
        kb1 = atr.get_card_kb()
        kb2 = atr.get_card_kb()
        self.assertIs(kb1, kb2)
    
    def test_constellation_kb_lazy_loading(self):
        """Test that constellation KB is lazy loaded"""
        kb = atr.get_constellation_kb()
        self.assertIsInstance(kb, dict)
    
    def test_constellation_kb_caching(self):
        """Test that constellation KB is cached"""
        kb1 = atr.get_constellation_kb()
        kb2 = atr.get_constellation_kb()
        self.assertIs(kb1, kb2)
    
    def test_kb_reload(self):
        """Test KB reload functionality"""
        kb1 = atr.get_card_kb()
        atr.reload_kbs(force=True)
        kb2 = atr.get_card_kb()
        # Should be different objects after reload
        self.assertIsNot(kb1, kb2)
        # But same content
        self.assertEqual(len(kb1), len(kb2))


class TestResponseCaching(unittest.TestCase):
    """Test response caching"""
    
    def setUp(self):
        """Clear caches before each test"""
        atr.clear_all_caches()
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        key1 = atr._get_cache_key("sys", "user", "model", 0.5, 100)
        key2 = atr._get_cache_key("sys", "user", "model", 0.5, 100)
        self.assertEqual(key1, key2)
        self.assertEqual(len(key1), 64)  # SHA256 hex is 64 chars
    
    def test_cache_key_uniqueness(self):
        """Test that different inputs produce different keys"""
        key1 = atr._get_cache_key("sys1", "user", "model", 0.5, 100)
        key2 = atr._get_cache_key("sys2", "user", "model", 0.5, 100)
        self.assertNotEqual(key1, key2)
    
    def test_cache_stats_initial(self):
        """Test initial cache stats"""
        stats = atr.get_cache_stats()
        self.assertEqual(stats['response_cache_size'], 0)
        self.assertTrue(stats['cache_enabled'])
        self.assertEqual(stats['perf_stats']['cache_hits'], 0)
        self.assertEqual(stats['perf_stats']['cache_misses'], 0)


class TestJSONRepair(unittest.TestCase):
    """Test JSON repair functionality"""
    
    def test_smart_quotes_repair(self):
        """Test smart quote replacement"""
        malformed = '{"key": "value"}'  # with smart quotes
        repaired = atr._basic_json_repairs(malformed)
        self.assertIn('"', repaired)
    
    def test_single_quoted_keys_repair(self):
        """Test single-quoted key repair"""
        malformed = "{'key': 'value'}"
        repaired = atr._basic_json_repairs(malformed)
        # Should have double quotes
        self.assertIn('"key"', repaired)
    
    def test_trailing_comma_repair(self):
        """Test trailing comma removal"""
        malformed = '{"key": "value",}'
        repaired = atr._basic_json_repairs(malformed)
        # Should not have trailing comma
        self.assertNotIn(',}', repaired)
    
    def test_extract_balanced_json(self):
        """Test balanced JSON extraction"""
        text = 'Some text before {"key": "value"} and after'
        extracted = atr._extract_balanced_json(text)
        self.assertEqual(extracted, '{"key": "value"}')
    
    def test_extract_json_with_markdown(self):
        """Test JSON extraction from markdown code block"""
        text = '```json\n{"key": "value"}\n```'
        extracted = atr._extract_balanced_json(text)
        self.assertEqual(extracted, '{"key": "value"}')


class TestCacheManagement(unittest.TestCase):
    """Test cache management utilities"""
    
    def setUp(self):
        """Setup before each test"""
        atr.clear_all_caches()
    
    def test_clear_all_caches(self):
        """Test clearing all caches"""
        # Load KBs to populate caches
        atr.get_card_kb()
        atr.get_constellation_kb()
        
        # Clear caches
        atr.clear_all_caches()
        
        # Verify caches are cleared
        stats = atr.get_cache_stats()
        self.assertEqual(stats['response_cache_size'], 0)
    
    def test_reload_kbs(self):
        """Test KB reload"""
        atr.get_card_kb()
        initial_stats = atr.get_cache_stats()
        
        atr.reload_kbs(force=True)
        after_stats = atr.get_cache_stats()
        
        # KB reloads should have incremented
        self.assertGreater(
            after_stats['perf_stats']['kb_reloads'],
            initial_stats['perf_stats']['kb_reloads']
        )


class TestKBLookup(unittest.TestCase):
    """Test KB lookup functions"""
    
    def test_kb_lookup_hermit(self):
        """Test looking up The Hermit card"""
        info = atr.kb_lookup("The Hermit")
        self.assertIsInstance(info, dict)
        if info:
            self.assertIn('element', info)
    
    def test_kb_element_lookup(self):
        """Test element lookup"""
        element = atr.kb_element("The Hermit")
        self.assertIsInstance(element, str)
    
    def test_kb_is_major(self):
        """Test major arcana detection"""
        is_major = atr.kb_is_major("The Hermit")
        self.assertIsInstance(is_major, bool)
    
    def test_kb_keywords(self):
        """Test keyword lookup"""
        keywords = atr.kb_keywords("The Hermit")
        self.assertIsInstance(keywords, list)


class TestErrorHandling(unittest.TestCase):
    """Test error handling"""
    
    def test_load_json_missing_file(self):
        """Test loading non-existent JSON file"""
        result = atr.load_json_if_exists("/nonexistent/path/file.json")
        self.assertIsNone(result)
    
    def test_load_json_invalid_json(self):
        """Test loading invalid JSON"""
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("{ invalid json }")
            f.flush()
            result = atr.load_json_if_exists(f.name)
            self.assertIsNone(result)


class TestPerformanceMetrics(unittest.TestCase):
    """Test performance metrics"""
    
    def setUp(self):
        """Clear caches before each test"""
        atr.clear_all_caches()
    
    def test_cache_stats_structure(self):
        """Test cache stats return correct structure"""
        stats = atr.get_cache_stats()
        self.assertIn('response_cache_size', stats)
        self.assertIn('cache_enabled', stats)
        self.assertIn('perf_stats', stats)
        self.assertIn('cache_hits', stats['perf_stats'])
        self.assertIn('cache_misses', stats['perf_stats'])
        self.assertIn('kb_reloads', stats['perf_stats'])
    
    def test_cache_stats_types(self):
        """Test cache stats have correct types"""
        stats = atr.get_cache_stats()
        self.assertIsInstance(stats['response_cache_size'], int)
        self.assertIsInstance(stats['cache_enabled'], bool)
        self.assertIsInstance(stats['perf_stats'], dict)


def run_tests():
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestHTTPSessionPooling))
    suite.addTests(loader.loadTestsFromTestCase(TestKBCaching))
    suite.addTests(loader.loadTestsFromTestCase(TestResponseCaching))
    suite.addTests(loader.loadTestsFromTestCase(TestJSONRepair))
    suite.addTests(loader.loadTestsFromTestCase(TestCacheManagement))
    suite.addTests(loader.loadTestsFromTestCase(TestKBLookup))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorHandling))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceMetrics))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

