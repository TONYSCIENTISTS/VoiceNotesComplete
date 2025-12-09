from PIL import Image
import os

# Paths
transparent_mascot_path = r"C:/Users/Thatsme/.gemini/antigravity/brain/85943b80-5b58-4958-9bd4-bbca3bd8df58/voice_ai_mascot_3d_transparent_final.png"
assets_dir = r"c:\Users\Thatsme\AimaReact\VoiceNotesComplete\assets"

# Colors
BG_COLOR = "#05060b"

def create_icons():
    try:
        # Load transparent mascot
        mascot = Image.open(transparent_mascot_path).convert("RGBA")
        
        # 1. Create Adaptive Icon Foreground (Transparent)
        # Expo recommends 1024x1024, with the main content within the safe zone (center 66%)
        # Our mascot is already centered and round, so we'll resize it to fit comfortably.
        # Let's verify the size:
        print(f"Mascot original size: {mascot.size}")
        
        # Resize to standard 1024x1024
        final_adaptive = mascot.resize((1024, 1024), Image.Resampling.LANCZOS)
        
        # Save adaptive-icon.png (Transparent)
        adaptive_path = os.path.join(assets_dir, "adaptive-icon.png")
        final_adaptive.save(adaptive_path, "PNG")
        print(f"✅ Saved adaptive-icon.png (Transparent)")

        # 2. Create Standard Icon (Opaque for iOS/Legacy)
        # Create a new background image
        bg = Image.new("RGBA", (1024, 1024), BG_COLOR)
        
        # Composite mascot onto background
        # We can use the same resized mascot
        bg.paste(final_adaptive, (0, 0), final_adaptive)
        
        # Save icon.png (Opaque)
        icon_path = os.path.join(assets_dir, "icon.png")
        bg.save(icon_path, "PNG")
        print(f"✅ Saved icon.png (Opaque Black Background)")

    except Exception as e:
        print(f"❌ Error creating icons: {e}")

if __name__ == "__main__":
    create_icons()
