# Blog posts

This directory contains the source and build tooling for static posts on `abhandaru.com`.

## Structure

- `*.md` — Markdown source for a post, with a small YAML-like front matter block.
- `template.html` — shared HTML shell for generated posts.
- `build.py` — renders the current post with Mistune into `static/pages`.
- `requirements.txt` — Python dependencies for the blog generator.
- `../static/pages/post.css` — shared post stylesheet.

Static assets used by posts live directly in `static/pages`. The release script copies each generated page to its extensionless public route in S3. For example:

```text
static/pages/r-factor.html
        -> /post/r-factor
        -> s3://eusphere/abhandaru-com/post/r-factor
```

To build locally:

```bash
./release/build.sh
```

`release/local.sh` runs this build before starting Vite. During local development,
the post is available at `/pages/r-factor.html`; production continues to publish
the extensionless `/post/r-factor` route through S3.
