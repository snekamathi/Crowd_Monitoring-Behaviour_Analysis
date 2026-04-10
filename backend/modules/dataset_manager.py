import os
import cv2
import yaml
import shutil
import urllib.request
import zipfile
from pathlib import Path
from ultralytics import YOLO

class DatasetManager:
    """Manages YAML dataset structure, frame extraction, and auto-labeling."""

    def __init__(self, dataset_path="./dataset"):
        self.root = Path(dataset_path)
        self.img_train = self.root / "images" / "train"
        self.img_val = self.root / "images" / "val"
        self.label_train = self.root / "labels" / "train"
        self.label_val = self.root / "labels" / "val"
        
        # Initialize YOLO for auto-labeling
        self.model = YOLO("yolov8n.pt") 
        self.setup_folders()
        self.create_data_yaml()

    def setup_folders(self):
        """Create dataset directory structure if it doesn't exist."""
        for p in [self.img_train, self.img_val, self.label_train, self.label_val]:
            p.mkdir(parents=True, exist_ok=True)
            print(f"[DATASET] Verified folder: {p}")

    def create_data_yaml(self):
        """Generate data.yaml for YOLOv8 training."""
        data = {
            'path': str(self.root.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'names': {
                0: 'person'
            }
        }
        yaml_path = self.root / "data.yaml"
        with open(yaml_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False)
        print(f"[DATASET] data.yaml created at {yaml_path}")

    def add_manual_file(self, file_content, filename, is_label=False, is_val=False):
        """Save manually uploaded images or label files. Auto-labels images if detected."""
        target_dir = self.img_val if is_val else self.img_train
        if is_label:
            target_dir = self.label_val if is_val else self.label_train
            
        dest = target_dir / filename
        with open(dest, "wb") as f:
            f.write(file_content)
            
        # If it's an image, auto-label it so the user doesn't get a 'mismatch' error
        if not is_label and filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            import numpy as np
            import cv2
            
            # Read image from byte content
            img_arr = np.frombuffer(file_content, np.uint8)
            frame = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
            
            if frame is not None:
                results = self.model(frame, classes=[0], conf=0.3)
                label_name = f"{Path(filename).stem}.txt"
                label_dir = self.label_val if is_val else self.label_train
                label_path = label_dir / label_name
                
                with open(label_path, 'w') as f:
                    for r in results:
                        for box in r.boxes:
                            cls = int(box.cls[0])
                            xywhn = box.xywhn[0].tolist()
                            f.write(f"{cls} {' '.join(map(str, xywhn))}\n")
                print(f"[DATASET] Auto-labeled uploaded image: {filename}")

        return str(dest)

    def extract_and_autolabel(self, video_path, sample_rate=10):
        """Extract frames from video and use YOLO to generate labels (Requirement 2)."""
        cap = cv2.VideoCapture(video_path)
        frame_idx = 0
        saved_count = 0
        
        video_name = Path(video_path).stem
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            if frame_idx % sample_rate == 0:
                img_name = f"{video_name}_f{frame_idx}.jpg"
                img_path = self.img_train / img_name
                cv2.imwrite(str(img_path), frame)
                
                # Auto-label with YOLO
                results = self.model(frame, classes=[0], conf=0.3) # Only person
                
                label_path = self.label_train / f"{video_name}_f{frame_idx}.txt"
                with open(label_path, 'w') as f:
                    for r in results:
                        boxes = r.boxes
                        for box in boxes:
                            # YOLO format: cls x_center y_center width height (normalized)
                            cls = int(box.cls[0])
                            xywhn = box.xywhn[0].tolist()
                            f.write(f"{cls} {' '.join(map(str, xywhn))}\n")
                
                saved_count += 1
            frame_idx += 1
            
        cap.release()
        return saved_count

    def download_sample_dataset(self):
        """Download a small sample dataset for demonstration (Requirement 3)."""
        # Using a small public subset or a pre-prepared zip 
        # For simulation, we'll download a tiny sample zip containing 5 images/labels
        url = "https://github.com/ultralytics/yolov5/releases/download/v1.0/coco128.zip" # Standard small dataset
        zip_path = self.root / "sample.zip"
        
        print(f"[DATASET] Downloading sample from {url}...")
        urllib.request.urlretrieve(url, zip_path)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(self.root / "temp")
            
        # Move files to our structure (coco128 structure matches YOLO)
        temp_dir = self.root / "temp" / "coco128"
        for folder in ["images", "labels"]:
            for split in ["train2017"]:
                src_path = temp_dir / folder / split
                target_path = self.img_train if folder == "images" else self.label_train
                
                if src_path.exists():
                    for f in src_path.iterdir():
                        shutil.move(str(f), str(target_path / f.name))
        
        # Cleanup
        shutil.rmtree(self.root / "temp")
        os.remove(zip_path)
        return "Sample dataset (COCO128 subset) loaded successfully."

    def get_stats(self):
        """Return counts of images and labels."""
        return {
            "train": {
                "images": len(list(self.img_train.glob("*.jpg"))) + len(list(self.img_train.glob("*.png"))),
                "labels": len(list(self.label_train.glob("*.txt")))
            },
            "val": {
                "images": len(list(self.img_val.glob("*.jpg"))) + len(list(self.img_val.glob("*.png"))),
                "labels": len(list(self.label_val.glob("*.txt")))
            }
        }

    def validate(self):
        """Check if dataset is ready for training."""
        stats = self.get_stats()
        if stats["train"]["images"] == 0:
            return False, "No training images found."
        if stats["train"]["images"] != stats["train"]["labels"]:
            return False, f"Mismatch: {stats['train']['images']} images but {stats['train']['labels']} labels in train."
        if stats["val"]["images"] > 0 and stats["val"]["images"] != stats["val"]["labels"]:
            return False, f"Mismatch: {stats['val']['images']} images but {stats['val']['labels']} labels in val."
            
        return True, "Dataset is valid and ready."

    def train(self, epochs=20, imgsz=480, progress_callback=None):
        """Execute YOLOv8 training on the collected dataset."""
        self.cleanup() # Automatically remove orphans before training
        
        yaml_path = self.root / "data.yaml"
        if not yaml_path.exists():
            self.create_data_yaml()
            
        print(f"[TRAIN] Starting YOLOv8 training for {epochs} epochs...")
        try:
            # We use a fresh model to avoid state issues from the auto-labeler
            train_model = YOLO("yolov8n.pt")
            
            # Add custom callbacks if callback exists
            if progress_callback:
                def on_train_epoch_end(trainer):
                    # epoch is 0-indexed in trainer
                    current_epoch = trainer.epoch + 1
                    progress_callback(current_epoch, trainer.loss)
                
                train_model.add_callback("on_train_epoch_end", on_train_epoch_end)

            results = train_model.train(
                data=str(yaml_path.absolute()),
                epochs=epochs,
                imgsz=imgsz,
                project=str(self.root / "runs"),
                name="crowd_train"
            )
            print("[TRAIN] Training completed successfully.")
            return True, "Training finished successfully."
        except Exception as e:
            print(f"[TRAIN] Error: {e}")
            return False, str(e)

    def cleanup(self):
        """Find and remove images without label files or vice versa to ensure 1:1 match."""
        counts = {"images": 0, "labels": 0}
        for split in ["train", "val"]:
            img_dir = self.root / "images" / split
            lbl_dir = self.root / "labels" / split
            
            if not img_dir.exists() or not lbl_dir.exists():
                continue
                
            img_files = {f.stem: f for f in img_dir.glob("*") if f.suffix.lower() in [".jpg", ".png", ".jpeg"]}
            lbl_files = {f.stem: f for f in lbl_dir.glob("*.txt")}
            
            # Remove images without labels
            for stem, path in img_files.items():
                if stem not in lbl_files:
                    path.unlink()
                    counts["images"] += 1
                    
            # Remove labels without images
            for stem, path in lbl_files.items():
                if stem not in img_files:
                    path.unlink()
                    counts["labels"] += 1
        
        return True, f"Cleanup finished: {counts['images']} orphan images and {counts['labels']} orphan labels removed."
