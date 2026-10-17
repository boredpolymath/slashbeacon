#!/usr/bin/env python3
"""
Generate pixel-accurate screenshots and animated carousel of SlashBeacon's application UI.
Renders real application tabs in headless Chromium, frames with native macOS dark window chrome,
and outputs high-resolution assets to website/assets/.
"""

import os
import sys
import time
import http.server
import socketserver
import threading
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from playwright.sync_api import sync_playwright

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UI_DIR = os.path.join(ROOT_DIR, "ui")
ASSETS_DIR = os.path.join(ROOT_DIR, "website", "assets")

def get_font(size, bold=False):
    paths = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFCompact.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf"
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, int(size))
            except Exception:
                continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None

def frame_macos_window(content_img):
    """
    Wraps content image (942 x 590) with native macOS dark mode titlebar and drop shadow
    producing an exact 1024 x 700 RGBA image.
    """
    cw, ch = 1024, 700
    win_w, win_h = 942, 618
    title_h = 28
    
    # Target window body size
    body_h = win_h - title_h
    body_img = content_img.resize((win_w, body_h), Image.Resampling.LANCZOS).convert("RGBA")
    
    win_x = 41
    win_y = 28
    
    # Create window image with rounded corners
    win = Image.new("RGBA", (win_w, win_h), (0, 0, 0, 0))
    w_draw = ImageDraw.Draw(win)
    
    # Outer rounded rectangle background
    w_draw.rounded_rectangle([0, 0, win_w - 1, win_h - 1], radius=10, fill=(30, 31, 34, 255), outline=(255, 255, 255, 35), width=1)
    
    # Titlebar background
    w_draw.rounded_rectangle([0, 0, win_w - 1, title_h + 8], radius=10, fill=(38, 40, 44, 255))
    w_draw.rectangle([0, title_h, win_w - 1, title_h + 8], fill=(30, 31, 34, 255))
    w_draw.line([(0, title_h), (win_w - 1, title_h)], fill=(255, 255, 255, 20), width=1)
    
    # Traffic lights (red, yellow, green)
    w_draw.ellipse([16, 8, 28, 20], fill=(255, 95, 87, 255), outline=(224, 68, 62, 255), width=1)
    w_draw.ellipse([36, 8, 48, 20], fill=(254, 188, 46, 255), outline=(214, 158, 32, 255), width=1)
    w_draw.ellipse([56, 8, 68, 20], fill=(40, 200, 64, 255), outline=(27, 168, 48, 255), width=1)
    
    # Window title
    title_font = get_font(12, bold=True)
    title_text = "SlashBeacon — Community Impersonation Protection"
    bbox = w_draw.textbbox((0, 0), title_text, font=title_font)
    tw = bbox[2] - bbox[0]
    w_draw.text(((win_w - tw) // 2, 7), title_text, fill=(219, 222, 225, 255), font=title_font)
    
    # Mask content with bottom rounded corners
    body_mask = Image.new("L", (win_w, body_h), 255)
    b_draw = ImageDraw.Draw(body_mask)
    # We round only the bottom corners of the body mask
    # A full rounded rect pasted at top=title_h
    corner_mask = Image.new("L", (win_w, win_h), 0)
    cm_draw = ImageDraw.Draw(corner_mask)
    cm_draw.rounded_rectangle([0, 0, win_w - 1, win_h - 1], radius=10, fill=255)
    
    win.paste(body_img, (0, title_h))
    
    # Apply outer window corner clipping
    win.putalpha(corner_mask)
    
    # Create final 1024x700 canvas with drop shadow
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (win_w + 50, win_h + 50), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([25, 25, win_w + 25, win_h + 25], radius=12, fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    
    canvas.paste(shadow, (win_x - 25, win_y - 20), shadow)
    canvas.paste(win, (win_x, win_y), win)
    
    return canvas

def generate_all_screenshots():
    print("==> Starting HTTP server for UI assets...")
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass
            
    port = 9899
    server = socketserver.TCPServer(('127.0.0.1', port), lambda *args: QuietHandler(*args, directory=UI_DIR))
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    
    tabs = [
        ("triage", "button[data-tab='triage']", "screenshot_alerts.png"),
        ("vault", "button[data-tab='vault']", "screenshot_protected.png"),
        ("audit", "button[data-tab='audit']", "screenshot_activity_log.png"),
        ("discord", "button[data-tab='discord']", "screenshot_discord_setup.png"),
        ("help", "button[data-tab='help']", "screenshot_setup_guide.png")
    ]
    
    framed_images = []
    
    with sync_playwright() as p:
        print("==> Launching Chromium...")
        browser = p.chromium.launch()
        # Viewport matched to window interior aspect ratio
        page = browser.new_page(viewport={"width": 1080, "height": 720}, device_scale_factor=2)
        page.goto(f"http://127.0.0.1:{port}/index.html")
        page.wait_for_selector("#app-header")
        time.sleep(1.0)
        
        for tab_name, selector, filename in tabs:
            print(f"==> Navigating to {tab_name} tab ({filename})...")
            try:
                page.click(selector)
            except Exception as e:
                print(f"  Warning clicking {selector}: {e}")
                
            time.sleep(0.6)
            
            # Capture full application viewport screenshot
            screenshot_bytes = page.screenshot()
            import io
            raw_img = Image.open(io.BytesIO(screenshot_bytes))
            
            # Frame into macOS window
            framed = frame_macos_window(raw_img)
            
            out_path = os.path.join(ASSETS_DIR, filename)
            framed.save(out_path, "PNG", optimize=True)
            print(f"  ✓ Saved {filename} ({framed.size[0]}x{framed.size[1]})")
            framed_images.append(framed)
            
        browser.close()
        
    server.shutdown()
    
    # Generate animated webp carousel
    if framed_images:
        carousel_path = os.path.join(ASSETS_DIR, "app_carousel.webp")
        print(f"==> Assembling animated carousel {carousel_path} ({len(framed_images)} frames)...")
        # Save as animated webp with 2500ms per frame
        framed_images[0].save(
            carousel_path,
            "WEBP",
            save_all=True,
            append_images=framed_images[1:],
            duration=2500,
            loop=0,
            quality=88,
            method=6
        )
        print(f"  ✓ Saved animated carousel {carousel_path} ({os.path.getsize(carousel_path) / 1024:.1f} KB)")
        
    print("==> All screenshot assets successfully updated!")

if __name__ == "__main__":
    generate_all_screenshots()
