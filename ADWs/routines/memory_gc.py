#!/usr/bin/env python3
"""ADW: Memory GC — força limpeza de sessões inativas e compacta heap do Node.js.
Chamado 3x/dia pelo scheduler para evitar o acúmulo gradual de 2-3GB de RAM.
"""

import os
import sys
import urllib.request
import urllib.error
import json

TERMINAL_URL = os.environ.get("TERMINAL_SERVER_URL", "http://localhost:32352")
CUTOFF_MINUTES = int(os.environ.get("GC_CUTOFF_MINUTES", "30"))


def main():
    print("=== Memory GC ===")
    payload = json.dumps({"cutoffMinutes": CUTOFF_MINUTES}).encode()
    req = urllib.request.Request(
        f"{TERMINAL_URL}/api/gc/force",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        before = data.get("before", {})
        after  = data.get("after", {})
        print(
            f"  stopped={data.get('stopped', 0)}"
            f"  removed={data.get('removed', 0)}"
            f"  idleReaped={data.get('idleReaped', 0)}"
        )
        print(
            f"  heap  {before.get('heapUsedMB', '?')}MB → {after.get('heapUsedMB', '?')}MB"
        )
        print(
            f"  rss   {before.get('rssMB', '?')}MB → {after.get('rssMB', '?')}MB"
        )
    except urllib.error.URLError as e:
        print(f"  ERRO ao chamar terminal-server: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
