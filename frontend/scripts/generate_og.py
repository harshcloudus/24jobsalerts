"""Generate the default 1200x630 Open Graph image for 24jobsalerts.

Run once from the repo root:
    python frontend/scripts/generate_og.py

Output: frontend/public/og-default.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, "..", "public"))
LOGO_PATH = os.path.join(PUBLIC, "footer-logo.png")
OUT_PATH = os.path.join(PUBLIC, "og-default.png")

BG = "#001e2b"
FG = "#ffffff"
ACCENT = "#f97316"

W, H = 1200, 630


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Accent stripe on top
    draw.rectangle((0, 0, W, 10), fill=ACCENT)

    # Logo (if present)
    logo_drawn = False
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert("RGBA")
            logo.thumbnail((720, 260))
            img.paste(logo, ((W - logo.width) // 2, 110), logo)
            logo_drawn = True
        except Exception:
            pass

    title_font = load_font(72)
    headline_font = load_font(48)
    sub_font_small = load_font(26)

    if not logo_drawn:
        # Big text fallback
        title = "24jobsalerts"
        bbox = draw.textbbox((0, 0), title, font=title_font)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, 180), title, fill=ACCENT, font=title_font)

    headline = "Latest Government Jobs 2026"
    bbox = draw.textbbox((0, 0), headline, font=headline_font)
    hw = bbox[2] - bbox[0]
    draw.text(((W - hw) // 2, 410), headline, fill=FG, font=headline_font)

    sub = "Sarkari Naukri  •  Free Job Alerts  •  Apply Direct"
    bbox = draw.textbbox((0, 0), sub, font=sub_font_small)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw) // 2, 490), sub, fill=ACCENT, font=sub_font_small)

    # Accent stripe at bottom
    draw.rectangle((0, H - 10, W, H), fill=ACCENT)

    img.save(OUT_PATH, "PNG", optimize=True)
    print(f"Wrote {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")


if __name__ == "__main__":
    main()
