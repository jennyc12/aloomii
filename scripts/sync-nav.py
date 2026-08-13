#!/usr/bin/env python3
"""Write the canonical static navigation into eligible HTML pages."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SNIPPET = (ROOT / "snippets" / "canonical-nav.html").read_text()
START = "<!-- CANONICAL_NAV_START -->"
END = "<!-- CANONICAL_NAV_END -->"
BLOCK = f"{START}\n{SNIPPET.rstrip()}\n{END}"
STYLESHEET = '<link rel="stylesheet" href="/snippets/canonical-nav.css">'
EXCLUDED = (
    "legal/",
    "playbook/",
    "aloomii-os.html",
    "terms.html",
    "client-terms.html",
    "privacy.html",
    "snippets/",
    "chamber-worker/",
    "demo/",
    "command/",
    "moji/",
    "crcc-proposal/",
    "crcc-workshop/",
    "gtm-audit/",
)


def excluded(path: Path) -> bool:
    relative = path.relative_to(ROOT).as_posix()
    return relative.startswith(EXCLUDED) or ".bak." in relative


def replace_navigation(text: str) -> str | None:
    if START in text and END in text:
        pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.S)
        return pattern.sub(BLOCK, text, count=1)

    nav = re.search(r"<nav\b[^>]*>.*?</nav>", text, re.I | re.S)
    if not nav:
        return None
    mobile = re.search(
        r'<div\b[^>]*class=["\'][^"\']*\bmobile-menu\b[^"\']*["\'][^>]*>.*?</div>',
        text,
        re.I | re.S,
    )
    end = mobile.end() if mobile and mobile.start() >= nav.end() else nav.end()
    return text[: nav.start()] + BLOCK + text[end:]


def main() -> None:
    changed = []
    for path in sorted(ROOT.rglob("*.html")):
        if excluded(path):
            continue
        original = path.read_text()
        updated = replace_navigation(original)
        if updated is None:
            continue
        if STYLESHEET not in updated:
            updated = updated.replace("</head>", f"  {STYLESHEET}\n</head>", 1)
        if updated != original:
            path.write_text(updated)
            changed.append(path.relative_to(ROOT).as_posix())
    print(f"Synced canonical navigation to {len(changed)} pages.")
    for page in changed:
        print(page)


if __name__ == "__main__":
    main()
