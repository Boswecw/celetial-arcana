# Celestia Arcana ✨  

An immersive SvelteKit experience that blends tarot, astrology, and AI narration into one flowing reading. The app animates the entire tarot deck while a multi-stage pipeline gathers astrological context, generates a hybrid reading, and narrates it aloud based on user preferences.

---

## Highlights

- **Full-deck portal animation** – All 78 cards swirl across a full-screen overlay whenever a reading is generated.
- **Toggleable narration** – Switch between hearing the traditional tarot interpretation + Celestia synthesis together, or just the synthesis.
- **Smart zodiac fallback** – Birthdate input now maps to the correct sign and element even if the ephemeris API omits a value.
- **Conversational explainer** – “Ask About Your Reading” is primed with the reading context and matches the corrected sun sign.

---

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1 (preferred) or Node 18+ with npm/pnpm
- OpenAI API key for AI readings (`.env` already contains the variable name `OPENAI_API_KEY`)

---

## Getting Started

```bash
# install dependencies
bun install

# run dev server
bun run dev
# or choose a different port
bun run dev -- --port 5180

# lint / format
bun run lint
bun run format

# run the test suites (backend, structure, perf)
./run_all_tests.sh
```

The app expects tarot card images in `static/cards/` (already committed). All API routes are local SvelteKit endpoints; no additional services are required beyond an OpenAI-compatible key.

---

## Key Commands

| Command                    | Description                                             |
|---------------------------|---------------------------------------------------------|
| `bun run dev`             | Launch SvelteKit locally (Vite dev server).             |
| `bun run build`           | Production build.                                       |
| `bun run preview`         | Preview the production bundle.                          |
| `./run_all_tests.sh`      | Executes 3 logical suites (backend/structure/perf).     |
| `bunx svelte-check`       | Source type checking (also covered by `run_all_tests`). |

---

## Project Structure (excerpt)

```
src/
└── routes/
    ├── +page.svelte               # Landing page
    ├── reading/+page.svelte       # Reading UI (toggle, animation, narration)
    ├── api/
    │   ├── astro-tarot/+server.ts # Python integration
    │   ├── reading/+server.ts     # Rule engine + guardrails
    │   ├── combined-reading/+server.ts
    │   └── reading-explanation/+server.ts
    └── alignment/+page.svelte     # Birth chart calculator
src/lib/
└── ephemeris.ts                   # Astronomical calculations, new fallback logic
```

---

## What Changed Recently

- Traditional/synthesis toggle moved above the form and now drives narration and UI.
- Swirl overlay reimplemented to cover the entire screen with every tarot card orbiting multiple rings.
- Narration selects elder/female US voices and obeys the toggle state.
- Sun sign fallback guarantees “Ask About Your Reading” references the correct sign when ephemeris data is missing.
- Toast messaging added for toggle feedback with longer display duration.

---

## Environmental Variables

| Variable            | Purpose                               |
|---------------------|---------------------------------------|
| `OPENAI_API_KEY`    | Required for synthesis + explanations |
| `ASTRO_TAROT_MODEL` | Optional override (defaults to `gpt-4o-mini`) |

---

## Deployment Notes

- This project was scaffolded with SvelteKit; deploy to any platform supporting Node/Bun (Vercel, Netlify, Fly.io, etc.).
- Remember to set `OPENAI_API_KEY` in production.
- If service workers are enabled, unregister stale workers when debugging the animation overlay or toggle UI.

---

**Built to weave cards, cosmos, and code together.**  
May your readings be luminous. 🔮
