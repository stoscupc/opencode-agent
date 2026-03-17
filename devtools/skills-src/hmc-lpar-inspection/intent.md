Inspect and validate LPARs (Logical Partitions) running on IBM Z Hardware Management Console (HMC). This workflow provides comprehensive visibility into LPAR status, configuration, and operational health across all CPCs in the environment.

Use this skill when you need to:
- Discover what LPARs are currently running on the HMC
- Validate LPAR configurations and operational status
- Identify LPARs with issues or exceptions
- Audit LPAR resource allocations (processors, memory)
- Verify LPAR activation profiles and load parameters
- Generate reports on LPAR inventory and health

This skill is read-only and safe to run in production environments. It queries the HMC API through hmc-sim without making any changes to LPAR configurations or states.