# connieadu.com

Source code and assets for [connieadu.com](https://connieadu.com) are here.

## Local development

The site is static HTML and CSS. Assets use root-relative paths (`/static/...`), so serve the project directory over HTTP rather than opening `index.html` directly in the browser.

### Quick start

```bash
cd connieadu-com
./release/local.sh
```

Open [http://localhost:8083/index.html](http://localhost:8083/index.html) (or [http://localhost:8083/](http://localhost:8083/)).

Port **8083** is used so it does not clash with other tenants in this repo (for example, monarchy-com uses 8082).

### Manual Python server

From the `connieadu-com` directory:

```bash
python3 -m http.server 8083
```

Then visit [http://localhost:8083/index.html](http://localhost:8083/index.html).

Press `Ctrl+C` to stop the server.
