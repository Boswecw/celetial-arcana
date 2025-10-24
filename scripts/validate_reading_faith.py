#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_reading_faith.py — Robust, Faith-Aware & Universally Inclusive Edition
-------------------------------------------------------------------------------
Goals
- Enforce strict schema and repair common inconsistencies.
- Non-dogmatic, Faith-aware, inclusive language guardrails (optional soft rewrite).
- Multi-intent action enrichment (career, early-career, relationships, money,
  wellbeing, study, creativity, spiritual, sports, fitness, travel, productivity,
  entrepreneurship, parenting).
- Astro-theme boosts (phase-aware nudges like release/balance/integration).
- Safety: flag harmful/shaming/toxic or doctrinally-exclusive phrasing and
  potential medical/legal/financial topics (soft flags, no advice).
- SMART-ify vague actions (gentle tips appended).
- Deterministic, transparent: prints a JSON report to stdout.

USAGE
  python scripts/validate_reading_faith.py INPUT.json OUTPUT.json \
     [--no-require-faith-word] [--no-enrich-actions] [--no-inclusive-audit] [--soft-rewrite] \
     [--max-affs 6] [--max-actions 12]

Exit code 0 on success. Writes fixed JSON to OUTPUT and prints audit report to stdout.
"""

from __future__ import annotations
import json, argparse, sys, copy, re, datetime
from pathlib import Path
from typing import Any, Dict, List

# ----------------------------- Strict Schema -----------------------------

SCHEMA = {
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

MAJORS = {
    "The Fool","The Magician","The High Priestess","The Empress","The Emperor",
    "The Hierophant","The Lovers","The Chariot","Strength","The Hermit",
    "Wheel of Fortune","Justice","The Hanged Man","Death","Temperance",
    "The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"
}

# ----------------------- Inclusive Faith-aware Core ----------------------

BROAD_TERMS = [
    "faith","trust","hope","purpose","calling","spirit","presence","wonder","sacred",
    "grace","blessing","integrity","communion","conscience","gratitude","meaning"
]
DEFAULT_AFFIRMATION = "I act with courage and Faith, guided by purpose and integrity."

EXCLUSIONARY_PATTERNS = [
    r"only\s+true\s+path",
    r"\bone\s+true\b",
    r"\bheresy\b|\bheretic\b",
    r"\bblasphem(y|ous)\b",
    r"\banathema\b",
    r"\bdamned?\b|\bdamnation\b|\bhellfire\b",
    r"should\s+be\s+ashamed",
    r"\bshameful\b",
    # general toxicity/shaming indicators (conservative)
    r"\bworthless\b|\bidiot(ic)?\b|\bstupid\b|\bhopeless\b"
]

SUGGESTIONS = {
    "only true path": "Use invitational tone (e.g., “a meaningful path for you”).",
    "one true": "Prefer inclusive phrasing (e.g., “a resonant path for you”).",
    "heresy": "Avoid doctrinal judgments; focus on personal conscience and integrity.",
    "blasphemy": "Avoid doctrinal judgments; focus on personal conscience and integrity.",
    "anathema": "Avoid exclusionary labels; keep tone invitational.",
    "damnation/hellfire": "Avoid fear-based language; encourage growth and compassion.",
    "should be ashamed/shameful": "Avoid shaming; prefer compassionate, growth framing.",
    "toxicity": "Avoid insults or demeaning labels; focus on behaviors and choices."
}

REWRITE_RULES = [
    (r"\bonly\s+true\s+path\b", "a meaningful path"),
    (r"\bone\s+true\b", "a resonant"),
    (r"\bheresy\b|\bheretic\b", "disagreement"),
    (r"\bblasphem(y|ous)\b", "disrespectful language"),
    (r"\banathema\b", "out of alignment"),
    (r"\bdamned?\b|\bdamnation\b|\bhellfire\b", "harmful outcomes"),
    (r"should\s+be\s+ashamed", "can choose a better way"),
    (r"\bshameful\b", "unhelpful"),
    (r"\bworthless\b|\bidiot(ic)?\b|\bstupid\b|\bhopeless\b", "unhelpful")
]

# -------------------------- Intent + Action Sets -------------------------

INTENT_PATTERNS = {
    "career": re.compile(r"\b(career|job|work|promotion|manager|lead|stakeholder|roadmap|deliverable|deadline)\b", re.I),
    "early_career": re.compile(r"\b(intern(ship)?|first\s+job|entry[-\s]?level|junior|college|university|grad(uate)?|fresh\s*grad)\b", re.I),
    "relationships": re.compile(r"\b(relationship|team|partner|collaborat(e|ion)|conflict|boundar(y|ies))\b", re.I),
    "money": re.compile(r"\b(finance|salary|comp(ensation)?|budget|savings|debt|rate|pricing|offer|negotiat(e|ion))\b", re.I),
    "wellbeing": re.compile(r"\b(burnout|overwhelmed|exhaust(ed|ion)|rest|self[-\s]?care|balance|stress|anxiety)\b", re.I),
    "study": re.compile(r"\b(study|exam|course|class|learn|certificate|bootcamp|syllabus|thesis|paper)\b", re.I),
    "creativity": re.compile(r"\b(portfolio|creative|publish|post|article|design|prototype|draft|compose|record)\b", re.I),
    "spiritual": re.compile(r"\b(meaning|purpose|faith|trust|presence|blessing|grace|conscience|gratitude)\b", re.I),

    # NEW broader domains
    "sports": re.compile(r"\b(sport|athlet(ic|e|ics)|game|match|meet|race|tournament|league|season|practice|drill|coach|team|playoffs?)\b", re.I),
    "fitness": re.compile(r"\b(fitness|training|workout|cardio|strength|mobility|endurance|conditioning|recovery|nutrition)\b", re.I),
    "travel": re.compile(r"\b(travel|trip|itinerary|flight|visa|lodging|hotel|packing|packing\s*list|route|transport)\b", re.I),
    "productivity": re.compile(r"\b(productivity|focus|time\s*block|calendar|ritual|habit|okrs?|goals?)\b", re.I),
    "entrepreneurship": re.compile(r"\b(startup|founder|mvp|product[-\s]?market\s*fit|pitch|deck|fund(ing|raise)|customer|sales)\b", re.I),
    "parenting": re.compile(r"\b(parent|child|kids?|toddler|teen|school|homework|screen\s*time|bedtime)\b", re.I),
}

ACTION_SETS = {
    "career": [
        "Block 2× 90-minute deep-work sessions weekly for focused creation.",
        "Ship one portfolio-worthy artifact in 30 days (write, build, or launch).",
        "Set one relationship boundary that restores balance.",
        "Do a weekly finances/ops review to track material progress."
    ],
    "early_career": [
        "Identify one skill gap and complete a 2-hour micro-course this week.",
        "Request one 30-minute coffee chat with a practitioner; bring three specific questions.",
        "Draft or update your résumé/portfolio and ask a mentor for one round of feedback.",
        "Apply to three roles or raise your hand for one stretch task by Friday."
    ],
    "relationships": [
        "Schedule a 25-minute 1:1 to align expectations and define a clear next step.",
        "Write a brief working-agreement (3 bullet points) and share it with your collaborator.",
        "Name one boundary you’ll hold this week and how you’ll communicate it respectfully."
    ],
    "money": [
        "Review last 30 days of expenses and tag categories; set one monthly guardrail.",
        "Negotiate or benchmark one rate/offer using three comparable data points.",
        "Automate a weekly 15-minute finance check-in (budget + invoices)."
    ],
    "wellbeing": [
        "Choose one recovery habit (sleep/walk/quiet time) and track it daily for 7 days.",
        "Set a daily stop-time and honor it 5 days this week.",
        "Say no to one nonessential request to protect focus."
    ],
    "study": [
        "Define a 4-week learning sprint with a syllabus (topics, sources, deliverables).",
        "Summarize one chapter/paper in 200 words and publish notes by Sunday.",
        "Book a 30-minute study group or accountability session this week."
    ],
    "creativity": [
        "Publish one public update (post or demo) to create positive pressure.",
        "Prototype a V0 in 90 minutes; share for feedback within 24 hours.",
        "Create a content calendar with three slots per week for the next 3 weeks."
    ],
    "spiritual": [
        "Take 5 minutes daily for stillness or gratitude; jot one sentence of insight.",
        "Name one value you’ll honor this week and one behavior that proves it.",
        "Offer one act of service or kindness aligned with your purpose."
    ],
    "sports": [
        "Define a 2-week practice plan (3 sessions/week): warm-up, 2 targeted drills, scrimmage or time trial.",
        "Film one session this week and review 10 key plays or reps; note one adjustment to try next session.",
        "Do one dedicated recovery block (mobility or stretching) immediately after each practice this week.",
        "Schedule a 15-minute coach or peer feedback chat; bring one clip and one question."
    ],
    "fitness": [
        "Commit to 3 workouts this week: 1 cardio, 1 strength, 1 mobility; schedule them on your calendar.",
        "Track one metric (pace, RPE, weight, sets×reps) for each workout and log it right after.",
        "Plan simple pre/post-workout nutrition or hydration for each session (non-medical guidance).",
        "Set a bedtime target and honor it 4 nights this week for recovery."
    ],
    "travel": [
        "Draft a simple 7-line itinerary (dates, city, transport, lodging, top 3 activities).",
        "Book 1 anchor element (lodging or transport) within 48 hours to reduce uncertainty.",
        "Create a packing checklist; pack the difficult items first (docs, meds, chargers)."
    ],
    "productivity": [
        "Time-block two 90-minute deep-work sessions on your calendar for the next 7 days.",
        "Define one 30-day goal; break it into 4 weekly deliverables and schedule the first.",
        "Turn off one recurring distraction during deep-work windows (notifications, tabs, chat)."
    ],
    "entrepreneurship": [
        "Write a 1-page problem brief and list 5 customer interviews; schedule two this week.",
        "Build a 90-minute MVP or mock; put it in front of 3 people for feedback in 48 hours.",
        "Draft a simple pricing hypothesis and test it with two potential customers."
    ],
    "parenting": [
        "Set one 20-minute device-free connection block with your child this week.",
        "Choose one routine to stabilize (morning or bedtime) and write a 3-step checklist.",
        "Coordinate with caregivers/teachers on one concrete support for this week."
    ],
}

ASTRO_THEME_BOOSTS = {
    "release": ["List one commitment to release and notify stakeholders within 48 hours."],
    "balance": ["Timebox work blocks and rest blocks on your calendar for the next 7 days."],
    "integration": ["Pair one emotional truth with one practical step and schedule it this week."],
    "new": ["Choose one small beginning and take the first step in the next 24 hours."],
    "focus": ["Eliminate one distraction during deep-work blocks (mute, door, status)."]
}

# ---------------------------- Safety Flags -------------------------------

SAFETY_FLAGS = [
    (re.compile(r"\b(injury|rehab|tear|sprain|concussion|fracture|pain|inflammation)\b", re.I),
     "Sports injury indicators detected. Encourage consulting a qualified medical professional; avoid medical protocols."),
    (re.compile(r"\b(diagnos(e|is)|prescribe|medication|dosage|treatment\s*plan)\b", re.I),
     "Clinical language detected. Avoid medical advice; suggest seeking licensed care."),
    (re.compile(r"\b(contract|legal|lawsuit|liability|attorney|negligence)\b", re.I),
     "Legal topic detected. Avoid legal advice; suggest consulting a licensed attorney."),
    (re.compile(r"\b(invest(ing|ment)|securities|stock|crypto|retirement|tax)\b", re.I),
     "Financial topic detected. Avoid personalized financial advice; suggest consulting a fiduciary professional.")
]

# ---------------------------- Helper Functions ---------------------------

def detect_intents(meta_question: str, interp_theme: str, astro_themes: List[str]) -> List[str]:
    text = " ".join([meta_question or "", interp_theme or "", " ".join(astro_themes or [])])
    matches = []
    for name, rx in INTENT_PATTERNS.items():
        if rx.search(text):
            matches.append(name)
    # If no matches but looks career-ish, include career
    if not matches and INTENT_PATTERNS["career"].search(meta_question or ""):
        matches.append("career")
    return matches

def boost_from_astro(astro_themes: List[str]) -> List[str]:
    boosts = []
    for t in astro_themes or []:
        t_low = t.lower()
        for key, items in ASTRO_THEME_BOOSTS.items():
            if key in t_low:
                boosts.extend(items)
    return boosts

def dedupe_keep_order(items: List[str]) -> List[str]:
    seen = set(); out = []
    for it in items:
        key = re.sub(r"\s+", " ", it.strip().lower())
        if key not in seen:
            seen.add(key); out.append(it)
    return out

def safe_get(d, path, default=None):
    cur = d
    for p in path.split("."):
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return default
    return cur

def coerce_schema(obj: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all schema keys exist; drop unknown keys (non-destructive to known)."""
    def walk(template, node):
        if isinstance(template, dict):
            out = {}
            for k, v in template.items():
                nv = node.get(k) if isinstance(node, dict) else None
                out[k] = walk(v, nv if nv is not None else v)
            return out
        elif isinstance(template, list):
            if isinstance(node, list):
                return node
            return []
        else:
            # primitive
            return node if node is not None else template
    fixed = walk(SCHEMA, obj if isinstance(obj, dict) else {})
    # Trim unknown top-level keys (already handled by template walk)
    return fixed

def detect_cards(layout_list):
    cards = []
    for s in layout_list or []:
        if ":" in s:
            _, name = s.split(":", 1)
            cards.append(name.strip())
        else:
            cards.append(s.strip())
    return cards

def count_majors(cards_list):
    total = 0
    for c in cards_list:
        c_clean = c.replace("(reversed)", "").strip()
        if c_clean in MAJORS:
            total += 1
    return total

def count_elements_from_positions(positions):
    counts = {"Fire":0,"Earth":0,"Air":0,"Water":0}
    for p in positions or []:
        e = p.get("element")
        if e in counts:
            counts[e] += 1
    return counts

def contains_broad(text):
    t = (text or "").lower()
    return any(term in t for term in BROAD_TERMS)

def inclusive_audit(obj):
    """Scan strings for exclusionary/toxic patterns. Return findings."""
    findings = []
    paths_to_text = []

    def collect(prefix, node):
        if isinstance(node, dict):
            for k, v in node.items():
                collect(f"{prefix}.{k}" if prefix else k, v)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                collect(f"{prefix}[{i}]", v)
        else:
            if isinstance(node, str):
                paths_to_text.append((prefix, node))

    collect("", obj)
    for path, text in paths_to_text:
        low = text.lower()
        for pat in EXCLUSIONARY_PATTERNS:
            if re.search(pat, low):
                key = "toxicity"
                if "only\\s+true\\s+path" in pat:
                    key = "only true path"
                elif "\\bone\\s+true\\b" in pat:
                    key = "one true"
                elif "heresy" in pat:
                    key = "heresy"
                elif "blasphem" in pat:
                    key = "blasphemy"
                elif "anathema" in pat:
                    key = "anathema"
                elif "damn" in pat or "hellfire" in pat:
                    key = "damnation/hellfire"
                elif "ashamed" in pat or "shameful" in pat:
                    key = "should be ashamed/shameful"
                findings.append({
                    "path": path,
                    "excerpt": text[:240],
                    "pattern": pat,
                    "suggestion": SUGGESTIONS.get(key, "Consider inclusive, invitational phrasing.")
                })
    return findings

def soft_rewrite_text(text):
    new = text
    for pat, sub in REWRITE_RULES:
        new = re.sub(pat, sub, new, flags=re.IGNORECASE)
    return new

def deep_soft_rewrite(obj):
    if isinstance(obj, dict):
        return {k: deep_soft_rewrite(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deep_soft_rewrite(v) for v in obj]
    elif isinstance(obj, str):
        return soft_rewrite_text(obj)
    return obj

def soft_safety_scan(text_blob: str) -> list[str]:
    notes = []
    for rx, msg in SAFETY_FLAGS:
        if rx.search(text_blob):
            notes.append(msg)
    # de-dupe keep order
    seen = set(); out = []
    for n in notes:
        if n not in seen:
            seen.add(n); out.append(n)
    return out

# ------------------------------- Main Flow --------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("in_path", help="Input reading JSON")
    ap.add_argument("out_path", help="Output path for fixed JSON")
    ap.add_argument("--no-require-faith-word", action="store_true",
                    help="Do not require the literal word 'faith' (still checks for broad spiritual language)")
    ap.add_argument("--no-enrich-actions", action="store_true",
                    help="Do not add practical actions if missing or vague")
    ap.add_argument("--no-inclusive-audit", action="store_true",
                    help="Skip inclusive language audit (not recommended)")
    ap.add_argument("--soft-rewrite", action="store_true",
                    help="Autorewrite flagged phrases to neutral/inclusive alternatives (very conservative)")
    ap.add_argument("--max-affs", type=int, default=6, help="Max affirmations to keep (deduped)")
    ap.add_argument("--max-actions", type=int, default=12, help="Max action items to keep (deduped)")
    args = ap.parse_args()

    data = json.loads(Path(args.in_path).read_text(encoding="utf-8"))

    fixed = coerce_schema(copy.deepcopy(data))
    issues = []

    # Meta defaults & timestamp sanity
    meta = fixed.setdefault("meta", {})
    meta.setdefault("timestamp", datetime.datetime.utcnow().isoformat()+"Z")
    if not isinstance(meta.get("spread_name", None), (str, type(None))):
        meta["spread_name"] = str(meta["spread_name"])

    # 1) majors_count from layout
    layout_cards = detect_cards(fixed.get("spread_summary", {}).get("layout", []))
    majors_calc = count_majors(layout_cards)
    if fixed.get("spread_summary", {}).get("majors_count") != majors_calc:
        issues.append(f"majors_count mismatch: found {majors_calc} from layout; corrected in output.")
        fixed.setdefault("spread_summary", {})["majors_count"] = majors_calc

    # 2) element count check (report only)
    elem_calc = count_elements_from_positions(fixed.get("interpretation", {}).get("positions", []))
    cec = fixed.get("spread_summary", {}).get("card_elements_count", {})
    if elem_calc and cec and elem_calc != cec:
        issues.append(f"card_elements_count mismatch: calculated {elem_calc}; left original unchanged.")

    # 3) Faith-aware (non-dogmatic + inclusive)
    interp = fixed.get("interpretation", {})
    theme = interp.get("theme","")
    affs = interp.get("affirmations", []) or []
    faith_ok = (contains_broad(theme) or any(contains_broad(a) for a in affs))

    literal_required = not args.no_require_faith_word
    literal_present = ("faith" in (theme or "").lower()) or any("faith" in (a or "").lower() for a in affs)

    literal_added = False
    if literal_required and not literal_present:
        affs = affs + [DEFAULT_AFFIRMATION]
        literal_added = True

    # Affirmation dedupe and clamp
    affs = dedupe_keep_order(affs)
    if len(affs) > args.max_affs:
        issues.append(f"affirmations trimmed to max={args.max_affs}.")
        affs = affs[:args.max_affs]
    fixed["interpretation"]["affirmations"] = affs

    # 4) Action enrichment (intent-aware)
    actions = interp.get("action_items", []) or []
    enriched = False
    if not args.no_enrich_actions:
        intents = detect_intents(
            meta_question=fixed.get("meta", {}).get("question", ""),
            interp_theme=interp.get("theme", ""),
            astro_themes=fixed.get("astro_summary", {}).get("themes", [])
        )
        selected = []
        if "early_career" in intents:
            selected.extend(ACTION_SETS["early_career"])
        for it in intents:
            if it in ACTION_SETS and it != "early_career":
                selected.extend(ACTION_SETS[it])
        if not intents:
            selected.extend(ACTION_SETS["career"])
        selected.extend(boost_from_astro(fixed.get("astro_summary", {}).get("themes", [])))
        merged = dedupe_keep_order(actions + selected)
        if merged != actions:
            actions = merged
            enriched = True

    # SMART-ify vague actions (gentle tips appended)
    SMART_FIXES = [
        (re.compile(r"^\s*(be|stay|become)\s+\w+", re.I),
         "Define one observable behavior and schedule it this week."),
        (re.compile(r"^\s*(improve|increase|reduce)\s+\w+", re.I),
         "Quantify the change and set a 7-day target you can measure."),
        (re.compile(r"\b(someday|soon|eventually)\b", re.I),
         "Replace with a real date or a 48-hour first step.")
    ]
    def smartify(items: list[str]) -> list[str]:
        out = []
        for it in items:
            fixed_line = it
            for rx, tip in SMART_FIXES:
                if rx.search(fixed_line):
                    fixed_line = f"{fixed_line} — {tip}"
            out.append(fixed_line)
        return out
    if actions:
        actions = smartify(actions)

    # Clamp actions
    if len(actions) > args.max_actions:
        issues.append(f"action_items trimmed to max={args.max_actions}.")
        actions = actions[:args.max_actions]
    fixed["interpretation"]["action_items"] = actions

    # 5) Inclusive audit (report or soft rewrite)
    audit_findings = []
    if not args.no_inclusive_audit:
        audit_findings = inclusive_audit(fixed)
        if args.soft_rewrite and audit_findings:
            fixed = deep_soft_rewrite(fixed)

    # 6) Confidence normalization
    conf = fixed.setdefault("confidence", {"overall": 0.0, "notes": ""})
    try:
        overall = float(conf.get("overall", 0.0))
    except Exception:
        overall = 0.0
    if overall > 1.0:  # assume scale 0-1
        overall = min(1.0, overall/10.0)  # if 0-10 provided
        issues.append("confidence.overall normalized to 0–1 scale.")
    conf["overall"] = round(overall, 2)
    conf["notes"] = conf.get("notes") or "Validated for schema, inclusivity, and practicality."

    # 7) Safety soft flags
    blob = " ".join([
        fixed.get("meta", {}).get("question",""),
        fixed.get("interpretation", {}).get("theme",""),
        " ".join(fixed.get("astro_summary", {}).get("themes", []) or []),
        " ".join(fixed.get("interpretation", {}).get("action_items", []) or []),
    ])
    safety_notes = soft_safety_scan(blob)

    report = {
        "issues_found": issues,
        "majors_count_calculated": majors_calc,
        "element_counts_calculated": elem_calc,
        "faith_language_present": bool(faith_ok or literal_present),
        "literal_faith_added": literal_added,
        "actions_enriched": enriched,
        "inclusive_findings_count": len(audit_findings),
        "inclusive_findings": audit_findings[:50],
        "safety_notes": safety_notes
    }

    Path(args.out_path).write_text(json.dumps(fixed, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    sys.exit(0)

if __name__ == "__main__":
    main()
