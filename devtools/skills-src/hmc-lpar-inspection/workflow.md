## Prerequisites

Ensure hmc-sim is running:

```bash
cd hmc-sim
./hmc-sim -seed
```

The HMC API will be available at `http://localhost:6794`.

## Step 1: List All CPCs

First, discover all CPCs managed by the HMC:

```bash
curl -s http://localhost:6794/api/cpcs | jq '.cpcs[] | {name, status, "dpm-enabled", "machine-type", "machine-model"}'
```

**Expected Output:**
```json
{
  "name": "CPC-Z16-A",
  "status": "operating",
  "dpm-enabled": false,
  "machine-type": "3931",
  "machine-model": "A01"
}
```

**Key Fields:**
- `dpm-enabled: false` — Classic mode CPC (has LPARs)
- `dpm-enabled: true` — DPM mode CPC (has Partitions, not LPARs)
- `status` — CPC operational state

**Note:** LPARs only exist on Classic-mode CPCs. Filter for CPCs where `dpm-enabled` is `false`.

## Step 2: List LPARs for Each Classic CPC

For each Classic-mode CPC, retrieve its LPARs:

```bash
# Get CPC URI first
CPC_URI=$(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"' | head -1)

# List LPARs for this CPC
curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq '.["logical-partitions"][] | {name, status, "activation-mode", "has-unacceptable-status"}'
```

**Expected Output:**
```json
{
  "name": "LPAR01",
  "status": "operating",
  "activation-mode": "linux",
  "has-unacceptable-status": false
}
```

**LPAR Status Values:**
- `not-activated` — LPAR has not been activated
- `not-operating` — Activated but not loaded (no IPL)
- `operating` — OS is running normally
- `acceptable` — Running with minor issues
- `exceptions` — Running with serious issues

## Step 3: Get Detailed LPAR Properties

For each LPAR, retrieve comprehensive configuration details:

```bash
# Get LPAR URI
LPAR_URI=$(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][0]."object-uri"')

# Get full LPAR properties
curl -s "http://localhost:6794${LPAR_URI}" | jq '{
  name,
  status,
  "activation-mode",
  "processor-usage",
  "defined-capacity",
  "initial-memory",
  "maximum-memory",
  "partition-number",
  "has-unacceptable-status",
  "last-used-load-address",
  "last-used-load-parameter",
  "os-name",
  "os-type",
  "os-level"
}'
```

**Note:** These detail fields are only available from the individual LPAR GET endpoint (`/api/cpcs/{cpc-id}/logical-partitions/{lpar-id}`), NOT from the list endpoint. The list endpoint returns only: `name`, `status`, `activation-mode`, `has-unacceptable-status`, `object-uri`, `object-id`, `cpc-object-uri`, `cpc-name`, `se-version`, `resource-source`.

**Key Properties:**
- `processor-usage` — Processor type (shared, dedicated)
- `defined-capacity` — Processor capacity allocation
- `initial-memory`, `maximum-memory` — Memory allocation in MiB
- `partition-number` — Unique LPAR identifier within CPC
- `has-unacceptable-status` — Boolean flag for health issues
- `last-used-load-address` — Boot device address
- `os-name`, `os-type`, `os-level` — Operating system information

## Step 4: Identify LPARs with Issues

Filter LPARs that require attention:

```bash
curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq '.["logical-partitions"][] | select(.status == "exceptions" or .status == "acceptable" or ."has-unacceptable-status" == true) | {name, status, "has-unacceptable-status"}'
```

**Issue Categories:**
- `status: "exceptions"` — Critical issues requiring immediate attention
- `status: "acceptable"` — Minor issues, monitor closely
- `has-unacceptable-status: true` — Status not in acceptable list

## Step 5: Generate LPAR Inventory Report

Create a comprehensive inventory across all Classic CPCs:

```bash
# Full inventory script — fetches detail for each LPAR
for CPC_URI in $(curl -s http://localhost:6794/api/cpcs | jq -r '.cpcs[] | select(."dpm-enabled" == false) | ."object-uri"'); do
  CPC_NAME=$(curl -s "http://localhost:6794${CPC_URI}" | jq -r '.name')
  echo "=== CPC: $CPC_NAME ==="
  
  for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
    curl -s "http://localhost:6794${LPAR_URI}" | jq -r '"\(.name)\t\(.status)\t\(."activation-mode")\t\(."initial-memory" // "N/A")MiB\t\(."defined-capacity" // "N/A")"'
  done
  echo ""
done
```

**Note:** The list endpoint only returns summary fields (name, status, activation-mode). Fields like `initial-memory` and `defined-capacity` require fetching each LPAR individually via its `object-uri`.

**Report Format:**
```
=== CPC: CPC-Z16-A ===
LPAR01  operating       linux   8192MiB  1.0
LPAR02  not-operating   zos     16384MiB 2.0
LPAR03  operating       linux   4096MiB  0.5
```

## Step 6: Validate LPAR Configuration

Check for common configuration issues:

**Note:** These checks require fetching individual LPAR details since `last-used-activation-profile`, `initial-memory`, and `defined-capacity` are not in the list response.

```bash
# Check for configuration issues — fetches each LPAR individually
for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
  LPAR=$(curl -s "http://localhost:6794${LPAR_URI}")
  
  NAME=$(echo "$LPAR" | jq -r '.name')
  
  # Check for missing activation profile
  PROFILE=$(echo "$LPAR" | jq -r '."last-used-activation-profile" // ""')
  if [ -z "$PROFILE" ]; then
    echo "WARNING: $NAME has no activation profile"
  fi
  
  # Check for zero memory allocation
  MEM=$(echo "$LPAR" | jq -r '."initial-memory" // 0')
  if [ "$MEM" = "0" ]; then
    echo "WARNING: $NAME has zero memory allocation"
  fi
  
  # Check for zero processor capacity
  CAP=$(echo "$LPAR" | jq -r '."defined-capacity" // 0')
  if [ "$CAP" = "0" ]; then
    echo "WARNING: $NAME has zero processor capacity"
  fi
done
```

## Step 7: Check LPAR Resource Utilization

Aggregate resource allocation across all LPARs:

```bash
# Total memory allocated (requires fetching each LPAR individually)
TOTAL_MEM=0
for LPAR_URI in $(curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq -r '.["logical-partitions"][]."object-uri"'); do
  MEM=$(curl -s "http://localhost:6794${LPAR_URI}" | jq '."initial-memory" // 0')
  TOTAL_MEM=$((TOTAL_MEM + MEM))
done
echo "Total memory allocated: ${TOTAL_MEM}MiB"

# Count LPARs by status (uses list endpoint — status IS available)
curl -s "http://localhost:6794${CPC_URI}/logical-partitions" | jq '.["logical-partitions"] | group_by(.status) | map({status: .[0].status, count: length})'
```

## Complete Workflow Summary

1. **List CPCs** — Identify Classic-mode CPCs (dpm-enabled: false)
2. **List LPARs** — For each Classic CPC, retrieve LPAR inventory
3. **Get Details** — Fetch comprehensive properties for each LPAR
4. **Identify Issues** — Filter LPARs with exceptions or unacceptable status
5. **Generate Report** — Create inventory report across all CPCs
6. **Validate Config** — Check for configuration anomalies
7. **Check Resources** — Aggregate resource utilization metrics

## Integration with gantry

This workflow can be integrated with gantry for coordinated multi-session inspection. Use the gantry MCP tools (available via `gantry mcp` stdio transport):

1. **Create a workflow** to track the inspection:
   - Use `workflow_create` with title "LPAR Inspection" and appropriate tags
2. **Create tasks** for each inspection step:
   - Use `task_create` to break down CPC discovery, LPAR enumeration, and validation into claimable tasks
3. **Broadcast results** after each step:
   - Use `broadcast_result` to share findings with other sessions
4. **Complete the workflow** when all tasks finish:
   - Use `workflow_complete` to mark the inspection as done

See `docs/dev/coordination.md` for full gantry coordination documentation.

## Troubleshooting

**Issue:** No LPARs returned for a CPC
- **Cause:** CPC is in DPM mode (dpm-enabled: true)
- **Solution:** DPM-mode CPCs use Partitions, not LPARs. Use partition inspection workflow instead.

**Issue:** LPAR status shows "not-operating"
- **Cause:** LPAR is activated but not loaded (IPL not performed)
- **Solution:** Use Load operation to boot the LPAR

**Issue:** Connection refused to localhost:6794
- **Cause:** hmc-sim is not running
- **Solution:** Start hmc-sim with `./hmc-sim -seed`