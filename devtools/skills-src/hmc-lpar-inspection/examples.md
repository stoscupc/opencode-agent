## Example 1: Quick LPAR Status Check

Check the status of all LPARs across all Classic CPCs:

```bash
# One-liner to get all LPAR statuses
for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  echo "CPC: $CPC_NAME"
  curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][] | "  \(.name): \(.status)"'
done
```

**Output:**
```
CPC: CPC-Z16-A
  LPAR01: operating
  LPAR02: not-operating
  LPAR03: operating
  LPAR04: exceptions
```

## Example 2: Find LPARs with Issues

Identify all LPARs that require attention:

```bash
# Find LPARs with exceptions or unacceptable status
for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  ISSUES=$(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][] | select(.status == "exceptions" or .status == "acceptable" or ."has-unacceptable-status" == true) | "\(.name) (\(.status))"')
  
  if [ -n "$ISSUES" ]; then
    echo "CPC: $CPC_NAME - Issues Found:"
    echo "$ISSUES" | sed 's/^/  /'
  fi
done
```

**Output:**
```
CPC: CPC-Z16-A - Issues Found:
  LPAR04 (exceptions)
  LPAR07 (acceptable)
```

## Example 3: Memory Allocation Report

Generate a report of memory allocation across all LPARs:

```bash
# Memory allocation summary — fetches each LPAR individually for detail fields
echo "LPAR Memory Allocation Report"
echo "============================="
echo ""

for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  echo "CPC: $CPC_NAME"
  echo "----------------------------------------"
  
  TOTAL=0
  for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
    LPAR=$(curl -s "http://localhost:6794${LPAR_URI}")
    echo "$LPAR" | jq -r '"\(.name)\t\(."initial-memory" // "N/A")MiB\t\(."maximum-memory" // "N/A")MiB"'
    MEM=$(echo "$LPAR" | jq '."initial-memory" // 0')
    TOTAL=$((TOTAL + MEM))
  done | column -t -s $'\t'
  
  echo "Total Allocated: ${TOTAL}MiB"
  echo ""
done
```

**Output:**
```
LPAR Memory Allocation Report
=============================

CPC: CPC-Z16-A
----------------------------------------
LPAR01  8192MiB   16384MiB
LPAR02  16384MiB  32768MiB
LPAR03  4096MiB   8192MiB
Total Allocated: 28672MiB
```

## Example 4: Processor Capacity Report

Show processor capacity allocation:

```bash
# Processor capacity by LPAR — fetches each LPAR individually for detail fields
for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  echo "CPC: $CPC_NAME - Processor Allocation"
  
  TOTAL_CAP=0
  for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
    LPAR=$(curl -s "http://localhost:6794${LPAR_URI}")
    echo "$LPAR" | jq -r '"\(.name)\t\(."processor-usage" // "N/A")\t\(."defined-capacity" // "N/A")"'
    CAP=$(echo "$LPAR" | jq '."defined-capacity" // 0')
    TOTAL_CAP=$(echo "$TOTAL_CAP + $CAP" | bc)
  done | column -t -s $'\t'
  
  echo "Total Capacity: $TOTAL_CAP"
  echo ""
done
```

**Output:**
```
CPC: CPC-Z16-A - Processor Allocation
LPAR01  shared     1.0
LPAR02  shared     2.0
LPAR03  dedicated  4.0
LPAR04  shared     0.5
Total Capacity: 7.5
```

**Note:** `processor-usage` and `defined-capacity` are only available from the individual LPAR GET endpoint, not the list endpoint.

## Example 5: Operating System Inventory

List all operating systems running on LPARs:

```bash
# OS inventory across all LPARs — fetches each LPAR individually for detail fields
echo "Operating System Inventory"
echo "=========================="
echo ""

for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  
  for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
    curl -s "http://localhost:6794${LPAR_URI}" | jq -r --arg cpc "$CPC_NAME" 'select(."os-name" != null) | "\($cpc)\t\(.name)\t\(."os-type")\t\(."os-name")\t\(."os-level" // "unknown")"'
  done | column -t -s $'\t'
done
```

**Note:** `os-name`, `os-type`, and `os-level` are only available from the individual LPAR GET endpoint. The field is `os-level` (not `os-version`).

**Output:**
```
Operating System Inventory
==========================

CPC-Z16-A  LPAR01  linux  Red Hat Enterprise Linux  8.5
CPC-Z16-A  LPAR02  zos    z/OS                      2.5
CPC-Z16-A  LPAR03  linux  SUSE Linux Enterprise     15.3
```

## Example 6: Configuration Validation

Check for common configuration issues:

```bash
# Configuration validation script — fetches each LPAR individually for detail fields
echo "LPAR Configuration Validation"
echo "============================="
echo ""

for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  
  for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
    LPAR=$(curl -s "http://localhost:6794${LPAR_URI}")
    NAME=$(echo "$LPAR" | jq -r '.name')
    
    # Check for missing activation profile
    PROFILE=$(echo "$LPAR" | jq -r '."last-used-activation-profile" // ""')
    if [ -z "$PROFILE" ]; then
      echo "WARNING: CPC $CPC_NAME - $NAME has no activation profile"
    fi
    
    # Check for zero memory
    MEM=$(echo "$LPAR" | jq '."initial-memory" // 0')
    if [ "$MEM" = "0" ]; then
      echo "WARNING: CPC $CPC_NAME - $NAME has zero memory allocation"
    fi
    
    # Check for zero processor capacity
    CAP=$(echo "$LPAR" | jq '."defined-capacity" // 0')
    if [ "$CAP" = "0" ]; then
      echo "WARNING: CPC $CPC_NAME - $NAME has zero processor capacity"
    fi
  done
done

echo ""
echo "Validation complete"
```

**Output:**
```
LPAR Configuration Validation
=============================

WARNING: CPC CPC-Z16-A - LPAR05 has no activation profile
WARNING: CPC CPC-Z16-A - LPAR06 has zero memory allocation

Validation complete
```

## Example 7: JSON Report Generation

Generate a structured JSON report for automation:

```bash
# Generate JSON report — fetches each LPAR individually for detail fields
{
  echo '{'
  echo '  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",'
  echo '  "cpcs": ['
  
  FIRST_CPC=true
  for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
    if [ "$FIRST_CPC" = false ]; then
      echo '    ,'
    fi
    FIRST_CPC=false
    
    CPC_DATA=$(curl -s "http://localhost:6794${CPC_URI}")
    
    # Build LPAR array by fetching each individually
    LPARS="["
    FIRST_LPAR=true
    for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
      if [ "$FIRST_LPAR" = false ]; then
        LPARS+=","
      fi
      FIRST_LPAR=false
      LPAR=$(curl -s "http://localhost:6794${LPAR_URI}" | jq '{name, status, "initial-memory", "defined-capacity"}')
      LPARS+="$LPAR"
    done
    LPARS+="]"
    
    echo '    {'
    echo "      \"name\": $(echo "$CPC_DATA" | jq '.name'),"
    echo "      \"status\": $(echo "$CPC_DATA" | jq '.status'),"
    echo "      \"lpars\": $(echo "$LPARS" | jq '.')"
    echo -n '    }'
  done
  
  echo ''
  echo '  ]'
  echo '}'
} | jq '.'
```

**Output:**
```json
{
  "timestamp": "2026-03-04T07:42:00Z",
  "cpcs": [
    {
      "name": "CPC-Z16-A",
      "status": "operating",
      "lpars": [
        {
          "name": "LPAR01",
          "status": "operating",
          "initial-memory": 8192,
          "defined-capacity": 1.0
        },
        {
          "name": "LPAR02",
          "status": "not-operating",
          "initial-memory": 16384,
          "defined-capacity": 2.0
        }
      ]
    }
  ]
}
```

## Example 8: Integration with gantry Coordination

Coordinate LPAR inspection across multiple sessions using gantry MCP tools:

1. **Create a workflow** to track the inspection:
   - Use `workflow_create` with title "LPAR Inspection" and tags `["hmc", "lpar", "inspection"]`
2. **Create tasks** for each inspection phase:
   - `task_create` — "Discover Classic CPCs" (role: impl, priority: 2)
   - `task_create` — "Enumerate LPARs" (role: impl, priority: 2, blocked_by: discover task)
   - `task_create` — "Validate LPAR Configuration" (role: impl, priority: 3, blocked_by: enumerate task)
3. **Claim and execute** each task using `task_claim`, then run the corresponding workflow steps
4. **Broadcast results** after each step using `broadcast_result`
5. **Complete tasks** with `task_complete`, providing a summary of findings
6. **Complete the workflow** using `workflow_complete` when all tasks are done

See `docs/dev/coordination.md` for full gantry coordination documentation.