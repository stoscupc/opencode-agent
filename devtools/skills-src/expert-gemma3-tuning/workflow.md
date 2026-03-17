### 1. Run Full Gemma3 Eval Suite

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat
```

### 2. Run Against Current Baselines (Regression Detection)

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -baseline eval/baselines
```

Thresholds: duration >20% slower = warn, >50% = error; quality >5% drop = warn, >15% = error.

### 3. Run Specific Case Categories

```bash
cd /Users/jrepp/dev/z/z-tf-expert

# Intent extraction (Gemma3 is 4.1x slower here)
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags intent

# Planning (Gemma3 produces thin plans)
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags planning

# Golden-path end-to-end
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags golden-path

# Iterative planning (timeout-prone)
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags iterative

# Generation (missing provider blocks)
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags generation
```

### 4. Run Single Case with Verbose LLM Traces

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -case golden-path-simple-linux-partition -verbose
```

### 5. Dump Full Traces from a Previous Run

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go run ./eval/cmd/run-eval -history                    # find the RUN_ID
go run ./eval/cmd/run-eval -dump <RUN_ID>             # inspect LLM traces
go run ./eval/cmd/run-eval -trend planning-simple-partition  # quality over time
```

### 6. Tune WorkflowConfig Parameters

All tuning is done via `WF_*` environment variables. Key tuning levers for Gemma3:

```bash
cd /Users/jrepp/dev/z/z-tf-expert

# Reduce search limits (fits in 8K context)
WF_SEARCH_KNOWLEDGE_MAX=4 WF_SEARCH_ENRICH_MAX=2 WF_SEARCH_CORPUS_MAX=4 \
  go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags planning

# Adjust quality weights
WF_QUALITY_COMPLETENESS=0.5 WF_QUALITY_ACCURACY=0.3 WF_QUALITY_COVERAGE=0.2 \
  go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags planning

# Increase round limits (let Gemma3 iterate more)
WF_ROUND_MAX_PLANNING=4 WF_CONFIDENCE_THRESHOLD=0.75 \
  go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags iterative

# Increase round limits for research
WF_ROUND_MAX_RESEARCH=4 \
  go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags research
```

### 7. Cross-Model Comparison

```bash
cd /Users/jrepp/dev/z/z-tf-expert

# Run against all models
go run ./eval/cmd/run-eval -model falcon3:7b -save-baseline -format both
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -save-baseline -format both

# List available models and capabilities
go run ./eval/cmd/run-eval -list-models
```

### 8. Save Updated Baselines After Improvements

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -save-baseline -format both
```

Saves to `eval/baselines/gemma3_12b-it-qat/` and `eval/results/`.

### 9. Run Eval Framework Unit Tests

```bash
cd /Users/jrepp/dev/z/z-tf-expert
go test -v ./eval/...
```
