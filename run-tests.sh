#!/bin/bash
set -e

API_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"
PASSED=0
FAILED=0

green() { echo -e "\033[32m✓ $1\033[0m"; }
red() { echo -e "\033[31m✘ $1\033[0m"; }

assert_eq() {
  local test_name="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    green "$test_name"
    PASSED=$((PASSED + 1))
  else
    red "$test_name (expected: $expected, got: $actual)"
    FAILED=$((FAILED + 1))
  fi
}

assert_contains() {
  local test_name="$1" actual="$2" expected="$3"
  if echo "$actual" | grep -q "$expected"; then
    green "$test_name"
    PASSED=$((PASSED + 1))
  else
    red "$test_name (expected to contain: $expected)"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "========================================"
echo "  Checking services are running..."
echo "========================================"

HEALTH=$(curl -s "$API_URL/health" 2>/dev/null || echo "FAIL")
if echo "$HEALTH" | grep -q '"ok"'; then
  green "Backend running"
else
  red "Backend not running at $API_URL — start with: docker compose up -d"
  exit 1
fi

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  green "Frontend running"
else
  red "Frontend not running at $FRONTEND_URL — start with: docker compose up -d"
  exit 1
fi

echo ""
echo "========================================"
echo "  API Tests (Backend)"
echo "========================================"

# 1. Empty list
RESPONSE=$(curl -s "$API_URL/api/sales")
assert_eq "GET /sales — empty list" "$RESPONSE" "[]"

# 2. Create sale
RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Acme Corp","product":"Laptop","amount":1299.99}')
assert_contains "POST /sales — create sale" "$RESPONSE" '"customer":"Acme Corp"'
assert_contains "POST /sales — score is null" "$RESPONSE" '"score":null'

# 3. Create second sale
RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Globex Inc","product":"Monitor","amount":450}')
assert_contains "POST /sales — create second sale" "$RESPONSE" '"customer":"Globex Inc"'

# 4. Create third sale
RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Initech","product":"Teclado","amount":89.50}')
assert_contains "POST /sales — create third sale" "$RESPONSE" '"customer":"Initech"'

# 5. List all (3 sales, desc order)
RESPONSE=$(curl -s "$API_URL/api/sales")
COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
assert_eq "GET /sales — 3 sales" "$COUNT" "3"
FIRST_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
assert_eq "GET /sales — ordered desc (first id=3)" "$FIRST_ID" "3"

# 6. Evaluate sale 1 with score 5
RESPONSE=$(curl -s -X POST "$API_URL/api/sales/1/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":5}')
assert_contains "POST /sales/1/evaluate — score 5" "$RESPONSE" '"score":5'

# 7. Evaluate sale 2 with score 3
RESPONSE=$(curl -s -X POST "$API_URL/api/sales/2/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":3}')
assert_contains "POST /sales/2/evaluate — score 3" "$RESPONSE" '"score":3'

# 8. Re-evaluate sale 1 with score 2
RESPONSE=$(curl -s -X POST "$API_URL/api/sales/1/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":2}')
assert_contains "POST /sales/1/evaluate — re-evaluate to 2" "$RESPONSE" '"score":2'

# 9. Verify scores in list
RESPONSE=$(curl -s "$API_URL/api/sales")
AVG=$(echo "$RESPONSE" | python3 -c "
import sys,json
sales=json.load(sys.stdin)
scored=[s for s in sales if s['score'] is not None]
print(f\"{sum(s['score'] for s in scored)/len(scored):.1f}\")
")
assert_eq "GET /sales — average score is 2.5" "$AVG" "2.5"

# Validation tests
echo ""
echo "--- Validations ---"

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"","product":"X","amount":10}')
assert_contains "Validation — empty customer" "$RESPONSE" '"error":"customer is required"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Test","product":"","amount":10}')
assert_contains "Validation — empty product" "$RESPONSE" '"error":"product is required"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Test","product":"X","amount":-5}')
assert_contains "Validation — negative amount" "$RESPONSE" '"error":"amount must be a number greater than 0"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Test","product":"X","amount":0}')
assert_contains "Validation — zero amount" "$RESPONSE" '"error":"amount must be a number greater than 0"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{"customer":"Test","product":"X","amount":"abc"}')
assert_contains "Validation — non-numeric amount" "$RESPONSE" '"error":"amount must be a number greater than 0"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales" -H 'Content-Type: application/json' \
  -d '{}')
assert_contains "Validation — missing fields" "$RESPONSE" '"error":"customer is required"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales/1/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":0}')
assert_contains "Validation — score 0" "$RESPONSE" '"error":"score must be an integer between 1 and 5"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales/1/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":6}')
assert_contains "Validation — score 6" "$RESPONSE" '"error":"score must be an integer between 1 and 5"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales/1/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":3.5}')
assert_contains "Validation — decimal score" "$RESPONSE" '"error":"score must be an integer between 1 and 5"'

RESPONSE=$(curl -s -X POST "$API_URL/api/sales/999/evaluate" -H 'Content-Type: application/json' \
  -d '{"score":3}')
assert_contains "Validation — sale not found (404)" "$RESPONSE" '"error":"sale not found"'

FRONTEND_TITLE=$(curl -s "$FRONTEND_URL" | grep -o '<title>[^<]*</title>')
assert_eq "Frontend — title" "$FRONTEND_TITLE" "<title>Mini Sales App</title>"

echo ""
echo "========================================"
echo "  UI Tests (Playwright)"
echo "========================================"
npx playwright test --reporter=list
PW_EXIT=$?

echo ""
echo "========================================"
echo "  Results"
echo "========================================"
echo -e "API tests:  \033[32m$PASSED passed\033[0m, \033[31m$FAILED failed\033[0m"
if [ $PW_EXIT -eq 0 ]; then
  echo -e "UI tests:   \033[32mall passed\033[0m"
else
  echo -e "UI tests:   \033[31msome failed\033[0m"
fi
echo ""

if [ $FAILED -gt 0 ] || [ $PW_EXIT -ne 0 ]; then
  exit 1
fi
