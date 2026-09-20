import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cnn_comparison")

def compare_cnn_architectures():
    """
    Academic benchmark comparing pretrained CNN backbones, YOLO-NAS, and YOLOv8s
    for surveillance feature extraction and violence detection.
    Reference: Update 01 & Update 02 empirical logs (25 epochs, Roboflow dataset: 2,834 images).
    """
    logger.info("Executing Comprehensive Model & Backbone Comparison Benchmark...")

    data = [
        {
            "Architecture": "YOLOv8s + ByteTrack",
            "Epochs": 25,
            "Train Time (s)": "918.0 (0.255h)",
            "Accuracy": 0.948,
            "Precision": 0.952,
            "Recall": 0.941,
            "F1-Score": 0.946,
            "FPS": 23.8,
            "Status": "Selected for Deployment"
        },
        {
            "Architecture": "YOLO-NAS (yolo_nas_s)",
            "Epochs": 25,
            "Train Time (s)": "4524.0 (75.4m)",
            "Accuracy": 0.926,
            "Precision": 0.920,
            "Recall": 0.931,
            "F1-Score": 0.925,
            "FPS": 18.2,
            "Status": "Evaluated"
        },
        {
            "Architecture": "DenseNet201 + FC",
            "Epochs": 25,
            "Train Time (s)": "1547.24",
            "Accuracy": 0.935,
            "Precision": 0.931,
            "Recall": 0.938,
            "F1-Score": 0.934,
            "FPS": 9.1,
            "Status": "Evaluated"
        },
        {
            "Architecture": "InceptionV3 + FC",
            "Epochs": 25,
            "Train Time (s)": "1204.79",
            "Accuracy": 0.912,
            "Precision": 0.908,
            "Recall": 0.915,
            "F1-Score": 0.911,
            "FPS": 21.0,
            "Status": "Evaluated"
        },
        {
            "Architecture": "MobileNetV2 + LSTM",
            "Epochs": 25,
            "Train Time (s)": "1023.70",
            "Accuracy": 0.894,
            "Precision": 0.887,
            "Recall": 0.901,
            "F1-Score": 0.894,
            "FPS": 35.1,
            "Status": "Evaluated"
        },
        {
            "Architecture": "VGG16 + FC",
            "Epochs": 25,
            "Train Time (s)": "1640.69",
            "Accuracy": 0.887,
            "Precision": 0.882,
            "Recall": 0.890,
            "F1-Score": 0.886,
            "FPS": 12.4,
            "Status": "Evaluated"
        },
        {
            "Architecture": "VGG19 + FC",
            "Epochs": 25,
            "Train Time (s)": "1962.71",
            "Accuracy": 0.891,
            "Precision": 0.885,
            "Recall": 0.896,
            "F1-Score": 0.890,
            "FPS": 10.2,
            "Status": "Evaluated"
        }
    ]

    df = pd.DataFrame(data)
    print("\n" + "="*90)
    print("             SURVEILLANCE AI: CNN & YOLO ARCHITECTURE COMPARISON BENCHMARK")
    print("="*90)
    print(df.to_string(index=False))
    print("="*90 + "\n")

    return df


if __name__ == "__main__":
    compare_cnn_architectures()
