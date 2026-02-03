import os
from moviepy.editor import ImageClip, concatenate_videoclips, TextClip, CompositeVideoClip

# Directory containing the images
image_folder = r"D:\PythonProjects\FinIQ\9_VideoCompilation\Test1"
# Output video path
output_video_path = os.path.join(image_folder, "compiled_video.mp4")

# Fetch all image files from the directory
image_files = [os.path.join(image_folder, img) for img in os.listdir(image_folder) if img.endswith(('.png', '.jpg', '.jpeg'))]

# Create a list to hold video clips
clips = []

for img_path in image_files:
    # Create an ImageClip for each image
    clip = ImageClip(img_path).set_duration(0.5)
    
    # Get the filename for the caption
    filename = os.path.basename(img_path)
    
    # Create a TextClip for the caption
    txt_clip = TextClip(filename, fontsize=24, color='white', bg_color='black')
    
    # Position the text at the top right corner
    txt_clip = txt_clip.set_position(('right', 'top')).set_duration(0.5)
    
    # Composite the text on the image
    video = CompositeVideoClip([clip, txt_clip])
    
    # Append the final clip to the list
    clips.append(video)

# Concatenate all the video clips
final_video = concatenate_videoclips(clips, method="compose")

# Write the video file to the specified path
final_video.write_videofile(output_video_path, fps=24)

print("Video compilation completed and saved at:", output_video_path)
