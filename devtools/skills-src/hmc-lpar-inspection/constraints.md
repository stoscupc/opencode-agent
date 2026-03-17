## Mode Constraints

1. **Classic Mode Only**: LPARs exist ONLY on Classic-mode CPCs where `dpm-enabled` is `false`. DPM-mode CPCs use Partitions instead.
2. **Read-Only Operations**: This workflow performs only GET requests. No LPAR configurations or states are modified.
3. **API Version**: Requires HMC Web Services API version 4.10 or higher.

## Operational Constraints

1. **HMC Availability**: The HMC API must be accessible at the configured endpoint (default: `http://localhost:6794`).
2. **Authentication**: In production environments, proper authentication credentials must be provided. The simulator uses default credentials (admin/admin).
3. **Network Access**: The system running this workflow must have network connectivity to the HMC or hmc-sim.

## Data Constraints

1. **CPC Filtering**: Always filter CPCs by `dpm-enabled: false` before attempting to list LPARs.
2. **URI Handling**: Use the `object-uri` field from API responses for subsequent requests. Do not construct URIs manually.
3. **Status Values**: Only use documented LPAR status values: `not-activated`, `not-operating`, `operating`, `acceptable`, `exceptions`.

## Performance Constraints

1. **Pagination**: For environments with many CPCs or LPARs, implement pagination if the API supports it.
2. **Rate Limiting**: Respect API rate limits. Add delays between requests if querying many resources.
3. **Timeout**: Set appropriate timeouts for API requests (recommended: 30 seconds).

## Validation Rules

1. **Required Fields**: Always check for the presence of critical fields: `name`, `status`, `object-uri`.
2. **Status Validation**: Verify LPAR status is one of the documented values before processing.
3. **Memory Values**: Memory values are in MiB (mebibytes). Validate they are non-negative integers.
4. **Processor Capacity**: Processor capacity values should be positive numbers (can be fractional).

## Error Handling

1. **404 Not Found**: CPC or LPAR may have been deleted. Skip and continue with next resource.
2. **409 Conflict**: Attempting to access LPARs on a DPM-mode CPC. Filter CPCs correctly.
3. **503 Service Unavailable**: HMC or simulator is temporarily unavailable. Retry with exponential backoff.
4. **Connection Refused**: HMC simulator is not running. Verify service status before proceeding.

## Security Constraints

1. **Credential Storage**: Never log or display authentication credentials in output.
2. **Sensitive Data**: LPAR names and configurations may be sensitive. Handle output appropriately.
3. **Audit Trail**: In production, ensure all API queries are logged for audit purposes.

## Reporting Constraints

1. **Timestamp**: Always include timestamp in generated reports.
2. **CPC Context**: Always include CPC name when reporting LPAR information.
3. **Status Summary**: Include count of LPARs by status in summary reports.
4. **Issue Highlighting**: Clearly mark LPARs with `exceptions` or `has-unacceptable-status: true`.

## Integration Constraints

1. **JSON Output**: Use `jq` or equivalent for JSON parsing. Do not use regex on JSON.
2. **Script Portability**: Use POSIX-compliant shell commands for maximum portability.
3. **Error Propagation**: Exit with non-zero status code if critical errors occur.
4. **Idempotency**: The workflow must be safe to run multiple times without side effects.

## Documentation Requirements

1. **Command Examples**: All commands must include example output.
2. **Field Descriptions**: Document the meaning and valid values for all fields used.
3. **Troubleshooting**: Include common issues and their resolutions.
4. **Prerequisites**: Clearly state all prerequisites before workflow execution.