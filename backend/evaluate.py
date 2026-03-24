"""
CrowdSense AI — Evaluation Metrics Script
Calculates Precision, Recall, and mAP for the crowd detection model.
"""

try:
    from ultralytics import YOLO
    _YOLO_AVAILABLE = True
except ImportError:
    _YOLO_AVAILABLE = False

def evaluate_model(model_path="yolov8n.pt", data_yaml="coco8.yaml"):
    """
    Evaluates the YOLOv8 model for Crowd Detection.
    Calculates Precision, Recall, and mAP focusing on the 'person' class.
    
    Note: Requires a valid dataset configuration (data_yaml) with ground truth labels.
    """
    if not _YOLO_AVAILABLE:
        print("ultralytics not installed. Please install to run evaluation: pip install ultralytics")
        return
        
    print(f"Loading model: {model_path} for evaluation...")
    model = YOLO(model_path)
    
    # Run validation (requires a dataset YAML, defaults to coco8 if not provided for quick test)
    print(f"Running validation on dataset: {data_yaml}...")
    try:
        # Class 0 is 'person' in COCO dataset
        metrics = model.val(data=data_yaml, classes=[0], verbose=True) 
        
        print("\n" + "="*40)
        print("          EVALUATION RESULTS          ")
        print("="*40)
        
        # Accessing standard YOLOv8 metrics dictionary
        results = metrics.results_dict
        
        # Different YOLO versions might have slightly different keys, providing generic fallback
        precision = results.get('metrics/precision(B)', 0.0)
        recall = results.get('metrics/recall(B)', 0.0)
        map50 = results.get('metrics/mAP50(B)', 0.0)
        map50_95 = results.get('metrics/mAP50-95(B)', 0.0)
        
        print(f"Precision (P): {precision:.4f}")
        print(f"Recall (R):    {recall:.4f}")
        print(f"mAP@0.50:      {map50:.4f}")
        print(f"mAP@0.50:0.95: {map50_95:.4f}")
        print("="*40)
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        print("Ensure you have the required dataset downloaded (e.g., coco8.yaml config).")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate CrowdSense Detection Model")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Path to YOLOv8 model")
    parser.add_argument("--data", type=str, default="coco8.yaml", help="Path to dataset YAML file")
    
    args = parser.parse_args()
    evaluate_model(args.model, args.data)
