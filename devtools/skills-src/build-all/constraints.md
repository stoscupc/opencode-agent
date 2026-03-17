### Build Order

- The root `just build` handles dependency ordering automatically.
- If building individual projects, follow the dependency chain: z-manuals-kb -> z-tf-expert (expert depends on kb client).
- hmc-sim, iocp-sim, and gantry can be built independently.

### Build Flags

- Go projects use `-buildvcs=false` when building outside a git worktree.
- Rust projects use `--release` for production builds, default profile for development.
- Do not modify build flags unless you understand the implications.

### Failure Handling

- If a single project fails, fix it before proceeding — do not ignore build errors.
- Build errors in one project may indicate API contract changes that affect dependent projects.
- Broadcast a `build` result after the build completes (success or failure).
