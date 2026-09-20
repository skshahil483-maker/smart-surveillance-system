import os
import cv2
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sample_data_generator")

def generate_sample_dataset(base_dir="datasets/violence_dataset"):
    """
    Generates sample images and YOLO annotation text files for train, val, and test splits.
    Used for immediate local testing, verification, and code demonstration.
    """
    splits = {
        "train": 10,
        "val": 4,
        "test": 4
    }

    os.makedirs(base_dir, exist_ok=True)
    logger.info(f"Generating sample dataset inside '{base_dir}'...")

    for split, count in splits.items():
        img_dir = os.path.join(base_dir, "images", split)
        lbl_dir = os.path.join(base_dir, "labels", split)
        os.makedirs(img_dir, exist_ok=True)
        os.makedirs(lbl_dir, exist_ok=True)

        for i in range(1, count + 1):
            img_name = f"sample_{split}_{i:03d}.jpg"
            lbl_name = f"sample_{split}_{i:03d}.txt"

            img_path = os.path.join(img_dir, img_name)
            lbl_path = os.path.join(lbl_dir, lbl_name)

            # Create synthetic surveillance frame (640x640)
            img = np.zeros((640, 640, 3), dtype=np.uint8)
            # Add synthetic background/grid pattern
            cv2.rectangle(img, (50, 50), (590, 590), (40, 40, 40), -1)
            cv2.putText(img, f"CAM-01 {split.upper()} FRAME #{i}", (70, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 200), 2)

            # Draw synthetic detection bounding boxes
            if i % 2 == 0:
                # Class 1: Violence (Red bounding box)
                cv2.rectangle(img, (200, 200), (400, 450), (0, 0, 255), 2)
                cv2.putText(img, "VIOLENCE (0.94)", (200, 190),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                # YOLO format: class x_center y_center width height (normalized)
                # Box: x=[200..400] (center 300/640=0.46875, w=200/640=0.3125)
                #      y=[200..450] (center 325/640=0.50781, h=250/640=0.390625)
                label_text = "1 0.46875 0.50781 0.3125 0.390625\n"
            else:
                # Class 0: Non-Violence (Green bounding box)
                cv2.rectangle(img, (150, 180), (320, 480), (0, 255, 0), 2)
                cv2.putText(img, "NORMAL (0.98)", (150, 170),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                label_text = "0 0.3671875 0.515625 0.265625 0.46875\n"

            cv2.imwrite(img_path, img)
            with open(lbl_path, "w") as f:
                f.write(label_text)

        logger.info(f"Generated {count} sample images and labels for split '{split}'.")

    logger.info("Sample dataset generation complete!")

if __name__ == "__main__":
    generate_sample_dataset()
