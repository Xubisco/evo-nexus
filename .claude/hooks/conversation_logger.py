#!/usr/bin/env python3
"""Per-agent human-readable conversation log — companion to the raw JSONL
transcripts Claude Code already writes under /root/.claude/projects/-workspace/.

Invoked as: python3 conversation_logger.py {Stop|SubagentStop}
Reads the hook JSON payload from stdin. Always exits 0 (never blocks Claude Code) —
mirrors the defensive style of dashboard/backend/claude_hook_dispatcher.py and
.claude/hooks/agent-tracker.sh (never crash, never leak secrets).

Wired additively into .claude/settings.json's Stop and SubagentStop hook arrays,
alongside (not instead of) agent-tracker.sh and claude_hook_dispatcher.py.

## What this writes

One append-only Markdown file per agent slug, rotated monthly:
    .claude/agent-memory/{agent-slug}/conversation-log-{YYYY-MM}.md

Each entry is a small block:
    ## {ISO-8601 timestamp} — {agent slug}
    **Usuario:** {last user message, truncated}
    **Assistente:** {last assistant text reply, truncated}

The agent-memory/ tree is already relocated onto the persistent Railway volume
by entrypoint.sh (relocate_to_volume /workspace/.claude/agent-memory agent-memory),
so these logs survive redeploys for free — no new persistence plumbing needed.

## Agent slug resolution — SubagentStop vs Stop

SubagentStop fires when a subagent launched via the Agent tool finishes. The
hook payload itself (session_id, transcript_path, cwd, hook_event_name) does
NOT include which subagent_type just finished — that field only exists on the
*PreToolUse* payload for the Agent tool call, which agent-tracker.sh already
records into .claude/agent-status.json (active_agents list, newest last).

As a best-effort heuristic, we PEEK (never mutate) the last entry of that list
and use its "agent" field as the slug. This is imprecise under heavy parallel
subagent fan-out (multiple subagents launched before any of them stop, or
subagents finishing out of launch order) — in that case a SubagentStop event
may attribute the entry to the wrong subagent. We accept this rather than
inventing false precision. We never write to agent-status.json ourselves, so
the existing dashboard "who's active" tracking is completely unaffected.

Stop fires for the top-level/main session. There is no reliable signal
anywhere in the hook payload or transcript for which named agent (oracle,
clawdia, ...) owns that top-level conversation, so we fall back to the fixed
slug "main-session". Documented limitation, not a bug.

## Secrets

We only ever extract natural-language user/assistant text blocks (never
tool_use input, tool_result output, or raw env vars) from the transcript, and
truncate each to ~500 chars. This mirrors claude_hook_dispatcher.py's env
whitelist / no-payload-by-default posture. Note this is not a redaction
guarantee: if a user pastes a literal secret as their own chat message, that
same text already lives forever, unredacted, in the raw JSONL transcript this
script reads from — we do not increase exposure beyond what already exists.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent.parent
AGENT_MEMORY_DIR = WORKSPACE / ".claude" / "agent-memory"
AGENT_STATUS_FILE = WORKSPACE / ".claude" / "agent-status.json"

TEXT_TRUNCATE_LEN = 500
FALLBACK_SLUG_SUBAGENT = "unknown-subagent"
FALLBACK_SLUG_MAIN = "main-session"


def _slugify(name: str) -> str:
    """Lowercase, hyphenate, filesystem-safe. Falls back if empty after cleanup."""
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9-]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "unknown"


def _resolve_agent_slug(event_name: str) -> str:
    """See module docstring: PreToolUse subagent_type isn't visible here, so we
    peek (read-only) the last agent-status.json entry as a best-effort guess.

    Bonus signal for the Stop (top-level) case: this harness sets a
    CLAUDE_CODE_AGENT env var naming the root/entry-point agent for the whole
    session tree (e.g. "oracle" for a session started via /oracle). Empirically
    it stays constant across all descendant subagent invocations, so it's only
    useful for identifying the TOP-LEVEL session, never for SubagentStop (where
    it would just say the root agent for every subagent). Not confirmed to be
    present in every deployment (e.g. Railway) — treated as a bonus, not a
    guarantee, with the same "main-session" fallback if absent."""
    if event_name != "SubagentStop":
        root_agent = os.environ.get("CLAUDE_CODE_AGENT", "").strip()
        if root_agent:
            return _slugify(root_agent)
        return FALLBACK_SLUG_MAIN

    try:
        data = json.loads(AGENT_STATUS_FILE.read_text(encoding="utf-8"))
        active = data.get("active_agents") or []
        if active:
            raw = active[-1].get("agent") or FALLBACK_SLUG_SUBAGENT
            return _slugify(str(raw))
    except Exception:
        pass
    return FALLBACK_SLUG_SUBAGENT


def _extract_text(content) -> str | None:
    """Pull plain text out of a message.content field.

    content is either a plain string (typed human turn / plain assistant reply)
    or a list of typed blocks (tool_use/tool_result/thinking/text/...). We only
    ever want 'text' — never tool_use input or tool_result output, which can
    contain file contents, command output, or secrets."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        parts = [p for p in parts if p]
        if parts:
            return "\n".join(parts)
    return None


def _truncate(text: str) -> str:
    text = text.strip()
    if len(text) > TEXT_TRUNCATE_LEN:
        return text[:TEXT_TRUNCATE_LEN] + " [...truncado]"
    return text


def _find_last_texts(transcript_path: str) -> tuple[str | None, str | None]:
    """Read the session JSONL and return (last_user_text, last_assistant_text),
    scanning from the end so the most recent turn wins. Either may be None if
    that role never produced plain text in this transcript (e.g. very first
    turn) — that's a normal, non-error case, not a parsing failure."""
    path = Path(transcript_path)
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    last_user: str | None = None
    last_assistant: str | None = None

    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue

        entry_type = entry.get("type")
        message = entry.get("message") or {}

        if last_user is None and entry_type == "user":
            text = _extract_text(message.get("content"))
            if text:
                last_user = text

        if last_assistant is None and entry_type == "assistant":
            text = _extract_text(message.get("content"))
            if text:
                last_assistant = text

        if last_user is not None and last_assistant is not None:
            break

    return last_user, last_assistant


def _log_path_for(slug: str) -> Path:
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    agent_dir = AGENT_MEMORY_DIR / slug
    agent_dir.mkdir(parents=True, exist_ok=True)
    return agent_dir / f"conversation-log-{month}.md"


def _append(path: Path, text: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(text)


def main() -> None:
    # Always exit 0 — a hook must never block the user's session.
    try:
        if len(sys.argv) < 2:
            return
        event_name = sys.argv[1]
        if event_name not in ("Stop", "SubagentStop"):
            return

        try:
            payload_bytes = sys.stdin.buffer.read()
            payload = json.loads(payload_bytes) if payload_bytes else {}
        except Exception:
            payload = {}

        slug = _resolve_agent_slug(event_name)
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        log_path = _log_path_for(slug)

        transcript_path = payload.get("transcript_path")
        user_text = None
        assistant_text = None
        try:
            if transcript_path:
                user_text, assistant_text = _find_last_texts(transcript_path)
        except Exception:
            user_text = None
            assistant_text = None

        if transcript_path and (user_text or assistant_text):
            entry = (
                f"## {now_iso} — {slug}\n"
                f"**Usuario:** {_truncate(user_text) if user_text else '(nenhuma mensagem encontrada)'}\n\n"
                f"**Assistente:** {_truncate(assistant_text) if assistant_text else '(nenhuma resposta encontrada)'}\n\n"
            )
        else:
            entry = f"## {now_iso} — {slug}\ntranscript unavailable\n\n"

        try:
            _append(log_path, entry)
        except Exception:
            pass
    except Exception:
        # Last-resort guard — never let this script break the session.
        pass


if __name__ == "__main__":
    main()
