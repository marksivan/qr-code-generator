# QRing

A deployable web app that turns any link into a QR code. Optionally add a name that appears at the top of the code, then download the PNG.

**Live site (after Pages is enabled):**  
`https://marksivan.github.io/qr-code-generator/`

## Features

- Paste a URL and generate a QR code in the browser
- Optional name label centered above the QR code
- Download as PNG
- Static site — no backend required

## Deploy on GitHub Pages

1. Merge this branch to `main`.
2. In the repo: **Settings → Pages → Build and deployment**.
3. Set **Source** to **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy-pages.yml`) publishes the site on every push to `main`.

You can also trigger a deploy manually from the **Actions** tab.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Optional CLI

A Python CLI remains available for local use:

```bash
pip install -r requirements.txt
python qr_generator.py "https://example.com" --name "My Site" -o mysite.png
```
