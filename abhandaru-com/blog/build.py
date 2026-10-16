#!/usr/bin/env python3
"""Build the static blog page from its Markdown source."""

from html import escape
from pathlib import Path
import re

import mistune


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "blog" / "r-factor.md"
TEMPLATE = ROOT / "blog" / "template.html"
OUTPUT = ROOT / "static" / "pages" / "r-factor.html"


MARKDOWN = mistune.create_markdown(
    escape=False,
    plugins=["table", "strikethrough", "footnotes"],
)


def main() -> None:
    source = SOURCE.read_text()
    front_matter, markdown = re.match(r"^---\n([\s\S]*?)\n---\n\n([\s\S]*)$", source).groups()
    metadata = dict(line.split(": ", 1) for line in front_matter.splitlines())
    html = TEMPLATE.read_text()
    for key, value in metadata.items():
        html = html.replace(f"{{{{{key.upper()}}}}}", escape(value))
    html = html.replace("{{CONTENT}}", MARKDOWN(markdown))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html)
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
