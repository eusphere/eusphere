#!/usr/bin/env python3
"""Markdown + CSS -> PDF via xhtml2pdf (no native WebKit/Pango required)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import markdown
from xhtml2pdf import pisa


DEFAULT_CSS = """
@page {
    size: letter;
    margin: 0.75in;
}
html {
    font-family: "Helvetica", "Arial", sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #1a1a1a;
}
body {
    margin: 0;
}
h1 {
    font-size: 20pt;
    font-weight: bold;
    color: #0d3b66;
    margin: 0 0 0.35em 0;
    padding-bottom: 0.2em;
    border-bottom: 2px solid #c5d4e0;
}
h2 {
    font-size: 13pt;
    font-weight: bold;
    color: #144870;
    margin: 1.15em 0 0.5em 0;
    page-break-after: avoid;
}
p {
    margin: 0.5em 0;
}
em {
    font-style: italic;
    color: #444;
}
hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 1em 0;
}
ul {
    margin: 0.4em 0 0.8em 0;
    padding-left: 1.15em;
}
li {
    margin: 0.35em 0;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75em 0 1em 0;
    font-size: 9.75pt;
}
th, td {
    border: 1px solid #b8c5d0;
    padding: 0.45em 0.55em;
    vertical-align: top;
}
th {
    background: #e8eef4;
    font-weight: bold;
    color: #0d3b66;
    text-align: left;
}
tr:nth-child(even) td {
    background: #fafbfc;
}
blockquote, .disclaimer {
    font-size: 9.5pt;
    color: #555;
    border-left: 3px solid #8aa9c0;
    padding-left: 0.75em;
    margin: 0.75em 0;
}
"""


def md_to_html(md_text: str) -> str:
    return markdown.markdown(
        md_text,
        extensions=[
            "markdown.extensions.tables",
            "markdown.extensions.nl2br",
            "markdown.extensions.sane_lists",
        ],
    )


def build_full_html(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<title>Buyer summary</title>
<style>{DEFAULT_CSS}</style>
</head>
<body>
{body_html}
</body>
</html>"""


def write_pdf(html_string: str, pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with open(pdf_path, "wb") as out:
        status = pisa.CreatePDF(
            html_string,
            dest=out,
            encoding="utf-8",
        )
    if status.err:
        raise RuntimeError(f"xhtml2pdf reported {status.err} error(s)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Markdown file to PDF")
    parser.add_argument("input_md", type=Path)
    parser.add_argument("-o", "--output", type=Path, help="Output PDF path")
    args = parser.parse_args()
    md_path = args.input_md
    if not md_path.is_file():
        print(f"Not found: {md_path}", file=sys.stderr)
        sys.exit(1)
    out_pdf = args.output or md_path.with_suffix(".pdf")
    md_text = md_path.read_text(encoding="utf-8")
    body = md_to_html(md_text)
    html = build_full_html(body)
    write_pdf(html, out_pdf)
    print(f"Wrote {out_pdf}")


if __name__ == "__main__":
    main()
