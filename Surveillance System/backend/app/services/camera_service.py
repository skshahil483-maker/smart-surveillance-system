import cv2
import os
import time
import asyncio
import logging
import threading
from typing import Generator
from sqlalchemy.orm import Session

from app.ai.pipeline import SurveillancePipeline
from app.websocket.manager import ws_manager

logger = logging.getLogger("surveillance.camera_service")

class ThreadedCamera:
    """
    High-performance asynchronous OpenCV camera capture thread.
    Eliminates frame buffer lag, camera latency, and video stuttering/shaking.
    Automatically reconnects webcam if USB connection drops.
    """
    def __init__(self, source):
        self.source = source
        self.cap = None
        self.grabbed = False
        self.frame = None
        self.started = False
        self.read_lock = threading.Lock()
        self.thread = None
        self.consecutive_failures = 0
        self._init_cap()

    def _init_cap(self):
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass

        source_val = int(self.source) if str(self.source).isdigit() else self.source
        if isinstance(source_val, int):
            # Try DSHOW, MSMF, and standard CAP_ANY across target index and fallback indices (0, 1)
            backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY] if os.name == 'nt' else [cv2.CAP_ANY]
            indices = [source_val] if source_val != 0 else [0, 1, 2]

            acquired = False
            for idx in indices:
                if acquired: break
                for backend in backends:
                    try:
                        cap_test = cv2.VideoCapture(idx, backend)
                        if cap_test.isOpened():
                            ret, test_frame = cap_test.read()
                            if ret and test_frame is not None:
                                self.cap = cap_test
                                acquired = True
                                logger.info(f"Webcam acquired successfully on index {idx} with backend {backend}")
                                break
                            else:
                                cap_test.release()
                    except Exception as e:
                        logger.debug(f"Webcam test index {idx} backend {backend} failed: {e}")

        else:
            source_str = str(source_val)
            if not source_str.startswith("http") and not source_str.startswith("rtsp"):
                curr_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                parent_dir = os.path.dirname(curr_dir)
                candidates = [
                    source_str,
                    os.path.join(parent_dir, source_str),
                    os.path.join(curr_dir, source_str),
                    os.path.abspath(source_str)
                ]
                for cand in candidates:
                    if os.path.exists(cand):
                        source_str = cand
                        break
            self.cap = cv2.VideoCapture(source_str)

        if self.cap is not None and self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            grabbed, frame = self.cap.read()
            if grabbed and frame is not None:
                with self.read_lock:
                    self.grabbed = True
                    self.frame = frame.copy()
                    self.consecutive_failures = 0

    def start(self):
        if self.started:
            return self
        self.started = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()
        return self

    def _update_loop(self):
        while self.started:
            if self.cap is None or not self.cap.isOpened():
                time.sleep(0.1)
                self._init_cap()
                continue

            grabbed, frame = self.cap.read()
            if grabbed and frame is not None:
                with self.read_lock:
                    self.grabbed = True
                    self.frame = frame.copy()
                    self.consecutive_failures = 0
            else:
                self.consecutive_failures += 1
                # If video file reached EOF, loop back to start frame and read frame 0 immediately
                if self.cap is not None and not str(self.source).isdigit():
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    grabbed_loop, frame_loop = self.cap.read()
                    if grabbed_loop and frame_loop is not None:
                        with self.read_lock:
                            self.grabbed = True
                            self.frame = frame_loop.copy()
                            self.consecutive_failures = 0
                        continue

                # Auto-reconnect if webcam drops 15 consecutive frames
                if self.consecutive_failures >= 15 and str(self.source).isdigit():
                    logger.warning("Webcam frame read dropped. Re-initializing camera capture...")
                    self._init_cap()

                time.sleep(0.01)

    def read(self):
        with self.read_lock:
            if self.frame is None:
                return False, None
            return True, self.frame.copy()

    def stop(self):
        self.started = False
        if self.thread is not None and self.thread.is_alive():
            self.thread.join(timeout=0.5)
        if self.cap is not None:
            self.cap.release()

class CameraManager:
    def __init__(self):
        self.pipeline = SurveillancePipeline(camera_id="CAM-01")
        self.pipeline.set_source("0", is_demo=True) # Default to Demo Mode or Webcam fallback
        self.active_camera_id = "CAM-01"
        self._event_loop = None  # Will be set on startup by main.py
        self._threaded_cams = {}  # Map source -> ThreadedCamera instance

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """Store reference to FastAPI's running event loop for thread-safe broadcast."""
        self._event_loop = loop

    def apply_settings(self, confidence_threshold: float, alert_cooldown: int, loitering_threshold: int,
                       weapon_detection_enabled: bool = True, weapon_confidence_threshold: float = 0.60,
                       weapon_confirmation_frames: int = 3):
        """Propagate Admin Panel settings changes to the live AI pipeline."""
        self.pipeline.detector.conf_thresh = confidence_threshold
        self.pipeline.suspicious_engine.conf_threshold = confidence_threshold
        self.pipeline.suspicious_engine.alert_cooldown = alert_cooldown
        self.pipeline.activity_recognizer.loitering_threshold = loitering_threshold
        self.pipeline.weapon_detection_enabled = weapon_detection_enabled
        self.pipeline.weapon_confidence_threshold = weapon_confidence_threshold
        self.pipeline.weapon_confirmation_frames = weapon_confirmation_frames
        self.pipeline.weapon_detector.conf_thresh = weapon_confidence_threshold
        logger.info(f"Settings applied: conf={confidence_threshold}, weapon_enabled={weapon_detection_enabled}, weapon_conf={weapon_confidence_threshold}, weapon_frames={weapon_confirmation_frames}")

    def get_latest_telemetry(self):
        # Generate dummy/synthetic frame if no feed
        frame = self.pipeline.generate_synthetic_frame()
        _, telemetry = self.pipeline.process_frame(frame)
        return telemetry

    def generate_mjpeg_stream(self, source: str = "0"):
        """
        Generator yielding MJPEG multipart frame bytes for browser video element.
        Supports multi-camera source streaming (Webcam, RTSP, Video File, or Demo).
        """
        is_demo = (source == "demo")

        if not is_demo:
            if source not in self._threaded_cams:
                self._threaded_cams[source] = ThreadedCamera(source).start()

        threaded_cam = self._threaded_cams.get(source)

        try:
            while True:
                frame = None
                if not is_demo and threaded_cam is not None:
                    ret, frame = threaded_cam.read()
                    if not ret or frame is None:
                        frame = self.pipeline.generate_synthetic_frame()
                else:
                    frame = self.pipeline.generate_synthetic_frame()

                annotated_frame, telemetry = self.pipeline.process_frame(frame)

                if annotated_frame is not None:
                    # Broadcast telemetry via WebSocket (thread-safe into FastAPI's event loop)
                    if self._event_loop and not self._event_loop.is_closed():
                        try:
                            asyncio.run_coroutine_threadsafe(
                                ws_manager.broadcast({
                                    "type": "telemetry",
                                    "data": telemetry
                                }),
                                self._event_loop
                            )
                        except RuntimeError:
                            pass  # Event loop may have shut down

                    ret, jpeg = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                    if ret:
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')
                
                time.sleep(0.033) # ~30 FPS smooth video stream
        except Exception as e:
            logger.error(f"Error in MJPEG stream generator for source {source}: {e}")
        finally:
            pass

camera_manager = CameraManager()
