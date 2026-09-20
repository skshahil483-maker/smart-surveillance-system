import cv2
import numpy as np

class FeatureExtractor:
    """
    CNN feature extractor module for bounding box crops and frame motion sequences.
    Calculates spatial color/texture representations and motion optical vectors.

    TODO: This module is currently not integrated into the live pipeline.
    Integration requires a trained CNN+LSTM model. The ActivityRecognizer
    currently uses heuristic velocity/overlap analysis as a fallback.
    To integrate, call extract_crop_features() in pipeline.py and feed
    the output into a trained temporal classifier.
    """
    def __init__(self, feature_dim: int = 128):
        self.feature_dim = feature_dim

    def extract_crop_features(self, frame: np.ndarray, bbox: list) -> np.ndarray:
        """
        Extracts lightweight CNN-style features from person bounding box crop.
        """
        if frame is None or len(bbox) != 4:
            return np.zeros(self.feature_dim, dtype=np.float32)

        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        if x2 <= x1 or y2 <= y1:
            return np.zeros(self.feature_dim, dtype=np.float32)

        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return np.zeros(self.feature_dim, dtype=np.float32)

        # Resize to standard input shape
        resized = cv2.resize(crop, (32, 32))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        
        # Normalized mean and std per channel plus spatial gradient histogram
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        hist_h = cv2.calcHist([hsv], [0], None, [16], [0, 180])
        hist_s = cv2.calcHist([hsv], [1], None, [16], [0, 256])
        
        # Calculate Sobel gradients for edge/motion texture
        gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        mag, _ = cv2.cartToPolar(gx, gy)
        
        feat_vector = np.concatenate([
            hist_h.flatten() / 1000.0,
            hist_s.flatten() / 1000.0,
            mag.flatten()[:96] / 255.0
        ])
        
        if len(feat_vector) < self.feature_dim:
            feat_vector = np.pad(feat_vector, (0, self.feature_dim - len(feat_vector)))
        else:
            feat_vector = feat_vector[:self.feature_dim]

        return feat_vector.astype(np.float32)
