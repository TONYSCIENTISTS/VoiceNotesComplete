from PIL import Image
import os

source_path = r"C:/Users/Thatsme/.gemini/antigravity/brain/85943b80-5b58-4958-9bd4-bbca3bd8df58/uploaded_image_1765306618089.jpg"
assets_dir = r"c:\Users\Thatsme\AimaReact\VoiceNotesComplete\assets"

# Ensure PILLOW is available (it usually is in standard envs, if not we'll fail and handle it)
try:
    img = Image.open(source_path)
    
    # 1. Save as icon.png (1024x1024 recommended)
    icon_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_img.save(os.path.join(assets_dir, "icon.png"), "PNG")
    print(f"Updated icon.png")

    # 2. Save as adaptive-icon.png (1024x1024 recommended, usually with padding, but we'll use full for now)
    # Ideally adaptive icon has foreground and background, but for quick setup we use the full image
    adaptive_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    adaptive_img.save(os.path.join(assets_dir, "adaptive-icon.png"), "PNG")
    print(f"Updated adaptive-icon.png")

except Exception as e:
    print(f"Error processing image: {e}")
