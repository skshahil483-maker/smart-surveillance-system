import os
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("train_yolo")

def train_yolo(
    data_yaml: str = "datasets/violence_dataset/data.yaml",
    model_name: str = "yolov8s.pt",
    epochs: int = 25,
    batch_size: int = 16,
    img_size: int = 640,
    lr: float = 0.01,
    device: str = "cpu"
):
    """
    Configurable YOLOv8s Training Pipeline script for Violence & Surveillance Detection.
    Reference configuration:
    - Model: YOLOv8s
    - Dataset: Roboflow Violence Dataset (2,834 Images: 1,969 train, 575 val, 290 test)
    - Epochs: 25
    - Batch Size: 16
    """
    logger.info("Initializing YOLOv8 Training...")
    logger.info(f"Model: {model_name} | Epochs: {epochs} | Batch Size: {batch_size} | ImgSize: {img_size}")

    if not os.path.exists(data_yaml):
        logger.warning(f"Dataset YAML '{data_yaml}' not found. Auto-generating sample dataset...")
        try:
            from datasets.violence_dataset.sample_data_generator import generate_sample_dataset
            generate_sample_dataset()
        except Exception as e:
            logger.error(f"Sample dataset generation failed: {e}")

    try:
        from ultralytics import YOLO
        model = YOLO(model_name)

        results = model.train(
            data=data_yaml,
            epochs=epochs,
            batch=batch_size,
            imgsz=img_size,
            lr0=lr,
            device=device,
            name="yolov8s_violence_run",
            project="runs/detect"
        )

        logger.info("YOLOv8 Training completed successfully. Best weights saved to runs/detect/yolov8s_violence_run/weights/best.pt")
        return results

    except Exception as e:
        logger.error(f"Training execution encountered error: {e}")
        logger.info("Tip: Ensure 'ultralytics' is installed and GPU/CPU resource is allocated.")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8 for Violence Detection")
    parser.add_argument("--data-yaml", type=str, default="datasets/violence_dataset/data.yaml")
    parser.add_argument("--model", type=str, default="yolov8s.pt")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--img-size", type=int, default=640)
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    train_yolo(
        data_yaml=args.data_yaml,
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        img_size=args.img_size,
        device=args.device
    )

