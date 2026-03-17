### Run all tests (root justfile)

```bash
just test
```

This runs: hmc-sim tests (Go + integration), terraform-provider tests, zdnn-sim tests.

### Run tests per project

```bash
cd hmc-sim && just test-go                    # Go unit tests (fast)
cd hmc-sim && just integration-test-full      # Full integration cycle
cd z-tf-expert && just test                   # Go unit tests
cd z-manuals-kb && just test-client-unit      # Go client tests
cd iocp-sim && just test                      # Rust tests
```

### Run tests with coverage

```bash
cd hmc-sim && just test-cover
cd z-tf-expert && just test-coverage
```

### Integration tests requiring running services

Start services first with `./up`, then:

```bash
cd z-tf-expert && just integration-test       # Requires Ollama
cd z-manuals-kb && just test-integration      # Requires Podman
```
