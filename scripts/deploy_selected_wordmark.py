#!/usr/bin/env python3
"""
Deploy the selected SlashBeacon wordmark (Choice #2: Esports Cyber-Shield, Text-Only).
Generates pixel-perfect 982x124 transparent PNG with 4x supersampling and LANCZOS downsampling.
Deploys to:
- ui/assets/slashbeacon_wordmark.png
- website/assets/slashbeacon_wordmark.png
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCALE = 4
W, H = 982 * SCALE, 124 * SCALE
FUTURA_FONT_PATH = "/System/Library/Fonts/Supplemental/Futura.ttc"
ARIAL_BOLD_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

DISCORD_BLURPLE = (88, 101, 242)       # #5865f2
DISCORD_WHITE = (248, 249, 250)        # #f8f9fa
DISCORD_MUTED = (160, 166, 178)        # readable muted
BEACON_ORANGE = (249, 115, 22)         # #f97316
BEACON_GOLD = (254, 224, 71)           # #fde047


def linear_gradient_image(width, height, color_start, color_end, horizontal=True):
    base = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(base)
    steps = width if horizontal else height
    for i in range(steps):
        t = i / max(1, steps - 1)
        r = int(color_start[0] + (color_end[0] - color_start[0]) * t)
        g = int(color_start[1] + (color_end[1] - color_start[1]) * t)
        b = int(color_start[2] + (color_end[2] - color_start[2]) * t)
        draw.line([(i, 0), (i, height)] if horizontal else [(0, i), (width, i)], fill=(r, g, b, 255))
    return base


def apply_glow(image, glow_color, radius=12, intensity=0.7):
    alpha = image.split()[3]
    glow_mask = alpha.filter(ImageFilter.GaussianBlur(radius))
    glow_surf = Image.new("RGBA", image.size, glow_color)
    glow_surf.putalpha(glow_mask)
    if intensity != 1.0:
        r, g, b, a = glow_surf.split()
        a = a.point(lambda p: int(p * intensity))
        glow_surf.putalpha(a)
    return glow_surf


def render_selected_wordmark():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_main = ImageFont.truetype(FUTURA_FONT_PATH, 88 * SCALE, index=2)
    font_tag = ImageFont.truetype(ARIAL_BOLD_PATH, 14 * SCALE)

    bbox_slash = draw.textbbox((0, 0), "SLASH", font=font_main)
    w_slash = bbox_slash[2] - bbox_slash[0]
    bbox_beacon = draw.textbbox((0, 0), "BEACON", font=font_main)
    w_beacon = bbox_beacon[2] - bbox_beacon[0]

    sep_w = 44 * SCALE
    total_content_w = w_slash + sep_w + w_beacon

    start_x = (W - total_content_w) // 2
    text_y = 2 * SCALE

    # Drop shadow for high-contrast legibility across any canvas
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.text((start_x + 2 * SCALE, text_y + 3 * SCALE), "SLASH", font=font_main, fill=(0, 0, 0, 160))
    s_draw.text((start_x + w_slash + sep_w + 2 * SCALE, text_y + 3 * SCALE), "BEACON", font=font_main, fill=(0, 0, 0, 160))
    shadow_blur = shadow_layer.filter(ImageFilter.GaussianBlur(3 * SCALE))
    img = Image.alpha_composite(img, shadow_blur)
    draw = ImageDraw.Draw(img)

    # 1. 'SLASH' in crisp white
    draw.text((start_x, text_y), "SLASH", font=font_main, fill=DISCORD_WHITE)

    # 2. Angled cyber slash separator in Discord Blurple
    slash_center_x = start_x + w_slash + 18 * SCALE
    b_all = draw.textbbox((start_x, text_y), "SLASH", font=font_main)
    let_top = b_all[1]
    let_bot = b_all[3]

    sep_slash = [
        (slash_center_x + 18 * SCALE, let_top + 2 * SCALE),
        (slash_center_x + 28 * SCALE, let_top + 2 * SCALE),
        (slash_center_x + 6 * SCALE, let_bot - 2 * SCALE),
        (slash_center_x - 4 * SCALE, let_bot - 2 * SCALE),
    ]
    draw.polygon(sep_slash, fill=DISCORD_BLURPLE)

    # 3. 'BEACON' in radiant flame gradient
    beacon_x = start_x + w_slash + sep_w
    b_mask = Image.new("L", (W, H), 0)
    b_draw = ImageDraw.Draw(b_mask)
    b_draw.text((beacon_x, text_y), "BEACON", font=font_main, fill=255)
    flame_grad = linear_gradient_image(W, H, (234, 88, 12), (254, 224, 71), horizontal=True)
    img.paste(flame_grad, (0, 0), b_mask)

    # 4. Aerodynamic speed underline cleanly below the baseline
    under_y = let_bot + 6 * SCALE
    under_pts = [
        (start_x, under_y),
        (start_x + total_content_w, under_y),
        (start_x + total_content_w + 24 * SCALE, under_y + 3 * SCALE),
        (start_x + 60 * SCALE, under_y + 4 * SCALE),
    ]
    draw.polygon(under_pts, fill=BEACON_ORANGE)

    # 5. Tagline below underline
    tag_text = "TACTICAL IDENTITY ENGINE • ANTI-IMPOSTOR"
    bbox_tag = draw.textbbox((0, 0), tag_text, font=font_tag)
    w_tag = bbox_tag[2] - bbox_tag[0]
    tag_x = (W - w_tag) // 2
    tag_y = under_y + 8 * SCALE
    draw.text((tag_x, tag_y), tag_text, font=font_tag, fill=DISCORD_MUTED)

    # Ambient subtle blurple & amber glow
    glow = apply_glow(img, (249, 115, 22, 40), radius=12 * SCALE, intensity=0.35)
    final_canvas = Image.alpha_composite(glow, img)

    # Downsample
    return final_canvas.resize((982, 124), Image.Resampling.LANCZOS)


def main():
    print("==> Rendering Selected Wordmark (Choice #2 Text-Only)...")
    wordmark = render_selected_wordmark()

    ui_path = "ui/assets/slashbeacon_wordmark.png"
    website_path = "website/assets/slashbeacon_wordmark.png"
    artifact_dir = "/Users/wardagentic/.gemini/antigravity-ide/brain/aa383952-510b-4cfb-99e9-77caa7dfe482"
    artifact_preview = os.path.join(artifact_dir, "slashbeacon_wordmark_deployed.png")

    wordmark.save(ui_path, "PNG")
    print(f"  ✓ Saved to {ui_path}")

    wordmark.save(website_path, "PNG")
    print(f"  ✓ Saved to {website_path}")

    # Dark background preview for verification
    dark_preview = Image.new("RGBA", (982, 124), (30, 31, 34, 255))
    dark_preview.alpha_composite(wordmark)
    dark_preview.save(artifact_preview, "PNG")
    print(f"  ✓ Preview saved to {artifact_preview}")


if __name__ == "__main__":
    main()
