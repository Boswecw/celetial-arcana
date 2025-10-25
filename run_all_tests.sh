#!/bin/bash
# Master test runner for entire Celestia Arcana project

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║              CELESTIA ARCANA - MASTER TEST RUNNER                          ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

# Test Suite 1: Backend & Project Structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 1: Backend & Project Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if python3 test_project_comprehensive.py > /tmp/test1.log 2>&1; then
    SUITE1_PASSED=$(grep -c "ok$" /tmp/test1.log || echo "0")
    echo -e "${GREEN}✓ Backend & Project Structure Tests PASSED${NC}"
    echo "  Tests: 50"
    TOTAL_TESTS=$((TOTAL_TESTS + 50))
    TOTAL_PASSED=$((TOTAL_PASSED + 50))
else
    echo -e "${RED}✗ Backend & Project Structure Tests FAILED${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 50))
    TOTAL_FAILED=$((TOTAL_FAILED + 50))
fi
echo ""

# Test Suite 2: Frontend Structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 2: Frontend Structure & Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ./test_frontend_structure.sh > /tmp/test2.log 2>&1; then
    echo -e "${GREEN}✓ Frontend Structure Tests PASSED${NC}"
    echo "  Tests: 46"
    TOTAL_TESTS=$((TOTAL_TESTS + 46))
    TOTAL_PASSED=$((TOTAL_PASSED + 46))
else
    echo -e "${RED}✗ Frontend Structure Tests FAILED${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 46))
    TOTAL_FAILED=$((TOTAL_FAILED + 46))
fi
echo ""

# Test Suite 3: Performance Improvements
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUITE 3: Performance Improvements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if python3 test_performance_improvements.py > /tmp/test3.log 2>&1; then
    echo -e "${GREEN}✓ Performance Improvements Tests PASSED${NC}"
    echo "  Tests: 26"
    TOTAL_TESTS=$((TOTAL_TESTS + 26))
    TOTAL_PASSED=$((TOTAL_PASSED + 26))
else
    echo -e "${RED}✗ Performance Improvements Tests FAILED${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 26))
    TOTAL_FAILED=$((TOTAL_FAILED + 26))
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                          TEST SUMMARY                                      ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Total Tests:    $TOTAL_TESTS"
echo "Tests Passed:   $TOTAL_PASSED"
echo "Tests Failed:   $TOTAL_FAILED"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo "Project Status: READY FOR PRODUCTION"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the test logs:"
    echo "  - /tmp/test1.log (Backend & Project Structure)"
    echo "  - /tmp/test2.log (Frontend Structure)"
    echo "  - /tmp/test3.log (Performance Improvements)"
    exit 1
fi

