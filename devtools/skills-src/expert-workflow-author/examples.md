User: "Create a workflow that checks the status of all LPARs on a CPC"

1. Create `z-tf-expert/docs/workflows/lpar-status-check.md`
2. Write the standard header:
   ```markdown
   # Workflow: LPAR Status Check
   **Outcome**: Enumerate all LPARs on a target CPC and report their operating status.
   **Grounding**: Uses HMC REST API to list and inspect LPARs.
   ```
3. Add a params block:
   ````markdown
   ```scripted
   params:
     target_cpc_name:
       required: true
       description: "Name of the CPC to inspect"
   ```
   ````
4. Write steps: authenticate -> list CPCs -> filter target -> list LPARs -> collect status -> logout
5. Add narrative between each step explaining why it exists
6. Add `on_error: retry(3)` for the authenticate step, `validate` after CPC lookup
7. Verify all `{{var}}` references resolve

---

User: "The boot-linux workflow is missing SCSI boot parameters"

1. Read the existing workflow file to understand current structure
2. Identify where SCSI parameters (WWPN, LUN) should be added
3. Add params to the `params` scripted block:
   ````markdown
   ```scripted
   params:
     wwpn:
       required: false
       description: "WWPN for SCSI boot (16 hex chars)"
     lun:
       required: false
       description: "LUN for SCSI boot (16 hex chars)"
   ```
   ````
4. Add a conditional step that sets IPL type based on whether SCSI params are provided
5. Preserve ALL existing narrative and steps — only add new content
6. Add `validate` after the IPL step to confirm boot succeeded

---

User: "Add error handling to the CPC recovery workflow"

1. Read `z-tf-expert/docs/workflows/cpc-recovery-remediation.md`
2. Identify steps lacking error handling
3. Add `on_error: retry(3)` to network calls (authenticate, deactivate, activate)
4. Add `validate` after the activate step to verify CPC returned to operating status:
   ````markdown
   ```scripted
   step: validate_recovery
   validate: "{{cpc_status}} == 'operating'"
   on_error: fail("CPC did not return to operating status")
   ```
   ````
5. Add narrative explaining the recovery verification logic
6. Do NOT modify existing step IDs or remove existing steps
