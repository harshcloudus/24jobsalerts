"""Generate a rounded-corner app-icon style favicon from the existing logo.

Run once from the repo root:
    python frontend/scripts/generate_favicon.py

Outputs:
    frontend/public/24jobsalerts_favicon.png  (512x512)
    frontend/src/app/favicon.ico              (multi-size .ico)
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, "..", "public"))
APP = os.path.abspath(os.path.join(HERE, "..", "src", "app"))

SOURCE = os.path.join(PUBLIC, "24jobsalerts_favicon_source.png")
PNG_OUT = os.path.join(PUBLIC, "24jobsalerts_favicon.png")
ICO_OUT = os.path.join(APP, "favicon.ico")

SIZE = 512
RADIUS_RATIO = 0.18
PADDING_RATIO = 0.04
BG = (255, 255, 255, 255)


def rounded_square(size: int, radius: int, fill) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=fill)
    return img


def fit_logo(logo: Image.Image, max_w: int, max_h: int) -> Image.Image:
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    scale = min(max_w / logo.width, max_h / logo.height)
    new_size = (max(1, int(logo.width * scale)), max(1, int(logo.height * scale)))
    return logo.resize(new_size, Image.LANCZOS)


def compose(size: int) -> Image.Image:
    radius = int(size * RADIUS_RATIO)
    canvas = rounded_square(size, radius, BG)

    if not os.path.exists(SOURCE):
        raise FileNotFoundError(f"Logo not found at {SOURCE}")

    logo = Image.open(SOURCE).convert("RGBA")
    pad = int(size * PADDING_RATIO)
    inner = size - pad * 2
    logo = fit_logo(logo, inner, inner)

    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas


def main() -> None:
    master = compose(SIZE)
    master.save(PNG_OUT, "PNG", optimize=True)
    print(f"Wrote {PNG_OUT} ({os.path.getsize(PNG_OUT)} bytes)")

    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    master.save(ICO_OUT, format="ICO", sizes=ico_sizes)
    print(f"Wrote {ICO_OUT} ({os.path.getsize(ICO_OUT)} bytes)")


if __name__ == "__main__":
    main()
