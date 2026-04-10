import cv2
import sys

def test_camera(index):
    print(f"Testing camera index {index} with CAP_DSHOW...")
    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    if cap.isOpened():
        print(f"Success! Camera index {index} opened.")
        name = cap.getBackendName()
        print(f"Backend: {name}")
        ret, frame = cap.read()
        if ret:
            print(f"Successfully read a frame of shape {frame.shape}")
        else:
            print("Failed to read a frame.")
        cap.release()
        return True
    else:
        print(f"Failed to open camera index {index}.")
        return False

if __name__ == "__main__":
    found = False
    for i in range(5):
        if test_camera(i):
            found = True
            print(f"Found camera at index {i}")
            break
    if not found:
        print("No camera found in indices 0-4")
        sys.exit(1)
