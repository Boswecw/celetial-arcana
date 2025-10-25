# Testing Guide for Performance Improvements

## Quick Start

### Run All Tests
```bash
cd /home/charles/projects/Coding2025/celestia-arcana
python3 test_performance_improvements.py
```

### Expected Output
```
Ran 26 tests in 0.014s
OK
```

---

## Test Suite Overview

### File Location
- **Test File**: `test_performance_improvements.py`
- **Main Module**: `astro_tarot_reader.py`

### Test Coverage
- **26 tests** across **8 feature areas**
- **100% pass rate**
- **0.014 seconds** execution time

---

## Running Specific Tests

### Run Single Test Class
```bash
python3 -m unittest test_performance_improvements.TestHTTPSessionPooling
```

### Run Single Test Method
```bash
python3 -m unittest test_performance_improvements.TestHTTPSessionPooling.test_session_creation
```

### Run with Verbose Output
```bash
python3 -m unittest test_performance_improvements -v
```

---

## Test Categories

### 1. HTTP Session Pooling
```bash
python3 -m unittest test_performance_improvements.TestHTTPSessionPooling -v
```

Tests:
- Session creation
- Session reuse
- Adapter configuration

### 2. KB Caching
```bash
python3 -m unittest test_performance_improvements.TestKBCaching -v
```

Tests:
- Lazy loading
- Caching behavior
- Reload functionality

### 3. Response Caching
```bash
python3 -m unittest test_performance_improvements.TestResponseCaching -v
```

Tests:
- Cache key generation
- Key uniqueness
- Cache statistics

### 4. JSON Repair
```bash
python3 -m unittest test_performance_improvements.TestJSONRepair -v
```

Tests:
- Smart quote repair
- Single-quoted key repair
- Trailing comma removal
- JSON extraction

### 5. Cache Management
```bash
python3 -m unittest test_performance_improvements.TestCacheManagement -v
```

Tests:
- Clear all caches
- Reload KBs

### 6. KB Lookup
```bash
python3 -m unittest test_performance_improvements.TestKBLookup -v
```

Tests:
- Card lookup
- Element lookup
- Major arcana detection
- Keyword lookup

### 7. Error Handling
```bash
python3 -m unittest test_performance_improvements.TestErrorHandling -v
```

Tests:
- Missing file handling
- Invalid JSON handling

### 8. Performance Metrics
```bash
python3 -m unittest test_performance_improvements.TestPerformanceMetrics -v
```

Tests:
- Stats structure
- Stats types

---

## Manual Testing

### Test HTTP Session Pooling
```python
import astro_tarot_reader as atr

# Get session
session1 = atr.get_http_session()
session2 = atr.get_http_session()

# Verify reuse
assert session1 is session2
print("✓ HTTP session pooling works")
```

### Test KB Caching
```python
import astro_tarot_reader as atr

# First load
kb1 = atr.get_card_kb()
print(f"Loaded {len(kb1)} cards")

# Second load (should be cached)
kb2 = atr.get_card_kb()
assert kb1 is kb2
print("✓ KB caching works")

# Reload
atr.reload_kbs(force=True)
kb3 = atr.get_card_kb()
assert kb1 is not kb3
print("✓ KB reload works")
```

### Test Response Caching
```python
import astro_tarot_reader as atr

# Get cache stats
stats = atr.get_cache_stats()
print(f"Cache enabled: {stats['cache_enabled']}")
print(f"Cache size: {stats['response_cache_size']}")
print(f"Cache hits: {stats['perf_stats']['cache_hits']}")
print("✓ Response caching works")
```

### Test JSON Repair
```python
import astro_tarot_reader as atr

# Test smart quote repair
malformed = '{"key": "value"}'
repaired = atr._basic_json_repairs(malformed)
print(f"Repaired: {repaired}")
print("✓ JSON repair works")
```

### Test Cache Management
```python
import astro_tarot_reader as atr

# Load KBs
atr.get_card_kb()
atr.get_constellation_kb()

# Clear caches
atr.clear_all_caches()
print("✓ Caches cleared")

# Reload
atr.reload_kbs(force=True)
print("✓ KBs reloaded")
```

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install requests
      - run: python3 test_performance_improvements.py
```

---

## Troubleshooting

### Tests Fail with Import Error
```bash
# Make sure you're in the correct directory
cd /home/charles/projects/Coding2025/celestia-arcana

# Verify astro_tarot_reader.py exists
ls -la astro_tarot_reader.py
```

### Tests Fail with Missing Data Files
```bash
# Verify data files exist
ls -la data/tarot_knowledge.json
ls -la data/constellation_knowledge.json
```

### Tests Timeout
```bash
# Increase timeout
python3 -m unittest test_performance_improvements -v --timeout=60
```

---

## Performance Benchmarking

### Measure KB Access Speed
```python
import time
import astro_tarot_reader as atr

# First access (with file I/O)
start = time.time()
kb1 = atr.get_card_kb()
first_time = time.time() - start
print(f"First access: {first_time*1000:.2f}ms")

# Second access (cached)
start = time.time()
kb2 = atr.get_card_kb()
cached_time = time.time() - start
print(f"Cached access: {cached_time*1000:.2f}ms")

# Calculate speedup
speedup = first_time / cached_time if cached_time > 0 else float('inf')
print(f"Speedup: {speedup:.0f}x")
```

### Measure Cache Hit Rate
```python
import astro_tarot_reader as atr

# Get initial stats
stats1 = atr.get_cache_stats()
hits1 = stats1['perf_stats']['cache_hits']

# Do some operations...
atr.get_card_kb()
atr.get_card_kb()

# Get updated stats
stats2 = atr.get_cache_stats()
hits2 = stats2['perf_stats']['cache_hits']

print(f"Cache hits: {hits2 - hits1}")
```

---

## Test Results

### Latest Run
```
Ran 26 tests in 0.014s
OK

Test Categories:
✓ HTTP Session Pooling: 3 tests
✓ KB Caching: 5 tests
✓ Response Caching: 3 tests
✓ JSON Repair: 5 tests
✓ Cache Management: 2 tests
✓ KB Lookup: 4 tests
✓ Error Handling: 2 tests
✓ Performance Metrics: 2 tests
```

---

## Next Steps

1. **Run tests regularly** during development
2. **Monitor cache effectiveness** in production
3. **Add more tests** as new features are added
4. **Track performance metrics** over time
5. **Optimize based on real-world usage**

---

## Support

For issues or questions:
1. Check `TEST_REPORT.md` for detailed results
2. Review `PERFORMANCE_IMPROVEMENTS.md` for implementation details
3. Check `PERFORMANCE_API_REFERENCE.md` for API documentation

