User: "Gemma3 planning quality dropped after the last prompt change"

1. Run planning evals against current baselines:
   ```bash
   cd z-tf-expert && go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags planning -baseline eval/baselines
   ```
2. Observe regression report — identify which cases degraded and by how much
3. Dump traces for the worst-performing case:
   ```bash
   go run ./eval/cmd/run-eval -history
   go run ./eval/cmd/run-eval -dump <RUN_ID>
   ```
4. Diagnose from LLM traces — look for thin plans, missing resource blocks, or hallucinated properties
5. Tune parameters if the issue is context overflow:
   ```bash
   WF_SEARCH_KNOWLEDGE_MAX=3 WF_SEARCH_CORPUS_MAX=3 go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags planning
   ```
6. If quality improves, run full suite to check for cross-category regressions:
   ```bash
   go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -baseline eval/baselines
   ```
7. Save updated baselines only after confirming no regressions:
   ```bash
   go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -save-baseline -format both
   ```

---

User: "Compare Gemma3 against Falcon3 on golden-path cases"

1. Run golden-path evals for both models:
   ```bash
   cd z-tf-expert
   go run ./eval/cmd/run-eval -model falcon3:7b -tags golden-path -save-baseline -format both
   go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags golden-path -save-baseline -format both
   ```
2. Compare saved baselines in `eval/baselines/` — look at quality scores and duration
3. For cases where Gemma3 underperforms, run with verbose traces:
   ```bash
   go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -case golden-path-simple-linux-partition -verbose
   ```
4. Report findings: which categories each model excels at, where Gemma3 needs tuning

---

User: "Gemma3 is timing out on iterative planning cases"

1. Run iterative cases to reproduce:
   ```bash
   cd z-tf-expert && go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags iterative
   ```
2. If timeouts confirmed, increase round limits:
   ```bash
   WF_ROUND_MAX_PLANNING=4 WF_CONFIDENCE_THRESHOLD=0.75 go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags iterative
   ```
3. If still failing, reduce search context to free up tokens:
   ```bash
   WF_ROUND_MAX_PLANNING=4 WF_SEARCH_KNOWLEDGE_MAX=3 WF_SEARCH_ENRICH_MAX=1 go run ./eval/cmd/run-eval -model gemma3:12b-it-qat -tags iterative
   ```
4. Run full suite to verify no regressions before saving baselines
