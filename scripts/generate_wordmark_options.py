#!/usr/bin/env python3
"""
Generate 3 distinct wordmark concepts for SlashBeacon leaning into Gaming / Discord aesthetics.
1. Option 1: Command Terminal (Discord Slash Command & Neon Cyber CLI)
2. Option 2: Esports Cyber-Shield (Athletic, Sharp-Sheared, Anti-Cheat Sentinel)
3. Option 3: Discord Pulse & Audio-Wave (Voice Comms, Equalizer Waveform, Broadcast Beacon)

Renders at 4x supersampling and downsamples with high-quality LANCZOS filtering.
Outputs individual transparent PNGs and a comprehensive showcase comparison sheet.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCALE = 4
WIDTH = 982 * SCALE
HEIGHT = 124 * SCALE

# Brand Color Palette
DISCORD_BLURPLE = (88, 101, 242)       # #5865f2
DISCORD_BLURPLE_LIGHT = (121, 131, 245) # #7983f5
DISCORD_CYAN = (0, 168, 252)           # #00a8fc
BEACON_ORANGE = (249, 115, 22)         # #f97316
BEACON_AMBER = (251, 146, 60)          # #fb923c
BEACON_GOLD = (254, 224, 71)           # #fde047
DISCORD_WHITE = (242, 243, 245)        # #f2f3f5
DISCORD_MUTED = (148, 155, 164)        # #949ba4
DARK_BG = (30, 31, 34)                 # #1e1f22
DARK_CARD = (43, 45, 49)               # #2b2d31
DARKEST_BG = (17, 18, 20)              # #111214

FUTURA_FONT_PATH = "/System/Library/Fonts/Supplemental/Futura.ttc"
ARIAL_BOLD_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL_ROUNDED_PATH = "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf"


def linear_gradient_image(width, height, color_start, color_end, horizontal=True):
    """Creates a 2D linear gradient RGBA image."""
    base = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(base)
    steps = width if horizontal else height
    for i in range(steps):
        t = i / max(1, steps - 1)
        r = int(color_start[0] + (color_end[0] - color_start[0]) * t)
        g = int(color_start[1] + (color_end[1] - color_start[1]) * t)
        b = int(color_start[2] + (color_end[2] - color_start[2]) * t)
        a = int(color_start[3] + (color_end[3] - color_start[3]) * t) if len(color_start) > 3 else 255
        if horizontal:
            draw.line([(i, 0), (i, height)], fill=(r, g, b, a))
        else:
            draw.line([(0, i), (width, i)], fill=(r, g, b, a))
    return base


def apply_glow(image, glow_color, radius=12, intensity=0.7):
    """Generates an outer glow layer behind transparent foreground."""
    alpha = image.split()[3]
    glow_mask = alpha.filter(ImageFilter.GaussianBlur(radius))
    glow_surf = Image.new("RGBA", image.size, glow_color)
    glow_surf.putalpha(glow_mask)
    # Blend intensity
    if intensity != 1.0:
        r, g, b, a = glow_surf.split()
        a = a.point(lambda p: int(p * intensity))
        glow_surf.putalpha(a)
    return glow_surf


# =========================================================================
# CONCEPT 1: Command Terminal (Discord Slash Command & Neon Cyber CLI)
# =========================================================================
def render_option1_terminal():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_main = ImageFont.truetype(FUTURA_FONT_PATH, 74 * SCALE, index=2)
    font_sub = ImageFont.truetype(ARIAL_BOLD_PATH, 16 * SCALE)

    # 1. Leading Discord Slash Command Badge: [ / ]
    badge_x = 48 * SCALE
    badge_y = 20 * SCALE
    badge_w = 76 * SCALE
    badge_h = 84 * SCALE
    r = 16 * SCALE

    # Badge background - dark blurple pill
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=r,
                           fill=(88, 101, 242, 45), outline=(88, 101, 242, 180), width=3 * SCALE)

    # Glowing forward slash in the badge
    slash_poly = [
        (badge_x + 52 * SCALE, badge_y + 16 * SCALE),
        (badge_x + 64 * SCALE, badge_y + 16 * SCALE),
        (badge_x + 24 * SCALE, badge_y + badge_h - 16 * SCALE),
        (badge_x + 12 * SCALE, badge_y + badge_h - 16 * SCALE),
    ]
    draw.polygon(slash_poly, fill=DISCORD_BLURPLE)

    # Second inner cyber slash line for futuristic depth
    slash_inner = [
        (badge_x + 44 * SCALE, badge_y + 22 * SCALE),
        (badge_x + 50 * SCALE, badge_y + 22 * SCALE),
        (badge_x + 28 * SCALE, badge_y + badge_h - 22 * SCALE),
        (badge_x + 22 * SCALE, badge_y + badge_h - 22 * SCALE),
    ]
    draw.polygon(slash_inner, fill=DISCORD_CYAN)

    # 2. Text layout
    text_start_x = badge_x + badge_w + 32 * SCALE
    text_y = 12 * SCALE

    # Render "SLASH" in high-contrast white with Futura Bold
    slash_word = "SLASH"
    draw.text((text_start_x, text_y), slash_word, font=font_main, fill=DISCORD_WHITE)
    bbox_slash = draw.textbbox((text_start_x, text_y), slash_word, font=font_main)
    beacon_start_x = bbox_slash[2] + 20 * SCALE

    # Render "BEACON" in radiant gradient from Orange to Amber-Gold
    beacon_word = "BEACON"
    beacon_mask = Image.new("L", (WIDTH, HEIGHT), 0)
    b_draw = ImageDraw.Draw(beacon_mask)
    b_draw.text((beacon_start_x, text_y), beacon_word, font=font_main, fill=255)
    bbox_beacon = b_draw.textbbox((beacon_start_x, text_y), beacon_word, font=font_main)

    grad = linear_gradient_image(WIDTH, HEIGHT, BEACON_ORANGE, BEACON_GOLD, horizontal=True)
    img.paste(grad, (0, 0), beacon_mask)

    # Draw radar beacon flare atop the letter "A" in BEACON
    sub_bbox_be = draw.textbbox((beacon_start_x, text_y), "BE", font=font_main)
    a_center_x = sub_bbox_be[2] + 28 * SCALE
    a_top_y = text_y + 10 * SCALE

    # Radiant beacon diamond beam emitting from "A"
    beam_h = 22 * SCALE
    draw.polygon([
        (a_center_x, a_top_y - beam_h),
        (a_center_x + 9 * SCALE, a_top_y - beam_h // 2),
        (a_center_x, a_top_y),
        (a_center_x - 9 * SCALE, a_top_y - beam_h // 2),
    ], fill=BEACON_GOLD)

    # 3. Subtitle / Prompt line underneath: "// DISCORD SENTINEL"
    # Positioned with comfortable vertical clearance below baseline
    sub_text = "// DISCORD SENTINEL"
    sub_y = text_y + 82 * SCALE
    draw.text((text_start_x + 4 * SCALE, sub_y), sub_text, font=font_sub, fill=DISCORD_MUTED)

    # Blinking CLI cursor block at the end of the subtitle
    sub_bbox = draw.textbbox((text_start_x + 4 * SCALE, sub_y), sub_text, font=font_sub)
    cursor_x = sub_bbox[2] + 8 * SCALE
    cursor_y = sub_y + 2 * SCALE
    cursor_w = 9 * SCALE
    cursor_h = 14 * SCALE
    draw.rectangle([cursor_x, cursor_y, cursor_x + cursor_w, cursor_y + cursor_h], fill=DISCORD_CYAN)

    # Subtle ambient glow
    glow = apply_glow(img, (88, 101, 242, 60), radius=16 * SCALE, intensity=0.5)
    final_canvas = Image.alpha_composite(glow, img)

    # Downsample
    return final_canvas.resize((WIDTH // SCALE, HEIGHT // SCALE), Image.Resampling.LANCZOS)


# =========================================================================
# CONCEPT 2: Esports Cyber-Shield (Athletic, Sharp-Sheared, Anti-Cheat Sentinel)
# =========================================================================
def render_option2_esports():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))

    # We will draw on an unsheared image then shear, or draw geometric sheared shapes
    font_main = ImageFont.truetype(FUTURA_FONT_PATH, 76 * SCALE, index=2)
    font_tag = ImageFont.truetype(ARIAL_BOLD_PATH, 15 * SCALE)

    # 1. Esports Shield Emblem
    shield_x = 44 * SCALE
    shield_y = 16 * SCALE
    shield_w = 78 * SCALE
    shield_h = 92 * SCALE

    draw = ImageDraw.Draw(img)

    # Hexagonal / Angular Cyber-Shield Crest
    shield_pts = [
        (shield_x + shield_w * 0.5, shield_y),
        (shield_x + shield_w, shield_y + shield_h * 0.22),
        (shield_x + shield_w * 0.85, shield_y + shield_h * 0.78),
        (shield_x + shield_w * 0.5, shield_y + shield_h),
        (shield_x + shield_w * 0.15, shield_y + shield_h * 0.78),
        (shield_x, shield_y + shield_h * 0.22),
    ]
    draw.polygon(shield_pts, fill=(35, 36, 44, 255), outline=DISCORD_BLURPLE, width=3 * SCALE)

    # Inner glowing beacon diamond
    cx = shield_x + shield_w * 0.5
    cy = shield_y + shield_h * 0.5
    core_pts = [
        (cx, cy - 24 * SCALE),
        (cx + 18 * SCALE, cy),
        (cx, cy + 24 * SCALE),
        (cx - 18 * SCALE, cy),
    ]
    draw.polygon(core_pts, fill=BEACON_ORANGE)

    # Slashing diagonal bolt cutting across the crest
    bolt_pts = [
        (cx + 26 * SCALE, shield_y + 14 * SCALE),
        (cx + 34 * SCALE, shield_y + 14 * SCALE),
        (cx - 26 * SCALE, shield_y + shield_h - 14 * SCALE),
        (cx - 34 * SCALE, shield_y + shield_h - 14 * SCALE),
    ]
    draw.polygon(bolt_pts, fill=DISCORD_WHITE)

    # 2. Sheared dynamic wordmark text
    text_start_x = shield_x + shield_w + 32 * SCALE
    text_y = 14 * SCALE

    # Render "SLASH" in high-contrast Discord White with subtle Blurple accent
    slash_word = "SLASH"
    draw.text((text_start_x, text_y), slash_word, font=font_main, fill=DISCORD_WHITE)
    bbox_slash = draw.textbbox((text_start_x, text_y), slash_word, font=font_main)

    # Angled cyber slash separator between words
    sep_x = bbox_slash[2] + 16 * SCALE
    sep_slash = [
        (sep_x + 18 * SCALE, text_y + 8 * SCALE),
        (sep_x + 28 * SCALE, text_y + 8 * SCALE),
        (sep_x + 10 * SCALE, text_y + 76 * SCALE),
        (sep_x, text_y + 76 * SCALE),
    ]
    draw.polygon(sep_slash, fill=DISCORD_BLURPLE)

    beacon_start_x = sep_x + 36 * SCALE
    beacon_word = "BEACON"

    # BEACON with flame gradient
    b_mask = Image.new("L", (WIDTH, HEIGHT), 0)
    b_draw = ImageDraw.Draw(b_mask)
    b_draw.text((beacon_start_x, text_y), beacon_word, font=font_main, fill=255)
    bbox_beacon = b_draw.textbbox((beacon_start_x, text_y), beacon_word, font=font_main)

    flame_grad = linear_gradient_image(WIDTH, HEIGHT, (234, 88, 12), (254, 224, 71), horizontal=True)
    img.paste(flame_grad, (0, 0), b_mask)

    # Tapered high-speed underline below entire wordmark
    under_y = text_y + 80 * SCALE
    under_pts = [
        (text_start_x, under_y),
        (bbox_beacon[2], under_y),
        (bbox_beacon[2] + 24 * SCALE, under_y + 3 * SCALE),
        (text_start_x + 80 * SCALE, under_y + 4 * SCALE),
    ]
    draw.polygon(under_pts, fill=BEACON_ORANGE)

    # Category Tag: "TACTICAL IDENTITY ENGINE • ANTI-IMPOSTOR"
    pill_x = text_start_x + 4 * SCALE
    pill_y = under_y + 12 * SCALE
    draw.text((pill_x, pill_y), "TACTICAL IDENTITY ENGINE • ANTI-IMPOSTOR", font=font_tag, fill=DISCORD_MUTED)

    # Glow
    glow = apply_glow(img, (249, 115, 22, 60), radius=14 * SCALE, intensity=0.45)
    final_canvas = Image.alpha_composite(glow, img)

    return final_canvas.resize((WIDTH // SCALE, HEIGHT // SCALE), Image.Resampling.LANCZOS)


# =========================================================================
# CONCEPT 3: Discord Pulse & Audio-Wave (Voice Comms, Equalizer, Beacon Broadcast)
# =========================================================================
def render_option3_pulse():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font_main = ImageFont.truetype(ARIAL_ROUNDED_PATH, 74 * SCALE)
    font_sub = ImageFont.truetype(ARIAL_ROUNDED_PATH, 16 * SCALE)

    # 1. Voice Equalizer Slash Graphic
    # 4 rounded equalizer bars tilted in forward slash direction (mimicking discord voice green/blurple bars)
    eq_x = 46 * SCALE
    eq_y = 22 * SCALE
    bar_w = 11 * SCALE
    spacing = 15 * SCALE

    bars = [
        (32 * SCALE, DISCORD_BLURPLE),
        (56 * SCALE, DISCORD_BLURPLE_LIGHT),
        (76 * SCALE, BEACON_AMBER),
        (46 * SCALE, BEACON_ORANGE),
    ]

    for i, (bar_h, color) in enumerate(bars):
        bx = eq_x + i * (bar_w + spacing)
        by = eq_y + (80 * SCALE - bar_h) * 0.5
        draw.rounded_rectangle([bx, by, bx + bar_w, by + bar_h], radius=bar_w // 2, fill=color)

    # 2. Text layout
    text_start_x = eq_x + 4 * (bar_w + spacing) + 24 * SCALE
    text_y = 18 * SCALE

    # "SLASH" in friendly high-contrast white
    slash_word = "Slash"
    draw.text((text_start_x, text_y), slash_word, font=font_main, fill=DISCORD_WHITE)
    bbox_slash = draw.textbbox((text_start_x, text_y), slash_word, font=font_main)

    beacon_start_x = bbox_slash[2] + 12 * SCALE
    beacon_word = "Beacon"

    # "Beacon" in vibrant orange gradient
    b_mask = Image.new("L", (WIDTH, HEIGHT), 0)
    b_draw = ImageDraw.Draw(b_mask)
    b_draw.text((beacon_start_x, text_y), beacon_word, font=font_main, fill=255)
    bbox_beacon = b_draw.textbbox((beacon_start_x, text_y), beacon_word, font=font_main)

    grad = linear_gradient_image(WIDTH, HEIGHT, BEACON_ORANGE, BEACON_GOLD, horizontal=True)
    img.paste(grad, (0, 0), b_mask)

    # Stylize the 'o' in Beacon with radiating radar rings (Voice Broadcast Ripple)
    sub_bbox_beac = draw.textbbox((beacon_start_x, text_y), "Beac", font=font_main)
    sub_bbox_beaco = draw.textbbox((beacon_start_x, text_y), "Beaco", font=font_main)
    o_center_x = (sub_bbox_beac[2] + sub_bbox_beaco[2]) * 0.5
    o_center_y = text_y + 44 * SCALE

    # Concentric pulse waves above 'o'
    r1 = 28 * SCALE
    draw.arc([o_center_x - r1, o_center_y - r1, o_center_x + r1, o_center_y + r1],
             start=200, end=340, fill=(251, 146, 60, 190), width=2 * SCALE)
    r2 = 36 * SCALE
    draw.arc([o_center_x - r2, o_center_y - r2, o_center_x + r2, o_center_y + r2],
             start=210, end=330, fill=(88, 101, 242, 160), width=2 * SCALE)

    # 3. Community Voice / Moderation badge underneath
    sub_text = "VOICE • CHAT • IDENTITY SENTINEL"
    sub_y = text_y + 72 * SCALE
    draw.text((text_start_x + 4 * SCALE, sub_y), sub_text, font=font_sub, fill=DISCORD_MUTED)

    # Green "online / active protection" indicator dot
    dot_x = text_start_x - 14 * SCALE
    dot_y = sub_y + 6 * SCALE
    draw.ellipse([dot_x - 4 * SCALE, dot_y - 4 * SCALE, dot_x + 4 * SCALE, dot_y + 4 * SCALE], fill=(35, 165, 90))

    # Glow
    glow = apply_glow(img, (88, 101, 242, 50), radius=15 * SCALE, intensity=0.5)
    final_canvas = Image.alpha_composite(glow, img)

    return final_canvas.resize((WIDTH // SCALE, HEIGHT // SCALE), Image.Resampling.LANCZOS)


# =========================================================================
# SHOWCASE SHEET: Comparison Artifact
# =========================================================================
def render_showcase_sheet(opt1_img, opt2_img, opt3_img, output_path):
    canvas_w = 1200
    canvas_h = 1000
    sheet = Image.new("RGBA", (canvas_w, canvas_h), DARKEST_BG)
    draw = ImageDraw.Draw(sheet)

    font_title = ImageFont.truetype(FUTURA_FONT_PATH, 32, index=2)
    font_sub = ImageFont.truetype(ARIAL_BOLD_PATH, 14)
    font_card_title = ImageFont.truetype(ARIAL_BOLD_PATH, 16)
    font_desc = ImageFont.truetype(ARIAL_BOLD_PATH, 13)

    # Header
    draw.text((50, 40), "SLASHBEACON BRANDING & WORDMARK CANDIDATES", font=font_title, fill=DISCORD_WHITE)
    draw.text((50, 80), "Gaming & Discord-inspired logotypes designed for desktop app headers, website navbars, and community media.", font=font_sub, fill=DISCORD_MUTED)

    options = [
        ("OPTION 1: THE COMMAND TERMINAL",
         "Inspiration: Discord Slash Commands (`/`) & Cyber CLI. Sharp, modern, developer/gamer command-line dynamic.",
         opt1_img,
         [("#5865f2", "Discord Blurple"), ("#00a8fc", "Cyber Cyan"), ("#f97316", "Beacon Orange"), ("#f2f3f5", "High-Contrast White")]),
        ("OPTION 2: THE ESPORTS CYBER-SHIELD",
         "Inspiration: Competitive Gaming, Clan Shield Crests & Anti-Impostor Sentinel. Fast, bold, speed-cut typography.",
         opt2_img,
         [("#5865f2", "Twilight Blurple"), ("#ea580c", "Flame Orange"), ("#fde047", "Solar Gold"), ("#232428", "Armor Slate")]),
        ("OPTION 3: THE DISCORD PULSE & AUDIO-WAVE",
         "Inspiration: Discord Voice Channels, Equalizer Waveforms & Live Broadcast Radar. Friendly, approachable, community-native.",
         opt3_img,
         [("#5865f2", "Voice Blurple"), ("#23a55a", "Online Green"), ("#fb923c", "Beacon Amber"), ("#f2f3f5", "Pure Snow")]),
    ]

    card_y = 130
    card_h = 260
    card_w = 1100

    for i, (title, desc, wordmark_img, chips) in enumerate(options):
        # Card background
        draw.rounded_rectangle([50, card_y, 50 + card_w, card_y + card_h], radius=12, fill=DARK_CARD, outline=(255, 255, 255, 25), width=1)

        # Card header badge
        badge_color = DISCORD_BLURPLE if i == 0 else (BEACON_ORANGE if i == 1 else (35, 165, 90))
        draw.rounded_rectangle([70, card_y + 16, 170, card_y + 40], radius=6, fill=badge_color)
        draw.text((80, card_y + 20), f"CHOICE #{i+1}", font=font_card_title, fill=DISCORD_WHITE)

        draw.text((185, card_y + 20), title, font=font_card_title, fill=DISCORD_WHITE)
        draw.text((70, card_y + 48), desc, font=font_desc, fill=DISCORD_MUTED)

        # Inner display well for the wordmark
        well_y = card_y + 76
        well_h = 110
        draw.rounded_rectangle([70, well_y, 70 + 960, well_y + well_h], radius=8, fill=(24, 25, 28, 255), outline=(255, 255, 255, 15), width=1)

        # Paste wordmark centered inside well
        # wordmark original aspect ratio is 982 x 124 -> scale down slightly to fit 940 x 100
        target_w = 780
        target_h = int(124 * (target_w / 982))
        wm_resized = wordmark_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        paste_x = 70 + (960 - target_w) // 2
        paste_y = well_y + (well_h - target_h) // 2
        sheet.alpha_composite(wm_resized, (paste_x, paste_y))

        # Color chips footer inside card
        chip_x = 70
        chip_y = card_y + 202
        for col_hex, col_label in chips:
            r = int(col_hex[1:3], 16)
            g = int(col_hex[3:5], 16)
            b = int(col_hex[5:7], 16)
            draw.ellipse([chip_x, chip_y + 4, chip_x + 16, chip_y + 20], fill=(r, g, b))
            draw.text((chip_x + 22, chip_y + 4), col_label, font=font_desc, fill=DISCORD_WHITE)
            chip_x += 160

        card_y += card_h + 24

    sheet.save(output_path, "PNG")
    print(f"Showcase sheet saved to: {output_path}")


def main():
    os.makedirs("ui/assets/wordmarks", exist_ok=True)
    os.makedirs("website/assets/wordmarks", exist_ok=True)

    print("==> Rendering Option 1: Command Terminal...")
    opt1 = render_option1_terminal()
    opt1.save("ui/assets/wordmarks/wordmark_option1_terminal.png", "PNG")
    opt1.save("website/assets/wordmarks/wordmark_option1_terminal.png", "PNG")

    print("==> Rendering Option 2: Esports Cyber-Shield...")
    opt2 = render_option2_esports()
    opt2.save("ui/assets/wordmarks/wordmark_option2_esports.png", "PNG")
    opt2.save("website/assets/wordmarks/wordmark_option2_esports.png", "PNG")

    print("==> Rendering Option 3: Discord Pulse & Audio-Wave...")
    opt3 = render_option3_pulse()
    opt3.save("ui/assets/wordmarks/wordmark_option3_pulse.png", "PNG")
    opt3.save("website/assets/wordmarks/wordmark_option3_pulse.png", "PNG")

    artifact_dir = "/Users/wardagentic/.gemini/antigravity-ide/brain/aa383952-510b-4cfb-99e9-77caa7dfe482"
    showcase_path = os.path.join(artifact_dir, "wordmarks_showcase.png")
    print("==> Rendering Showcase Comparison Sheet...")
    render_showcase_sheet(opt1, opt2, opt3, showcase_path)

    # Also save individual transparent PNGs to artifact dir for direct embedding
    opt1.save(os.path.join(artifact_dir, "wordmark_option1_terminal.png"), "PNG")
    opt2.save(os.path.join(artifact_dir, "wordmark_option2_esports.png"), "PNG")
    opt3.save(os.path.join(artifact_dir, "wordmark_option3_pulse.png"), "PNG")

    print("All wordmark options rendered successfully!")


if __name__ == "__main__":
    main()
