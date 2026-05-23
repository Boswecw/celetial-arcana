#!/bin/bash
# Frontend structure and configuration tests

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    FRONTEND STRUCTURE TESTS                               ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo "✓ $description"
        ((TESTS_PASSED++))
    else
        echo "✗ $description (NOT FOUND: $file)"
        ((TESTS_FAILED++))
    fi
}

test_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo "✓ $description"
        ((TESTS_PASSED++))
    else
        echo "✗ $description (NOT FOUND: $dir)"
        ((TESTS_FAILED++))
    fi
}

echo "📁 DIRECTORY STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_dir "src" "src directory"
test_dir "src/lib" "src/lib directory"
test_dir "src/routes" "src/routes directory"
test_dir "src/lib/components" "src/lib/components directory"
test_dir "src/lib/decks" "src/lib/decks directory"
test_dir "static" "static directory"
test_dir "static/cards" "static/cards directory"
echo ""

echo "📄 CONFIGURATION FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "package.json" "package.json"
test_file "tsconfig.json" "tsconfig.json"
test_file "svelte.config.js" "svelte.config.js"
test_file "tailwind.config.js" "tailwind.config.js"
test_file "vite.config.ts" "vite.config.ts"
test_file "postcss.config.js" "postcss.config.js"
echo ""

echo "🎨 SVELTE PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/routes/+page.svelte" "Main page"
test_file "src/routes/+layout.svelte" "Layout"
test_file "src/routes/reading/+page.svelte" "Reading page"
test_file "src/routes/deck/+page.svelte" "Deck page"
test_file "src/routes/dashboard/+page.svelte" "Dashboard page"
test_file "src/routes/alignment/+page.svelte" "Alignment page"
echo ""

echo "🧩 COMPONENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/lib/components/Card.svelte" "Card component"
test_file "src/lib/components/ReadingExplainer.svelte" "ReadingExplainer component"
test_file "src/lib/components/ReadingFeedback.svelte" "ReadingFeedback component"
test_file "src/lib/components/VideoPopup.svelte" "VideoPopup component"
echo ""

echo "🎴 DECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/lib/decks/celestia-arcana.ts" "Celestia Arcana deck"
test_file "src/lib/decks/index.ts" "Deck index"
test_file "src/lib/decks/tarot-meanings-map.ts" "Tarot meanings map"
test_file "src/lib/decks/tarot_meanings.json" "Tarot meanings data"
echo ""

echo "📚 LIBRARY FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/lib/tarot.ts" "Tarot library"
test_file "src/lib/ephemeris.ts" "Ephemeris library"
test_file "src/lib/guardrails.ts" "Guardrails library"
test_file "src/lib/rag.ts" "RAG library"
test_file "src/lib/rulesEngine.ts" "Rules engine"
test_file "src/lib/aiTrainer.ts" "AI trainer"
test_file "src/lib/index.ts" "Library index"
echo ""

echo "🔌 API ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_dir "src/routes/api/astro-tarot" "astro-tarot API"
test_dir "src/routes/api/reading" "reading API"
test_dir "src/routes/api/cards" "cards API"
test_dir "src/routes/api/ephemeris" "ephemeris API"
test_dir "src/routes/api/feedback" "feedback API"
test_dir "src/routes/api/combined-reading" "combined-reading API"
test_dir "src/routes/api/reading-explanation" "reading-explanation API"
echo ""

echo "🎨 STYLING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/app.css" "App CSS"
test_file "src/app.html" "App HTML"
test_file "src/app.d.ts" "App types"
echo ""

echo "🎯 STATIC ASSETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "static/favicon.ico" "Favicon"
test_file "static/robots.txt" "Robots.txt"
echo ""

echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests:  $TOTAL"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    exit 1
fi

