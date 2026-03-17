### Test Scope

- The root `just test` runs unit tests for all projects. It does not run integration tests.
- Integration tests require running services (`./up` first) and are run separately per project.
- Always run tests with the race detector enabled for Go projects (`-race` flag).

### Failure Handling

- If tests fail, investigate and fix before proceeding.
- Do not ignore flaky tests — create bugfix tasks for intermittent failures.
- Broadcast a `test` result after the suite completes.

### Coverage

- Use `just test-cover` or project-specific coverage commands to check coverage.
- Coverage reports help identify untested code paths — they are not a quality gate by themselves.

### Important

- Some tests require external dependencies (Ollama for z-tf-expert, Podman for z-manuals-kb integration).
- Tests that require running services will fail silently or with connection errors if services are down.
