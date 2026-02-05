#!/bin/bash
# Extract first frame from hero video as poster image

VIDEO_PATH="video/hero.mp4"
OUTPUT_PATH="img/hero-poster.jpg"
PUBLIC_OUTPUT="public/img/hero-poster.jpg"

cd "$(dirname "$0")/.."

if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "Install it with: sudo dnf install -y ffmpeg"
    exit 1
fi

if [ ! -f "$VIDEO_PATH" ]; then
    echo "Error: Video file not found at $VIDEO_PATH"
    exit 1
fi

echo "Extracting first frame from $VIDEO_PATH..."

# Extract first frame with high quality
ffmpeg -y -i "$VIDEO_PATH" -vframes 1 -q:v 2 "$OUTPUT_PATH"

if [ $? -eq 0 ]; then
    echo "Success! Poster saved to $OUTPUT_PATH"
    
    # Also copy to public folder
    cp "$OUTPUT_PATH" "$PUBLIC_OUTPUT"
    echo "Also copied to $PUBLIC_OUTPUT"
    
    # Show file size
    ls -lh "$OUTPUT_PATH"
else
    echo "Error: Failed to extract frame"
    exit 1
fi
