import cv2
import os

# Paths
video_path = "video.mp4"           # video inside root folder
output_folder = "dataset/images/train"

# Create folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Open video
cap = cv2.VideoCapture(video_path)
count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Save every 5th frame
    if count % 5 == 0:
        cv2.imwrite(f"{output_folder}/frame_{count}.jpg", frame)

    count += 1

cap.release()
print("Frames extracted successfully!")