#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Celestia Arcana — Astro + Tarot Synthesizer (ChatGPT via OpenAI API)
- High-timeout + retry networking
- Strict JSON extraction/repair
- Schema normalizer (guarantees stable output)
- Tarot Knowledge Base (78-card slim) integration
- Constellation (Zodiac/stellar archetype) Knowledge Base integration

OUTPUT STRICT SCHEMA (do not add new keys):
{
  "meta": {"question":"", "timeframe":"", "spread_name":"", "timestamp":""},
  "astro_summary": {
    "core": {
      "sun":"", "moon":"", "asc":"",
      "dominant_elements":[],
      "notable_aspects":[{"aspect":"","orb":"","interpretation":""}],
      "lunar_phase":""
    },
    "themes":[]
  },
  "spread_summary": {
    "layout": [],
    "card_elements_count": {"Fire":0,"Earth":0,"Air":0,"Water":0},
    "majors_count": 0
  },
  "resonance": {
    "matches": [], "tensions": [],
    "element_balance": {"astro":"","tarot":"","comment":""}
  },
  "interpretation": {
    "theme":"", "positions": [],
    "timing": [], "action_items": [], "affirmations": []
  },
  "confidence": {"overall": 0.0, "notes": ""}
}
"""

from __future__ import annotations
import os, sys, json, datetime, re, argparse, pathlib, time, requests, hashlib
from typing import List, Dict, Any, Optional
from requests.exceptions import ReadTimeout, ConnectTimeout, Timeout, RequestException
from functools import lru_cache

# HTTP Session for connection pooling
_HTTP_SESSION = None

def get_http_session() -> requests.Session:
    """Get or create a persistent HTTP session with connection pooling."""
    global _HTTP_SESSION
    if _HTTP_SESSION is None:
        _HTTP_SESSION = requests.Session()
        # Configure connection pooling
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=10,
            max_retries=0  # We handle retries manually
        )
        _HTTP_SESSION.mount('http://', adapter)
        _HTTP_SESSION.mount('https://', adapter)
    return _HTTP_SESSION

# Response cache for model calls (hash of prompt -> response)
_RESPONSE_CACHE: Dict[str, str] = {}
ENABLE_RESPONSE_CACHE = os.environ.get("ENABLE_RESPONSE_CACHE", "true").lower() == "true"

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
DEFAULT_MODEL = "gpt-4o-mini"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
STOP_SEQUENCES = [s for s in os.environ.get("ASTRO_TAROT_STOPS", "").split(",") if s.strip()] or None

TAROT_KB_PATH = os.environ.get("TAROT_KB_PATH", "data/celestia_arcana_knowledge.json")
CONSTELLATION_KB_PATH = os.environ.get("CONSTELLATION_KB_PATH", "data/constellation_knowledge.json")

# Performance monitoring
_PERF_STATS = {"cache_hits": 0, "cache_misses": 0, "kb_reloads": 0}

# Cache management utilities
def clear_all_caches():
    """Clear all caches (KB, responses, HTTP session)."""
    global _CARD_KB_CACHE, _CONSTELLATION_KB_CACHE, _RESPONSE_CACHE, _HTTP_SESSION
    _CARD_KB_CACHE = None
    _CONSTELLATION_KB_CACHE = None
    _RESPONSE_CACHE.clear()
    if _HTTP_SESSION:
        _HTTP_SESSION.close()
        _HTTP_SESSION = None
    print("✓ All caches cleared", file=sys.stderr)

def reload_kbs(force=True):
    """Reload knowledge bases from disk."""
    load_card_kb(force_reload=force)
    load_constellation_kb(force_reload=force)
    print("✓ Knowledge bases reloaded", file=sys.stderr)

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics."""
    return {
        "response_cache_size": len(_RESPONSE_CACHE),
        "cache_enabled": ENABLE_RESPONSE_CACHE,
        "perf_stats": dict(_PERF_STATS)
    }

# -----------------------------------------------------------------------------
# HTTP (long timeout + retry + connection pooling)
# -----------------------------------------------------------------------------
def _post_with_retry(url, payload, headers=None, timeout=(60, 3600), retries=3, backoff=2.0):
    """
    Robust HTTP POST with generous timeouts, exponential backoff, and connection pooling.
    timeout -> (connect_timeout, read_timeout)
    """
    session = get_http_session()
    attempt = 0
    last_err = None
    while attempt <= retries:
        try:
            return session.post(url, json=payload, headers=headers, timeout=timeout)
        except (ReadTimeout, ConnectTimeout, Timeout) as e:
            last_err = e
            if attempt == retries:
                break
            sleep_s = backoff ** attempt
            print(f"[retry] Timeout, retrying in {sleep_s:.1f}s...", file=sys.stderr)
            time.sleep(sleep_s)
            attempt += 1
        except RequestException:
            raise
    raise last_err

# -----------------------------------------------------------------------------
# Schema + System Prompt
# -----------------------------------------------------------------------------
SCHEMA_JSON = {
    "meta": {"question":"", "timeframe":"", "spread_name":"", "timestamp":""},
    "astro_summary": {
        "core": {
            "sun":"", "moon":"", "asc":"",
            "dominant_elements":[],
            "notable_aspects":[{"aspect":"", "orb":"", "interpretation":""}],
            "lunar_phase":""
        },
        "themes":[]
    },
    "spread_summary": {
        "layout": [],
        "card_elements_count": {"Fire":0,"Earth":0,"Air":0,"Water":0},
        "majors_count": 0
    },
    "resonance": {
        "matches": [],
        "tensions": [],
        "element_balance": {"astro":"","tarot":"","comment":""}
    },
    "interpretation": {
        "theme":"", "positions": [],
        "timing": [],
        "action_items": [],
        "affirmations": []
    },
    "confidence": {"overall": 0.0, "notes": ""}
}

SYSTEM_PROMPT = """You are Astro-Tarot Synthesizer, an expert divinatory interpreter.
Your task: synthesize astrology + tarot into ONE coherent reading that directly addresses the user's question.

CRITICAL RULES:
1. STAY ON TOPIC: Every interpretation must relate to the user's question and timeframe
2. USE PROVIDED DATA: Ground all insights in the actual cards, aspects, and astrological placements given
3. BE SPECIFIC: Name the cards, aspects, and elements - don't be vague
4. AVOID GENERIC: No generic advice; connect everything to the specific spread and astro context
5. FOCUS ON ACTIONABLE: Provide concrete next steps tied to the reading

Return ONLY one JSON object. No markdown, no prose, no code fences.

Follow this schema exactly:
{
  "meta": {
    "question": "string",
    "timeframe": "string",
    "spread_name": "string",
    "timestamp": "ISO8601 string"
  },
  "astro_summary": {
    "core": {
      "sun": "string",
      "moon": "string",
      "asc": "string",
      "dominant_elements": ["string"],
      "notable_aspects": [
        {"aspect":"string","orb":"string","interpretation":"string"}
      ],
      "lunar_phase": "string"
    },
    "themes": ["string"]
  },
  "spread_summary": {
    "layout": ["string"],
    "card_elements_count": {"Fire":0,"Earth":0,"Air":0,"Water":0},
    "majors_count": 0
  },
  "resonance": {
    "matches": [{"type":"string","detail":"string","why":"string"}],
    "tensions": [{"type":"string","detail":"string","why":"string"}],
    "element_balance": {"astro":"string","tarot":"string","comment":"string"}
  },
  "interpretation": {
    "theme":"string",
    "positions":[{"card":"string","position":"string","element":"string","insight":"string"}],
    "timing": ["string"],
    "action_items": ["string"],
    "affirmations": ["string"]
  },
  "confidence": {"overall": 0.0, "notes": "string"}
}

Output rules:
- Do not invent new top-level keys or nested blocks beyond the schema.
- Derive "spread_summary.layout" and "interpretation.positions" directly from TAROT SPREAD input cards and positions.
- Be concise, warm, and constructive. Pure JSON only.
"""

# -----------------------------------------------------------------------------
# File utils
# -----------------------------------------------------------------------------
def load_json_if_exists(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON decode error in {path}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"⚠️  Error loading {path}: {e}", file=sys.stderr)
        return None

# -----------------------------------------------------------------------------
# Tarot KB (with reload support)
# -----------------------------------------------------------------------------
_CARD_KB_CACHE = None
_CONSTELLATION_KB_CACHE = None

def load_card_kb(path=TAROT_KB_PATH, force_reload=False):
    """Load tarot card knowledge base with caching and reload support."""
    global _CARD_KB_CACHE

    if _CARD_KB_CACHE is not None and not force_reload:
        return _CARD_KB_CACHE

    if force_reload:
        _PERF_STATS["kb_reloads"] += 1

    raw = load_json_if_exists(path)
    if not raw:
        print(f"⚠️  Tarot KB not found at {path}", file=sys.stderr)
        _CARD_KB_CACHE = {}
        return {}

    # Accept either {"cards":[...]} or a dict keyed by names
    if isinstance(raw, dict) and "cards" in raw:
        cards = raw["cards"]
    elif isinstance(raw, list):
        cards = raw
    else:
        # try to coerce dict-of-dicts into list
        cards = []
        for k, v in raw.items():
            if isinstance(v, dict):
                vv = dict(v)
                vv.setdefault("name", k)
                cards.append(vv)

    kb = {}
    for c in cards:
        name = c.get("name")
        if not name:
            continue
        kb[name] = c

        # Standard suit aliases for Pentacles
        if "Pentacles" in name:
            kb[name.replace("Pentacles", "Coins")] = c
            kb[name.replace("Pentacles", "Disks")] = c

        # Custom deck suit aliases (Flames, Tides, Stones, Winds)
        if "Wands" in name:
            kb[name.replace("Wands", "Flames")] = c
        elif "Cups" in name:
            kb[name.replace("Cups", "Tides")] = c
        elif "Pentacles" in name:
            kb[name.replace("Pentacles", "Stones")] = c
        elif "Swords" in name:
            kb[name.replace("Swords", "Winds")] = c

    _CARD_KB_CACHE = kb
    print(f"✓ Loaded {len(cards)} tarot cards ({len(kb)} entries with aliases)", file=sys.stderr)
    return kb

def get_card_kb():
    """Get cached tarot KB, loading if necessary."""
    global _CARD_KB_CACHE
    if _CARD_KB_CACHE is None:
        load_card_kb()
    return _CARD_KB_CACHE or {}

def kb_lookup(card_name: str) -> dict:
    kb = get_card_kb()
    return kb.get(card_name or "") or {}

def kb_element(card_name: str, fallback: str = "") -> str:
    info = kb_lookup(card_name)
    return info.get("element") or fallback

def kb_is_major(card_name: str) -> bool:
    info = kb_lookup(card_name)
    return (info.get("arcana") == "Major")

def kb_keywords(card_name: str, orientation: str = "upright") -> List[str]:
    info = kb_lookup(card_name)
    if not info: return []
    if orientation and orientation.lower().startswith("rev"):
        text = info.get("reversed_general") or ""
    else:
        text = info.get("upright_general") or ""
    if text:
        # Drop "Card: " prefix if present and split by comma
        text = text.split(":", 1)[-1]
        words = [w.strip(" .") for w in text.split(",") if w.strip()]
        if words: return words[:4]
    # fallback to keywords array
    return (info.get("keywords") or [])[:4]

# -----------------------------------------------------------------------------
# Constellation KB (with reload support)
# -----------------------------------------------------------------------------
def load_constellation_kb(path=CONSTELLATION_KB_PATH, force_reload=False):
    """Load constellation knowledge base with caching and reload support."""
    global _CONSTELLATION_KB_CACHE

    if _CONSTELLATION_KB_CACHE is not None and not force_reload:
        return _CONSTELLATION_KB_CACHE

    if force_reload:
        _PERF_STATS["kb_reloads"] += 1

    data = load_json_if_exists(path)
    if not data:
        print(f"⚠️  Constellation KB not found at {path}", file=sys.stderr)
        _CONSTELLATION_KB_CACHE = {}
        return {}

    if not isinstance(data, dict):
        print(f"⚠️  Constellation KB is not a dict at {path}", file=sys.stderr)
        _CONSTELLATION_KB_CACHE = {}
        return {}

    _CONSTELLATION_KB_CACHE = data
    print(f"✓ Loaded constellation KB with {len(data)} entries", file=sys.stderr)
    return data

def get_constellation_kb():
    """Get cached constellation KB, loading if necessary."""
    global _CONSTELLATION_KB_CACHE
    if _CONSTELLATION_KB_CACHE is None:
        load_constellation_kb()
    return _CONSTELLATION_KB_CACHE or {}

def constellation_lookup(name: str) -> dict:
    if not name: return {}
    kb = get_constellation_kb()
    # try exact, then case-insensitive
    if name in kb:
        return kb[name]
    for k in kb.keys():
        if k.lower() == name.lower():
            return kb[k]
    # some zodiac names might be Latinized variants (e.g., Capricornus vs Capricorn)
    alt = {
        "Capricorn": "Capricornus",
        "Scorpio": "Scorpius",
        "Aquarius": "Aquarius",
        "Pisces": "Pisces",
        "Aries": "Aries",
        "Taurus": "Taurus",
        "Gemini": "Gemini",
        "Cancer": "Cancer",
        "Leo": "Leo",
        "Virgo": "Virgo",
        "Libra": "Libra",
        "Sagittarius": "Sagittarius",
    }
    mapped = alt.get(name)
    if mapped and mapped in kb:
        return kb[mapped]
    return {}

def constellation_insight(name: str) -> dict:
    info = constellation_lookup(name)
    meanings = info.get("meanings", {}) if info else {}
    return {
        "constellation": name,
        "archetype": meanings.get("archetype", ""),
        "virtue": meanings.get("virtue", ""),
        "shadow": meanings.get("shadow", ""),
        "quest": meanings.get("quest", ""),
        "lesson": meanings.get("lesson", ""),
        "omen": meanings.get("omen", "")
    }

def constellation_theme_line(sign: str) -> str:
    c = constellation_insight(sign)
    bits = []
    if c["virtue"]:
        bits.append(c["virtue"])
    if c["omen"]:
        bits.append(c["omen"])
    return " ".join(bits).strip()

# -----------------------------------------------------------------------------
# Model call / JSON parsing + repair
# -----------------------------------------------------------------------------
def _get_cache_key(system: str, user: str, model: str, temp: float, num: int) -> str:
    """Generate a cache key for model responses."""
    content = f"{system}||{user}||{model}||{temp}||{num}"
    return hashlib.sha256(content.encode()).hexdigest()

def call_chatgpt(system: str, user: str, model: str, temp: float, num: int) -> str:
    """Call ChatGPT via OpenAI API with optional response caching and performance tracking."""
    # Check cache first
    if ENABLE_RESPONSE_CACHE:
        cache_key = _get_cache_key(system, user, model, temp, num)
        if cache_key in _RESPONSE_CACHE:
            _PERF_STATS["cache_hits"] += 1
            print(f"[cache] Hit for model={model} (total hits: {_PERF_STATS['cache_hits']})", file=sys.stderr)
            return _RESPONSE_CACHE[cache_key]
        _PERF_STATS["cache_misses"] += 1

    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "content-type": "application/json"
    }

    payload = {
        "model": model,
        "max_tokens": int(num),
        "temperature": float(temp),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ]
    }

    r = _post_with_retry(OPENAI_API_URL, payload, headers=headers, timeout=(60, 3600))
    try:
        r.raise_for_status()
    except Exception as e:
        print(f"[error] API request failed: {e}", file=sys.stderr)
        print(f"[error] Response: {r.text}", file=sys.stderr)
        raise

    try:
        obj = r.json()
        response = obj.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        print(f"[error] Failed to parse response: {e}", file=sys.stderr)
        response = r.text

    # Cache the response
    if ENABLE_RESPONSE_CACHE:
        cache_key = _get_cache_key(system, user, model, temp, num)
        _RESPONSE_CACHE[cache_key] = response

    return response

# Alias for backward compatibility
def call_ollama(system: str, user: str, model: str, temp: float, num: int) -> str:
    """Backward compatibility wrapper - calls ChatGPT instead."""
    return call_chatgpt(system, user, model, temp, num)

def _extract_balanced_json(text: str) -> Optional[str]:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.I | re.S).strip()
    if t.startswith("{") and t.endswith("}"):
        return t
    start = t.find("{")
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i, ch in enumerate(t[start:], start=start):
        if in_str:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': in_str = False
        else:
            if ch == '"': in_str = True
            elif ch == "{": depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return t[start:i+1]
    return None

def _basic_json_repairs(s: str) -> str:
    s = s.replace("“", '"').replace("”", '"').replace("’", "'")
    s = re.sub(r'(?P<pre>[\{\s,])\'(?P<key>[^\'\n\r]+)\'(?P<post>\s*:)', r'\g<pre>"\g<key>"\g<post>', s)
    s = re.sub(r':\s*\'([^\']*)\'(\s*[,\}])', r': "\1"\2', s)
    s = re.sub(r',\s*([}\]])', r'\1', s)
    s = re.sub(r'(".*?)(?<!\\)\\(?![\\/"bfnrtu])', r'\1\\\\', s)

    # Handle truncated JSON by closing open structures
    # Count open/close braces and brackets
    open_braces = s.count('{') - s.count('}')
    open_brackets = s.count('[') - s.count(']')

    # Close any unclosed strings (truncated at end)
    # First, find the last quote and check if it's closed
    last_quote = s.rfind('"')
    if last_quote != -1:
        # Count quotes before the last one
        quotes_before = s[:last_quote].count('"')
        if quotes_before % 2 == 0:  # Odd number of quotes total = unclosed string
            s = s.rstrip() + '"'

    # Close unclosed arrays and objects
    s = s.rstrip(',') + ']' * open_brackets + '}' * open_braces

    return s

def parse_model_json(raw: str) -> Dict[str, Any]:
    """Parse JSON from model output with aggressive local repair."""
    cand = _extract_balanced_json(raw) or raw.strip()
    repaired = _basic_json_repairs(cand)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError as e:
        snippet = repaired[max(0, e.pos-160):e.pos+160]
        raise ValueError(f"JSON parse failed at {e.pos}: {e.msg}\n--- snippet ---\n{snippet}")

def repair_to_json(raw_text: str, model: str, temperature: float = 0.1, max_retries: int = 2) -> str:
    """Repair malformed JSON by calling ChatGPT with retry logic."""
    fixer_system = (
        "You are a JSON repair tool. Input may be malformed JSON. "
        "Return only a single valid JSON object that matches schema; no markdown or comments."
    )
    fixer_user = f"Repair this into strict JSON (single object). Preserve fields.\n\nRAW:\n{raw_text}"

    for attempt in range(max_retries + 1):
        try:
            response = call_chatgpt(fixer_system, fixer_user, model, temperature, 1500)
            if response:
                print(f"[repair] Success on attempt {attempt + 1}", file=sys.stderr)
                return response
        except Exception as e:
            print(f"[repair] Error on attempt {attempt + 1}: {e}", file=sys.stderr)
            if attempt == max_retries:
                raise
            time.sleep(1.0)

    return ""

# -----------------------------------------------------------------------------
# Element guess fallback (used if KB missing)
# -----------------------------------------------------------------------------
def _guess_element(card: str) -> str:
    c = (card or "").lower()
    if "wands" in c: return "Fire"
    if "pentacles" in c or "coins" in c or "disks" in c: return "Earth"
    if "swords" in c: return "Air"
    if "cups" in c: return "Water"
    if "hermit" in c: return "Earth"
    if "lovers" in c: return "Air"
    if "sun" in c: return "Fire"
    if "moon" in c: return "Water"
    return ""

# -----------------------------------------------------------------------------
# Normalizer / Schema coercion
# -----------------------------------------------------------------------------
def _coerce_to_schema(d: Dict[str, Any], spread: List[Dict[str, Any]]) -> Dict[str, Any]:
    out = {
        "meta": d.get("meta", {}),
        "astro_summary": {
            "core": {
                "sun": "", "moon": "", "asc": "",
                "dominant_elements": [],
                "notable_aspects": [],
                "lunar_phase": ""
            },
            "themes": []
        },
        "spread_summary": {
            "layout": [],
            "card_elements_count": {"Fire":0,"Earth":0,"Air":0,"Water":0},
            "majors_count": 0
        },
        "resonance": {
            "matches": [],
            "tensions": [],
            "element_balance": {"astro":"","tarot":"","comment":""}
        },
        "interpretation": {
            "theme": "",
            "positions": [],
            "timing": [],
            "action_items": [],
            "affirmations": []
        },
        "confidence": {"overall": 0.0, "notes": ""}
    }

    # --- meta ---
    out["meta"].setdefault("question", d.get("meta", {}).get("question", ""))
    out["meta"].setdefault("timeframe", d.get("meta", {}).get("timeframe", ""))
    out["meta"].setdefault("spread_name", d.get("meta", {}).get("spread_name", "Custom"))
    out["meta"].setdefault("timestamp", d.get("meta", {}).get("timestamp", datetime.datetime.utcnow().isoformat()+"Z"))

    # --- astro_summary (copy fields, then enrich themes with constellation KB) ---
    a = d.get("astro_summary", {})
    core_in = a.get("core", a) if isinstance(a, dict) else {}
    core_out = out["astro_summary"]["core"]
    core_out["sun"]  = core_in.get("sun","")
    core_out["moon"] = core_in.get("moon","")
    core_out["asc"]  = core_in.get("asc","")
    core_out["lunar_phase"] = core_in.get("lunar_phase","")

    if isinstance(core_in.get("dominant_elements"), list):
        core_out["dominant_elements"] = list(core_in["dominant_elements"])

    na = core_in.get("notable_aspects") or []
    norm_na = []
    for item in na:
        if isinstance(item, dict):
            norm_na.append({
                "aspect": item.get("aspect",""),
                "orb": str(item.get("orb","")),
                "interpretation": item.get("interpretation","")
            })
        else:
            norm_na.append({"aspect": str(item), "orb": "", "interpretation": ""})
    core_out["notable_aspects"] = norm_na

    themes_in = a.get("themes")
    out["astro_summary"]["themes"] = themes_in if isinstance(themes_in, list) else []

    # Constellation enrichment -> add short lines to astro_summary.themes (schema-safe)
    def _extract_sign(s: str) -> str:
        # e.g., "Libra 29° H7" -> "Libra"
        return s.split()[0] if isinstance(s, str) and s else ""

    for placement in (core_out.get("sun"), core_out.get("moon"), core_out.get("asc")):
        sign = _extract_sign(placement)
        if sign:
            line = constellation_theme_line(sign)
            if line:
                out["astro_summary"]["themes"].append(f"{sign}: {line}")

    # Optional hints we might use for resonance comment
    el_counts_hint = (a.get("element_counts") if isinstance(a, dict) else None)
    majors_hint = a.get("majors_count") if isinstance(a, dict) else None

    # --- spread from input
    positions_from_input = []
    elem_counts_from_input = {"Fire":0,"Earth":0,"Air":0,"Water":0}
    majors_from_input = 0

    for item in (spread or []):
        pos = (item.get("position") or "").strip()
        card = (item.get("card") or "").strip()
        orientation = (item.get("orientation") or "upright").strip()

        # Prefer KB element, then provided element, then guess
        element = (kb_element(card) or item.get("element") or _guess_element(card) or "").strip()
        if element in elem_counts_from_input:
            elem_counts_from_input[element] += 1
        if kb_is_major(card):
            majors_from_input += 1

        if pos and card:
            kws = kb_keywords(card, orientation=orientation)
            kb_insight = ", ".join(kws) if kws else "Consider how this informs your next 30 days."
            positions_from_input.append({
                "card": card,
                "position": pos,
                "element": element,
                "insight": kb_insight,
                "_orientation": orientation  # internal only
            })

    # --- interpretation positions (model or input), then normalize with KB ---
    interp_in = d.get("interpretation", {})
    positions_initial = []
    if isinstance(interp_in.get("positions"), list) and interp_in["positions"]:
        for p in interp_in["positions"]:
            positions_initial.append({
                "card": (p.get("card") or "").strip(),
                "position": (p.get("position") or "").strip() or "Position",
                "element": (p.get("element") or "").strip(),
                "insight": (p.get("insight") or "").strip(),
                "_orientation": (p.get("orientation") or "upright").strip()
            })
    else:
        positions_initial = positions_from_input[:]

    final_positions: List[Dict[str, str]] = []
    elem_counts_final = {"Fire":0,"Earth":0,"Air":0,"Water":0}
    majors_final = 0

    for p in positions_initial:
        card = p["card"]
        pos  = p["position"] or "Position"
        orient = (p.get("_orientation") or "upright")

        el_kb = kb_element(card)
        el_model = p.get("element")
        auto = _guess_element(card)
        el = el_kb or (el_model if el_model in ("Fire","Earth","Air","Water") else "") or auto

        # Insight: prefer provided; else build from KB upright/reversed
        insight = p.get("insight") or ""
        if not insight or insight.lower().startswith("consider how"):
            kws = kb_keywords(card, orientation=orient)
            insight = ", ".join(kws) if kws else "Consider how this informs your next 30 days."

        final_positions.append({"card": card, "position": pos, "element": el, "insight": insight})
        if el in elem_counts_final: elem_counts_final[el] += 1
        if kb_is_major(card): majors_final += 1

    # spread summary
    out["spread_summary"]["layout"] = [f'{p["position"]}: {p["card"]}' for p in final_positions]
    if any(elem_counts_final.values()):
        out["spread_summary"]["card_elements_count"] = elem_counts_final
    elif any(elem_counts_from_input.values()):
        out["spread_summary"]["card_elements_count"] = elem_counts_from_input
    elif isinstance(el_counts_hint, dict):
        out["spread_summary"]["card_elements_count"] = {k:int(el_counts_hint.get(k,0)) for k in ["Fire","Earth","Air","Water"]}

    if majors_final:
        out["spread_summary"]["majors_count"] = majors_final
    elif majors_from_input:
        out["spread_summary"]["majors_count"] = majors_from_input
    elif isinstance(majors_hint, (int,float)):
        out["spread_summary"]["majors_count"] = int(majors_hint)

    # resonance
    r_out = out["resonance"]
    r_in = d.get("resonance", {})
    if isinstance(r_in, dict):
        if "career focus" in r_in:
            r_out["matches"].append({
                "type":"career_focus",
                "detail":r_in.get("career focus",""),
                "why":"Synthesized from spread + aspects"
            })
        if "next steps" in r_in:
            r_out["matches"].append({
                "type":"next_steps",
                "detail":r_in.get("next steps",""),
                "why":"Action aligned to lunar phase and constellation virtues"
            })
        if isinstance(r_in.get("matches"), list):
            r_out["matches"].extend(r_in["matches"])
        if isinstance(r_in.get("tensions"), list):
            r_out["tensions"] = r_in["tensions"]
        if isinstance(r_in.get("element_balance"), dict):
            for k in ("astro","tarot","comment"):
                if r_in["element_balance"].get(k):
                    r_out["element_balance"][k] = r_in["element_balance"][k]

    # element balance strings
    if not r_out["element_balance"]["astro"]:
        dom = core_out.get("dominant_elements") or []
        r_out["element_balance"]["astro"] = ", ".join(dom)
    counts_for_tarot = out["spread_summary"]["card_elements_count"]
    r_out["element_balance"]["tarot"] = "; ".join([f"{k}:{counts_for_tarot.get(k,0)}" for k in ["Fire","Earth","Air","Water"]])
    if not r_out["element_balance"]["comment"]:
        if el_counts_hint:
            r_out["element_balance"]["comment"] = f"Derived from positions; hint: {el_counts_hint}"
        else:
            r_out["element_balance"]["comment"] = "Derived from normalized positions."

    # interpretation
    interp_out = out["interpretation"]
    interp_out["theme"] = (interp_in.get("theme") or "Stability through balanced relationships and practical structure")
    interp_out["positions"] = final_positions

    # Timing
    if isinstance(interp_in.get("timing"), list) and interp_in["timing"]:
        interp_out["timing"] = interp_in["timing"]
    else:
        interp_out["timing"] = [
            "Act within 72 hours on one concrete commitment.",
            "Full Moon week: review and release what’s not aligned."
        ]

    # Actions
    base_actions = [
        "Prioritize 1–2 key relationships; clarify expectations.",
        "Create a 30-day stability plan (budget, schedule, deliverables).",
        "Ship one portfolio-visible artifact per week."
    ]
    ca = interp_in.get("career advice")
    if isinstance(ca, str) and ca:
        base_actions.append(ca)
    ai = interp_in.get("action_items")
    interp_out["action_items"] = ai if isinstance(ai, list) and ai else base_actions

    # Affirmations
    aff = interp_in.get("affirmations")
    interp_out["affirmations"] = (aff if isinstance(aff, list) and aff else [
        "I choose balanced progress each day.",
        "My relationships are clear, aligned, and supportive."
    ])

    # Blend constellation virtue/omen into the theme subtly (schema-safe)
    # Using signs from placements:
    signs = []
    for placement in (core_out.get("sun"), core_out.get("moon"), core_out.get("asc")):
        if placement and isinstance(placement, str):
            signs.append(placement.split()[0])
    added = False
    for s in signs:
        line = constellation_theme_line(s)
        if line:
            interp_out["theme"] = (interp_out["theme"] + " " + line).strip()
            added = True
            break  # add only one to keep it concise

    # confidence
    conf_in = d.get("confidence", {})
    nums = []
    for k in ("career confidence","personal confidence","overall"):
        v = conf_in.get(k)
        if isinstance(v, (int,float)):
            nums.append(float(v) if (k == "overall" and v <= 1.0) else float(v)/10.0 if v > 1.0 else float(v))
    overall = (sum(nums)/len(nums)) if nums else 0.7
    out["confidence"]["overall"] = round(float(overall), 2)
    out["confidence"]["notes"] = conf_in.get("notes") or "Normalized from provided fields; missing values synthesized."

    return out

# -----------------------------------------------------------------------------
# Synthesis
# -----------------------------------------------------------------------------
def _kb_slice_for_spread(spread: List[Dict[str, Any]]) -> dict:
    out = {}
    card_kb = get_card_kb()
    for it in spread or []:
        name = (it.get("card") or "").strip()
        if name and name not in out and name in card_kb:
            info = card_kb[name]
            out[name] = {
                "arcana": info.get("arcana"),
                "element": info.get("element"),
                "keywords_upright": info.get("keywords_upright"),
                "keywords_reversed": info.get("keywords_reversed"),
                "suit": info.get("suit")
            }
    return out

def synthesize_reading(question: str, timeframe: str,
                       astro: Dict[str, Any], spread: List[Dict[str, str]],
                       model: str, temp: float, num: int) -> Dict[str, Any]:
    astro_json  = json.dumps(astro, ensure_ascii=False, separators=(',', ':'))
    spread_json = json.dumps(spread, ensure_ascii=False, separators=(',', ':'))

    # Provide a compact KB slice (RAG-lite) for model grounding
    kb_slice = _kb_slice_for_spread(spread)
    kb_json  = json.dumps(kb_slice, ensure_ascii=False, separators=(',', ':'))

    user_prompt = f"""
Create ONE unified Astro-Tarot reading that directly answers this question:

QUESTION: {question}
TIMEFRAME: {timeframe}

Use ONLY this data:
- TAROT CARDS IN THIS SPREAD: {kb_json}
- ASTRO CONTEXT: {astro_json}
- TAROT SPREAD: {spread_json}

INSTRUCTIONS:
1. Synthesize the astro themes with the tarot cards
2. Show how the cards reflect the astrological influences
3. Address the specific question with concrete insights
4. Provide actionable next steps tied to both astro and tarot
5. Keep all interpretations grounded in the provided data

Return exactly one JSON matching the schema above.
""".strip()

    raw = call_ollama(SYSTEM_PROMPT, user_prompt, model, temp, num)

    # Debug logs
    try:
        with open("last_model_output.txt", "w", encoding="utf-8") as f:
            f.write(raw)
    except Exception:
        pass

    # Parse; repair on failure
    try:
        data = parse_model_json(raw)
    except Exception:
        # Try to extract JSON without calling repair (which hangs)
        extracted = _extract_balanced_json(raw)
        if extracted:
            data = parse_model_json(extracted)
        else:
            repaired = _basic_json_repairs(raw)
            data = parse_model_json(repaired)

    # Meta defaults
    meta = data.setdefault("meta", {})
    meta.setdefault("question", question)
    meta.setdefault("timeframe", timeframe)
    meta.setdefault("spread_name", (spread[0].get("spread","") if (spread and isinstance(spread[0], dict)) else "") or "Custom")
    meta["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"

    # Normalize to strict schema (uses Tarot KB + Constellation KB)
    data = _coerce_to_schema(data, spread)
    return data

# ---------------------- Faith-aware postprocessing ----------------------
import subprocess, tempfile
from pathlib import Path

def postprocess_reading(reading: dict,
                        require_literal_faith: bool = False,
                        enrich_actions: bool = True,
                        inclusive_audit: bool = True,
                        soft_rewrite: bool = True,
                        max_actions: int = 12) -> dict:
    """Run the inclusive Faith-aware validator on the reading JSON."""
    validator_path = Path(__file__).parent / "scripts" / "validate_reading_faith.py"
    if not validator_path.exists():
        print("⚠️  Validator script not found at", validator_path, file=sys.stderr)
        return reading

    with tempfile.TemporaryDirectory() as td:
        raw_path = Path(td) / "raw.json"
        fixed_path = Path(td) / "fixed.json"
        raw_path.write_text(json.dumps(reading, indent=2, ensure_ascii=False), encoding="utf-8")

        args = [sys.executable, str(validator_path), str(raw_path), str(fixed_path)]
        if not require_literal_faith:
            args.append("--no-require-faith-word")
        if not enrich_actions:
            args.append("--no-enrich-actions")
        if not inclusive_audit:
            args.append("--no-inclusive-audit")
        if soft_rewrite:
            args.append("--soft-rewrite")
        args.extend(["--max-actions", str(max_actions)])

        proc = subprocess.run(args, capture_output=True, text=True)
        print("Validator report:\\n", proc.stdout, file=sys.stderr)

        if proc.returncode != 0 or not fixed_path.exists():
            print("⚠️  Validator failed — returning unmodified reading.", file=sys.stderr)
            return reading

        return json.loads(fixed_path.read_text(encoding="utf-8"))

# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--question", default="What should I focus on in my career over the next 30 days?")
    p.add_argument("--timeframe", default="next 30 days")
    p.add_argument("--astro", default="./data/astrology_context.json")
    p.add_argument("--spread", default="./data/my_spread.json")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--num-predict", type=int, default=1500)
    p.add_argument("--outdir", default="./readings")
    p.add_argument("--postprocess", action="store_true", help="Enable faith-aware postprocessing")
    a = p.parse_args()

    astro = load_json_if_exists(a.astro) or {"sun":"Leo 10°","moon":"Taurus 5°","asc":"Capricorn 12°"}
    spread = load_json_if_exists(a.spread) or [
        {"position":"Past","card":"The Hermit","orientation":"upright","element":"Earth"},
        {"position":"Present","card":"The Lovers","orientation":"upright","element":"Air"},
        {"position":"Future","card":"Ten of Stones","orientation":"upright","element":"Earth"}
    ]

    # 1) Generate raw reading
    reading = synthesize_reading(a.question, a.timeframe, astro, spread, a.model, a.temperature, a.num_predict)

    outdir = pathlib.Path(a.outdir); outdir.mkdir(exist_ok=True)
    ts = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    raw_path = outdir / f"reading_{ts}_raw.json"
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(reading, f, indent=2, ensure_ascii=False)
    print(f"Saved raw reading to: {raw_path}", file=sys.stderr)

    # 2) Optionally postprocess to non-dogmatic, Faith-aware, inclusive
    if a.postprocess:
        reading_fixed = postprocess_reading(
            reading,
            require_literal_faith=False,   # inclusive + non-dogmatic
            enrich_actions=True,
            inclusive_audit=True,
            soft_rewrite=True,
            max_actions=3  # Reduce to 3 action items
        )

        fixed_path = outdir / f"reading_{ts}_fixed.json"
        with open(fixed_path, "w", encoding="utf-8") as f:
            json.dump(reading_fixed, f, indent=2, ensure_ascii=False)
        print(f"Saved inclusive fixed reading to: {fixed_path}", file=sys.stderr)

        # Print final (fixed) reading to stdout
        print(json.dumps(reading_fixed, indent=2, ensure_ascii=False))
    else:
        # Print raw reading to stdout
        print(json.dumps(reading, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
