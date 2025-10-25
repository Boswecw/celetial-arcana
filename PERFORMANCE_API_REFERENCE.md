# Performance API Reference

## New Public Functions

### Cache Management

#### `get_cache_stats() -> Dict[str, Any]`
Returns current cache statistics.

**Returns:**
```python
{
    "response_cache_size": int,      # Number of cached responses
    "cache_enabled": bool,            # Whether caching is enabled
    "perf_stats": {
        "cache_hits": int,            # Total cache hits
        "cache_misses": int,          # Total cache misses
        "kb_reloads": int             # Total KB reloads
    }
}
```

**Example:**
```python
stats = atr.get_cache_stats()
print(f"Cache hit rate: {stats['perf_stats']['cache_hits']}")
```

---

#### `clear_all_caches() -> None`
Clears all caches (KB, responses, HTTP session).

**Example:**
```python
atr.clear_all_caches()
print("Caches cleared")
```

---

#### `reload_kbs(force: bool = True) -> None`
Reloads knowledge bases from disk.

**Parameters:**
- `force` (bool): Force reload even if cached

**Example:**
```python
atr.reload_kbs(force=True)
```

---

### HTTP Session Management

#### `get_http_session() -> requests.Session`
Gets or creates persistent HTTP session with connection pooling.

**Returns:** `requests.Session` object

**Example:**
```python
session = atr.get_http_session()
# Session is reused for all subsequent requests
```

---

### Knowledge Base Access

#### `get_card_kb() -> Dict[str, dict]`
Gets cached tarot card KB, loading if necessary.

**Returns:** Dictionary mapping card names to card info

**Example:**
```python
kb = atr.get_card_kb()
print(f"Loaded {len(kb)} cards")
```

---

#### `get_constellation_kb() -> Dict[str, dict]`
Gets cached constellation KB, loading if necessary.

**Returns:** Dictionary of constellation data

**Example:**
```python
kb = atr.get_constellation_kb()
```

---

## Configuration

### Environment Variables

```bash
# Enable response caching (default: true)
ENABLE_RESPONSE_CACHE=true|false

# Model and API settings
ASTRO_TAROT_MODEL=llama3
OLLAMA_URL=http://127.0.0.1:11434/api/chat

# Knowledge base paths
TAROT_KB_PATH=data/tarot_knowledge.json
CONSTELLATION_KB_PATH=data/constellation_knowledge.json
```

---

## Internal Functions (Advanced)

### `_get_cache_key(system: str, user: str, model: str, temp: float, num: int) -> str`
Generates SHA256 cache key for model responses.

---

### `_basic_json_repairs(s: str) -> str`
Applies aggressive local JSON repairs without calling model.

**Fixes:**
- Smart quotes → regular quotes
- Single-quoted keys/values → double-quoted
- Trailing commas before closing braces
- Invalid escape sequences
- Unescaped newlines in strings

---

### `repair_to_json(raw_text: str, model: str, temperature: float = 0.1, max_retries: int = 2) -> str`
Repairs malformed JSON by calling model with retry logic.

**Parameters:**
- `raw_text`: Malformed JSON string
- `model`: Model to use for repair
- `temperature`: Model temperature (default: 0.1)
- `max_retries`: Max retry attempts (default: 2)

---

## Performance Tips

1. **Enable caching for repeated questions:**
   ```bash
   ENABLE_RESPONSE_CACHE=true python3 astro_tarot_reader.py
   ```

2. **Reload KBs if they change:**
   ```python
   atr.reload_kbs(force=True)
   ```

3. **Monitor cache effectiveness:**
   ```python
   stats = atr.get_cache_stats()
   hit_rate = stats['perf_stats']['cache_hits'] / (
       stats['perf_stats']['cache_hits'] + 
       stats['perf_stats']['cache_misses']
   )
   print(f"Hit rate: {hit_rate:.1%}")
   ```

4. **Clear caches if memory is tight:**
   ```python
   atr.clear_all_caches()
   ```

---

## Backward Compatibility

All existing functions remain unchanged. New functions are purely additive and optional.

Existing code continues to work without modification:
```python
# This still works exactly as before
reading = atr.synthesize_reading(question, timeframe, astro, spread)
```

