import cv2
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Set folder path and video parameters
folder_path = 'D:\PythonProjects\FinIQ\9_VideoCompilation\Test1'  # Replace with your folder path
output_video_path = os.path.join(folder_path, 'output_video.mp4')
image_files = sorted([f for f in os.listdir(folder_path) if f.endswith(('.png', '.jpg', '.jpeg'))])

# Ensure there are images in the folder
if not image_files:
    print("No images found in the folder.")
    exit()

# Get the dimensions of the first image
first_image_path = os.path.join(folder_path, image_files[0])
first_image = Image.open(first_image_path)
width, height = first_image.size

# Initialize video writer
fps = 2  # Frames per second (0.5 seconds per image)
fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec for MP4
video_writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

# Font setup for captions
font_size = 30
font = ImageFont.truetype("arial.ttf", font_size)

# Number of frames per image
frames_per_image = int(fps * 0.5)  # 2 frames per second * 0.5 seconds per image = 1 frame per image

for image_file in image_files:
    image_path = os.path.join(folder_path, image_file)
    image = Image.open(image_path)
    
    # Draw the filename as a caption on the image
    draw = ImageDraw.Draw(image)
    text = os.path.basename(image_file)
    
    # Use textbbox to get the bounding box of the text
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = width - text_width - 10  # 10 pixels from the right
    y = 10  # 10 pixels from the top
    draw.text((x, y), text, font=font, fill="white")

    # Convert PIL image to OpenCV format
    image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Write each image multiple times to achieve the desired duration
    for _ in range(frames_per_image):
        video_writer.write(image_cv)

# Release the video writer
video_writer.release()

print(f"Video created successfully at {output_video_path}")
