#!/usr/bin/env python3
"""Generate a QR code from a link, with an optional name above it."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import qrcode
import qrcode.constants
from PIL import Image, ImageDraw, ImageFont


def normalize_link(link: str) -> str:
    """Ensure the link has a scheme so phones open it as a URL."""
    link = link.strip()
    if not link:
        raise ValueError("Link cannot be empty.")
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", link):
        link = f"https://{link}"
    return link


def load_font(size: int) -> ImageFont.ImageFont:
    """Prefer a clean sans-serif font; fall back to the default bitmap font."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def generate_qrcode(
    link: str,
    name: str | None = None,
    output: str | Path = "qring.png",
    box_size: int = 10,
    border: int = 4,
) -> Path:
    """Create a QR code image for *link*, optionally labeled with *name* on top."""
    link = normalize_link(link)
    name = (name or "").strip()

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(link)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    if not name:
        output_path = Path(output)
        qr_img.save(output_path)
        return output_path

    # Build a taller canvas so the name sits above the QR code.
    padding = max(24, box_size * 2)
    font_size = max(28, qr_img.width // 12)
    font = load_font(font_size)

    draw_probe = ImageDraw.Draw(qr_img)
    text_bbox = draw_probe.textbbox((0, 0), name, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    # Shrink the font if the name is wider than the QR code.
    while text_width > qr_img.width - padding and font_size > 14:
        font_size -= 2
        font = load_font(font_size)
        text_bbox = draw_probe.textbbox((0, 0), name, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

    header_height = text_height + padding * 2
    canvas = Image.new(
        "RGB",
        (qr_img.width, qr_img.height + header_height),
        "white",
    )
    draw = ImageDraw.Draw(canvas)

    text_x = (canvas.width - text_width) // 2
    text_y = padding - text_bbox[1]  # account for font ascent offset
    draw.text((text_x, text_y), name, fill="black", font=font)
    canvas.paste(qr_img, (0, header_height))

    output_path = Path(output)
    canvas.save(output_path)
    return output_path


def prompt_inputs() -> tuple[str, str | None, str]:
    print("QR Code Generator")
    print("-" * 18)
    link = input("Enter link / URL: ").strip()
    while not link:
        link = input("Link is required. Enter link / URL: ").strip()

    name = input("Enter name for QR code (optional, shown on top): ").strip() or None

    default_output = "qring.png"
    output = input(f"Output filename [{default_output}]: ").strip() or default_output
    if not output.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        output = f"{output}.png"

    return link, name, output


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a QR code from a link, with an optional name on top."
    )
    parser.add_argument("link", nargs="?", help="URL or link to encode")
    parser.add_argument(
        "-n",
        "--name",
        help="Name shown at the top of the QR code image",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="qring.png",
        help="Output image path (default: qring.png)",
    )
    args = parser.parse_args()

    if args.link:
        link, name, output = args.link, args.name, args.output
    else:
        link, name, output = prompt_inputs()

    try:
        path = generate_qrcode(link, name=name, output=output)
    except ValueError as exc:
        raise SystemExit(f"Error: {exc}") from exc

    print(f"Saved QR code to {path.resolve()}")
    if name:
        print(f"Label: {name}")
    print(f"Link:  {normalize_link(link)}")


if __name__ == "__main__":
    main()
