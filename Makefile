.PHONY: setup

setup:
	@set -e; \
	if ! command -v opencode >/dev/null 2>&1; then \
		if command -v brew >/dev/null 2>&1; then \
			echo "ℹ️ OpenCode not found. Installing with Homebrew..."; \
			brew install anomalyco/tap/opencode || { \
				echo "❌ Error: OpenCode install failed."; \
				exit 1; \
			}; \
			if command -v opencode >/dev/null 2>&1; then \
				echo "✅ OpenCode installed and available on PATH."; \
				echo "ℹ️ Run 'opencode', use '/connect', then rerun 'make setup'."; \
				exit 0; \
			fi; \
			echo "⚠️ Homebrew finished installing OpenCode, but 'opencode' is still not available on PATH."; \
			echo "ℹ️ Ensure Homebrew's bin directory is on PATH for this shell (for example, load your Homebrew shellenv settings)."; \
			echo "ℹ️ If the formula is not linked yet, run 'brew link opencode'."; \
			echo "ℹ️ After 'opencode' works in your shell, run 'opencode', use '/connect', and rerun 'make setup'."; \
			exit 1; \
		fi; \
		echo "❌ Error: 'opencode' was not found on PATH."; \
		echo "ℹ️ Install OpenCode using the official install method for your system."; \
		echo "ℹ️ Then run 'opencode', use '/connect', and rerun 'make setup'."; \
		exit 1; \
	fi; \
	if ! command -v python3 >/dev/null 2>&1; then \
		echo "❌ Error: 'python3' was not found on PATH."; \
		echo "ℹ️ Install Python 3, then rerun 'make setup'."; \
		exit 1; \
	fi; \
	echo "✅ OpenCode and python3 are available."; \
	jira_ready=$$(printf '%s\n' \
		'import os, pathlib, re' \
		'required = ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN")' \
		'dotenv = {}' \
		'env_path = pathlib.Path(".env")' \
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
		'print("ready" if all(bool(os.environ.get(name, "").strip()) or bool(dotenv.get(name, "").strip()) for name in required) else "missing")' \
	| python3 -); \
	if [ -n "$$JIRA_BASE_URL" ] && [ -n "$$JIRA_EMAIL" ] && [ -n "$$JIRA_API_TOKEN" ]; then \
		echo "✅ Jira environment variables detected in the current shell."; \
	elif [ "$$jira_ready" = "ready" ]; then \
		echo "✅ Jira environment variables detected via the current shell or local .env file."; \
	else \
		echo "⚠️ Warning: Jira environment variables are not fully set in the current shell or local .env file."; \
		echo "ℹ️ If you plan to use the Jira tools, set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN"; \
		echo "ℹ️ in your environment or a local .env file before using those tools."; \
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
