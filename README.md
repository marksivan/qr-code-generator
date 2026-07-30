# QR Code Generator

Generate a QR code from a link, with an optional name printed at the top of the image.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

Interactive mode (prompts for link, optional name, and output file):

```bash
python qr_generator.py
```

Command-line mode:

```bash
python qr_generator.py "https://example.com" --name "My Site" -o mysite.png
```

### Options

| Flag | Description |
|------|-------------|
| `link` | URL or text to encode (required in CLI mode) |
| `-n`, `--name` | Name shown centered above the QR code |
| `-o`, `--output` | Output image path (default: `qring.png`) |

If the link has no scheme (`http://` / `https://`), `https://` is added automatically so phones open it as a URL.
