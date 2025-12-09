from PIL import Image
import os

# Note: Using forward slashes for paths to avoid escape issues
source_path = "C:/Users/Thatsme/.gemini/antigravity/brain/85943b80-5b58-4958-9bd4-bbca3bd8df58/voice_ai_mascot_3d_transparent_1765306779739.png"
output_path = "C:/Users/Thatsme/.gemini/antigravity/brain/85943b80-5b58-4958-9bd4-bbca3bd8df58/voice_ai_mascot_3d_transparent_final.png"

def make_transparent(path, out_path):
    try:
        # Load image
        img = Image.open(path).convert("RGBA")
        datas = img.getdata()

        newData = []
        width, height = img.size
        
        # Get background color from top-left corner
        bg_pixel = img.getpixel((0, 0))
        bg_r, bg_g, bg_b, bg_a = bg_pixel
        
        # If it's already transparent, just save copy
        if bg_a == 0:
            print("Image is already transparent.")
            img.save(out_path)
            return

        print(f"Detected background color: {bg_pixel}")
        
        # Simple threshold-based removal
        threshold = 40 
        
        for item in datas:
            r, g, b, a = item
            # Check difference from background color
            diff = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
            
            if diff < threshold:
                # Transparent
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(out_path, "PNG")
        print(f"Saved transparent image to: {out_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    make_transparent(source_path, output_path)
