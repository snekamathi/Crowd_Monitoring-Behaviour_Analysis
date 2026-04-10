from ultralytics import YOLO

# Load the pretrained model
model = YOLO("yolov8n.pt")

print("--- TRAINING STARTED ---")
# Start Training
# Using our local data.yaml and the requested parameters
model.train(
    data="dataset/data.yaml", 
    epochs=20, 
    imgsz=640
)

print("--- TRAINING FINISHED SUCCESSFULY ---")
print("Trained weights are located at: ./runs/detect/train/weights/best.pt")
