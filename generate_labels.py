from ultralytics import YOLO
import cv2
import os

# Pretrained YOLOv8 model for person detection
model = YOLO("yolov8n.pt")

image_folder = "dataset/images/train"
label_folder = "dataset/labels/train"

# Create label folder
os.makedirs(label_folder, exist_ok=True)

for img_name in os.listdir(image_folder):
    img_path = os.path.join(image_folder, img_name)
    results = model(img_path)

    h, w, _ = cv2.imread(img_path).shape

    with open(os.path.join(label_folder, img_name.replace(".jpg", ".txt")), "w") as f:
        for box in results[0].boxes:
            cls = int(box.cls[0])
            if cls == 0:  # person class only
                x1, y1, x2, y2 = box.xyxy[0]
                x_center = ((x1 + x2) / 2) / w
                y_center = ((y1 + y2) / 2) / h
                width = (x2 - x1) / w
                height = (y2 - y1) / h
                f.write(f"0 {x_center} {y_center} {width} {height}\n")

print("Labels generated successfully!")