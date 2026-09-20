import os
import sys
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prepare_dataset")

ROBOFLOW_URL = "https://universe.roboflow.com/shah-xxxqs/violence-3h8pw"
KAGGLE_URL = "https://www.kaggle.com/datasets/mohamedmustafa/real-life-violence-situations-dataset"

def download_roboflow_dataset(api_key: str, dest_dir: str = "datasets/violence_dataset"):
    """
    Downloads the Roboflow Violence Detection dataset using the Roboflow SDK.
    Workspace: shah-xxxqs | Project: violence-3h8pw
    """
    try:
        from roboflow import Roboflow
        rf = Roboflow(api_key=api_key)
        project = rf.workspace("shah-xxxqs").project("violence-3h8pw")
        dataset = project.version(1).download("yolov8", location=dest_dir)
        logger.info(f"Successfully downloaded Roboflow dataset to {dest_dir}")
        return dataset
    except ImportError:
        logger.error("Roboflow package not installed. Run 'pip install roboflow'")
        return None
    except Exception as e:
        logger.error(f"Failed to download Roboflow dataset: {e}")
        return None

def print_dataset_summary():
    """
    Prints reference dataset statistics from academic benchmarks.
    """
    print("\n" + "="*70)
    print("        VIOLENCE DETECTION SURVEILLANCE DATASET SUMMARY")
    print("="*70)
    print(" 1. Roboflow Violence Dataset (Image Annotations for YOLOv8):")
    print(f"    - Source URL  : {ROBOFLOW_URL}")
    print("    - Total Images: 2,834")
    print("    - Training Set: 1,969 images (70%)")
    print("    - Valid Set   :   575 images (20%)")
    print("    - Test Set    :   290 images (10%)")
    print("    - Classes     : Non-Violence (0), Violence (1)")
    print("\n 2. Kaggle Real-Life Violence Situations (Video Benchmarks):")
    print(f"    - Source URL  : {KAGGLE_URL}")
    print("    - Total Videos: 2,000 videos")
    print("    - Violence    : 1,000 clips")
    print("    - Non-Violence: 1,000 clips")
    print("="*70 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare & Download Violence Detection Dataset")
    parser.add_argument("--api-key", type=str, help="Roboflow API Key to download dataset")
    parser.add_argument("--dest", type=str, default="datasets/violence_dataset", help="Target destination directory")
    args = parser.parse_args()

    print_dataset_summary()

    if args.api_key:
        download_roboflow_dataset(args.api_key, args.dest)
    else:
        logger.info("No --api-key provided. To generate sample local dataset for testing, run:")
        logger.info("  python datasets/violence_dataset/sample_data_generator.py")
