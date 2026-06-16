import os
from PIL import Image

# Source master image paths
logo_source = r"C:\Users\Asus\.gemini\antigravity-ide\brain\0a1524f8-05b0-425b-82c4-a4cdc8f0f5b8\scalvea_logo_master_1781600729195.png"
og_source = r"C:\Users\Asus\.gemini\antigravity-ide\brain\0a1524f8-05b0-425b-82c4-a4cdc8f0f5b8\scalvea_og_image_master_1781600743292.png"

# Destination directories
public_dir = r"c:\React\scalvea\public"

def generate_assets():
    print("Resizing branding assets...")
    
    # Open master logo
    with Image.open(logo_source) as img:
        # 1. Save PNG sizes
        img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon-32x32.png"), "PNG")
        print("Generated favicon-32x32.png")
        
        img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon-192x192.png"), "PNG")
        print("Generated favicon-192x192.png")
        
        img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon-512x512.png"), "PNG")
        print("Generated favicon-512x512.png")
        
        # 2. Save Apple Touch Icon
        img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")
        print("Generated apple-touch-icon.png")
        
        # 3. Save favicon.ico with multiple resolutions
        img.save(
            os.path.join(public_dir, "favicon.ico"),
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)]
        )
        print("Generated favicon.ico (multi-size)")

    # Open and convert OG image
    with Image.open(og_source) as img:
        # Convert to RGB (in case of RGBA) and save as JPEG
        img.convert("RGB").save(os.path.join(public_dir, "og-image.jpg"), "JPEG", quality=90)
        print("Generated og-image.jpg (1200x630)")

if __name__ == "__main__":
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
    generate_assets()
