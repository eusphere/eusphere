#!/usr/bin/env python3
"""Build the static blog page from its Markdown source."""

from html import escape
from pathlib import Path
import re

import mistune
from resvg_py import svg_to_bytes


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "blog" / "r-factor.md"
TEMPLATE = ROOT / "blog" / "template.mustache"
OUTPUT = ROOT / "static" / "pages" / "r-factor.html"
SITE_URL = "https://abhandaru.com"


MARKDOWN = mistune.create_markdown(
    escape=False,
    plugins=["table", "strikethrough", "footnotes"],
)


def render_template(template: str, values: dict[str, str], has_image: bool) -> str:
    block = re.compile(r"\{\{#IMAGE\}\}([\s\S]*?)\{\{/IMAGE\}\}")
    template = block.sub(lambda match: match.group(1) if has_image else "", template)
    for key, value in values.items():
        template = template.replace(f"{{{{{key}}}}}", value)
    return template


def build_svg_preview(source_image: Path) -> tuple[Path, str, str]:
    preview = OUTPUT.with_name(f"{OUTPUT.stem}-preview.png")
    preview.write_bytes(svg_to_bytes(svg_path=str(source_image), width=1200))
    return preview, "1200", "600"


def build_image_values(image: re.Match[str]) -> dict[str, str]:
    image_url = image.group(1) or image.group(2)
    image_width = "1200"
    image_height = "630"
    if image_url.startswith("/static/"):
        source_image = ROOT / image_url.removeprefix("/")
        if source_image.suffix.lower() == ".svg":
            preview, image_width, image_height = build_svg_preview(source_image)
            image_url = f"/static/pages/{preview.name}"
    if image_url.startswith("/"):
        image_url = f"{SITE_URL}{image_url}"
    return {
        "IMAGE_URL": escape(image_url, quote=True),
        "IMAGE_WIDTH": image_width,
        "IMAGE_HEIGHT": image_height,
    }


def main() -> None:
    source = SOURCE.read_text()
    front_matter, markdown = re.match(r"^---\n([\s\S]*?)\n---\n\n([\s\S]*)$", source).groups()
    metadata = dict(line.split(": ", 1) for line in front_matter.splitlines())
    values = {key.upper(): escape(value, quote=True) for key, value in metadata.items()}
    image = re.search(
        r"!\[[^]]*\]\(([^)]+)\)|<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']",
        markdown,
        flags=re.IGNORECASE,
    )
    has_image = bool(image)
    if image:
        values.update(build_image_values(image))
    values["CONTENT"] = MARKDOWN(markdown)
    html = render_template(TEMPLATE.read_text(), values, has_image)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html)
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
