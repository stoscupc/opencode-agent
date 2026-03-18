.PHONY: install-opencode setup

install-opencode:
	@set -e; \
	if ! command -v brew >/dev/null 2>&1; then \
		echo "❌ Error: Homebrew was not found on PATH."; \
		echo "ℹ️ Install OpenCode using the official install method for your system, or install Homebrew first."; \
		exit 1; \
	fi; \
	echo "ℹ️ Installing OpenCode with Homebrew..."; \
	brew install anomalyco/tap/opencode || { \
		echo "❌ Error: OpenCode install failed."; \
		exit 1; \
	}; \
	if command -v opencode >/dev/null 2>&1; then \
		echo "✅ OpenCode installed and available on PATH."; \
	else \
		echo "⚠️ Homebrew finished installing OpenCode, but 'opencode' is still not available on PATH."; \
		echo "ℹ️ Ensure Homebrew's bin directory is on PATH for this shell (for example, load your Homebrew shellenv settings)."; \
		echo "ℹ️ If the formula is not linked yet, run 'brew link opencode'."; \
	fi; \
	echo "ℹ️ Next: run 'opencode', use '/connect' once, then run 'make setup'."

setup:
	@set -e; \
	if ! command -v python3 >/dev/null 2>&1; then \
		echo "❌ Error: 'python3' was not found on PATH."; \
		echo "ℹ️ Install Python 3, then rerun 'make setup'."; \
		exit 1; \
	fi; \
	if ! command -v opencode >/dev/null 2>&1; then \
		echo "❌ Error: 'opencode' was not found on PATH."; \
		echo "ℹ️ Run 'make install-opencode' first (or use the official install method for your system)."; \
		echo "ℹ️ Then run 'opencode', use '/connect' once, and rerun 'make setup'."; \
		exit 1; \
		fi; \
		echo "✅ OpenCode and python3 are available."; \
	jira_status=$$(printf '%s\n' \
		'import os, pathlib, re' \
		'required = ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN")' \
		'dotenv = {}' \
		'env_path = pathlib.Path(".env")' \
		'config_dir = pathlib.Path.home() / ".config" / "opencode"' \
		'jira_env_path = config_dir / "jira.env"' \
		'pattern = re.compile(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$$")' \
		'if env_path.exists():' \
		'    for raw_line in env_path.read_text().splitlines():' \
		'        line = raw_line.strip()' \
		'        if not line or line.startswith("#"):' \
		'            continue' \
		'        match = pattern.match(line)' \
		'        if not match:' \
		'            continue' \
		'        key, value = match.groups()' \
		'        value = value.strip()' \
		'        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("\"", chr(39)):' \
		'            value = value[1:-1]' \
		'        dotenv[key] = value' \
		'shell_ready = all(bool(os.environ.get(name, "").strip()) for name in required)' \
		'resolved = {}' \
		'for name in required:' \
		'    shell_value = os.environ.get(name, "").strip()' \
		'    dotenv_value = dotenv.get(name, "").strip()' \
		'    if shell_value:' \
		'        resolved[name] = shell_value' \
		'    elif dotenv_value:' \
		'        resolved[name] = dotenv_value' \
		'if jira_env_path.exists():' \
		'    jira_env_path.chmod(0o600)' \
		'if len(resolved) == len(required):' \
		'    config_dir.mkdir(parents=True, exist_ok=True)' \
		'    jira_env_path.write_text("\n".join(f"{name}={resolved[name]}" for name in required) + "\n")' \
		'    jira_env_path.chmod(0o600)' \
		'    print("shell" if shell_ready else "ready")' \
		'else:' \
		'    print("missing")' \
	| python3 -); \
	if [ "$$jira_status" = "shell" ]; then \
		echo "✅ Jira environment variables detected in the current shell and persisted to ~/.config/opencode/jira.env."; \
	elif [ "$$jira_status" = "ready" ]; then \
		echo "✅ Jira environment variables detected via the current shell or local .env file and persisted to ~/.config/opencode/jira.env."; \
	else \
		echo "⚠️ Warning: Jira environment variables are not fully set in the current shell or local .env file."; \
		echo "ℹ️ If you plan to use the Jira tools, set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN"; \
		echo "ℹ️ in your environment or this setup repo's local .env file, then rerun 'make setup' to persist them to ~/.config/opencode/jira.env."; \
	fi; \
	if ! command -v gh >/dev/null 2>&1; then \
		echo "⚠️ Warning: 'gh' was not found on PATH."; \
		echo "ℹ️ Install GitHub CLI with 'brew install gh' before using PR-related workflows."; \
	elif ! gh auth status >/dev/null 2>&1; then \
		echo "⚠️ Warning: GitHub CLI is installed but not authenticated."; \
		echo "ℹ️ Run 'gh auth login' to sign in, then verify with 'gh auth status' before using PR-related workflows."; \
	else \
		echo "✅ GitHub CLI is installed and authenticated."; \
	fi; \
	./sync-agent; \
	printf "\nNext steps:\n"; \
	printf "1. cd to the folder where you want work done.\n"; \
	printf "2. Run 'opencode'.\n"; \
	printf "3. Describe the work you want done, or paste a Jira ticket link.\n"
