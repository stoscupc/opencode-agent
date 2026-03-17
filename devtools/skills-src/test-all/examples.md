### Run All Tests

```bash
just test
```

### Run Tests Per Project

```bash
cd hmc-sim && just test-go              # Go unit tests (fast)
cd z-tf-expert && just test             # Go unit tests
cd gantry && go test -race ./...        # Gantry with race detector
cd iocp-sim && just test                # Rust tests
cd z-manuals-kb && just test-client-unit  # Go client tests
cd web && npm test                      # Web tests
```

### Run with Coverage

```bash
cd hmc-sim && just test-cover
cd z-tf-expert && just test-coverage
```

### Integration Tests (Require Running Services)

```bash
cd hmc-sim && just integration-test-full
cd z-tf-expert && just integration-test     # Requires Ollama
cd z-manuals-kb && just test-integration    # Requires Podman
```

### Broadcast Test Result

```
broadcast_result(kind="test", project="hmc-sim", success=true, summary="142 tests passed, 3 skipped, 0 failed")
```
