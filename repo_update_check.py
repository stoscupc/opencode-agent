from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path


REMOTE_NAME = "origin"
REMOTE_BRANCH = "main"
REMOTE_REF = f"{REMOTE_NAME}/{REMOTE_BRANCH}"
GIT_COMMAND_TIMEOUT_SECONDS = 10


def git_env() -> dict[str, str]:
    env = os.environ.copy()
    env.update(
        {
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_ASKPASS": "/usr/bin/true",
            "SSH_ASKPASS": "/usr/bin/true",
            "SSH_ASKPASS_REQUIRE": "force",
            "GCM_INTERACTIVE": "never",
        }
    )
    return env


@dataclass
class CloneStatus:
    checked: bool
    behind_count: int = 0
    current_branch: str = ""
    is_clean: bool = False
    can_fast_forward: bool = False
    error: str | None = None

    @property
    def is_behind(self) -> bool:
        return self.behind_count > 0

    @property
    def can_auto_update(self) -> bool:
        return (
            self.is_behind
            and self.current_branch == REMOTE_BRANCH
            and self.is_clean
            and self.can_fast_forward
        )


def run_git(
    repo_root: Path, *args: str, check: bool = True
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=repo_root,
        check=check,
        capture_output=True,
        text=True,
        timeout=GIT_COMMAND_TIMEOUT_SECONDS,
        env=git_env(),
    )


def inspect_clone_status(repo_root: Path) -> CloneStatus:
    try:
        run_git(repo_root, "fetch", "--quiet", REMOTE_NAME, REMOTE_BRANCH)
        current_branch = run_git(
            repo_root, "rev-parse", "--abbrev-ref", "HEAD"
        ).stdout.strip()
        is_clean = not run_git(repo_root, "status", "--porcelain").stdout.strip()
        behind_count = int(
            run_git(
                repo_root, "rev-list", "--count", f"HEAD..{REMOTE_REF}"
            ).stdout.strip()
        )
        can_fast_forward = (
            run_git(
                repo_root,
                "merge-base",
                "--is-ancestor",
                "HEAD",
                REMOTE_REF,
                check=False,
            ).returncode
            == 0
        )
    except (
        subprocess.CalledProcessError,
        subprocess.TimeoutExpired,
        ValueError,
    ) as exc:
        return CloneStatus(checked=False, error=extract_error(exc))

    return CloneStatus(
        checked=True,
        behind_count=behind_count,
        current_branch=current_branch,
        is_clean=is_clean,
        can_fast_forward=can_fast_forward,
    )


def extract_error(exc: Exception) -> str:
    if isinstance(exc, subprocess.CalledProcessError):
        return summarize_git_message(exc.stderr, exc.stdout, "git command failed")
    if isinstance(exc, subprocess.TimeoutExpired):
        timeout_seconds = (
            int(exc.timeout) if exc.timeout else GIT_COMMAND_TIMEOUT_SECONDS
        )
        return f"git command timed out after {timeout_seconds}s"
    return str(exc)


def summarize_git_message(stderr: str | None, stdout: str | None, default: str) -> str:
    message = (stderr or stdout or default).strip()
    if not message:
        return default
    first_line = message.splitlines()[0].strip()
    if len(first_line) <= 160:
        return first_line
    return first_line[:157] + "..."


def auto_update_blocker(status: CloneStatus) -> str | None:
    if status.current_branch != REMOTE_BRANCH:
        return f"current branch is '{status.current_branch}'"
    if not status.is_clean:
        return "working tree has local changes"
    if not status.can_fast_forward:
        return f"local {REMOTE_BRANCH} cannot fast-forward cleanly"
    return None


def manual_update_instructions() -> list[str]:
    return [
        f"git checkout {REMOTE_BRANCH}",
        f"git pull --ff-only {REMOTE_NAME} {REMOTE_BRANCH}",
    ]
