"""
ViralCommerce AI — Product Detection Engine
Uses YOLOv8 for object detection + CLIP for product embedding and matching.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from ultralytics import YOLO

log = logging.getLogger(__name__)


@dataclass
class DetectedProduct:
    """A product detected in a video frame."""
    label: str              # YOLO class label
    category: str           # Mapped product category
    confidence: float       # Detection confidence 0-1
    bbox: tuple[float, float, float, float]  # x, y, w, h (normalized)
    frame_timestamp: int    # Frame number in video
    embedding: list[float] = field(default_factory=list)  # CLIP embedding
    estimated_price_min: Optional[float] = None
    estimated_price_max: Optional[float] = None


# Category mapping from YOLO labels to product categories
YOLO_TO_PRODUCT_CATEGORY: dict[str, str] = {
    # Electronics
    "cell phone": "Electronics",
    "laptop": "Electronics",
    "keyboard": "Electronics",
    "mouse": "Electronics",
    "remote": "Electronics",
    "tv": "Electronics",
    # Beauty & Personal Care
    "bottle": "Beauty & Personal Care",
    # Home & Kitchen
    "cup": "Home & Kitchen",
    "bowl": "Home & Kitchen",
    "knife": "Home & Kitchen",
    "scissors": "Home & Kitchen",
    "vase": "Home & Kitchen",
    # Sports & Outdoors
    "sports ball": "Sports & Outdoors",
    "frisbee": "Sports & Outdoors",
    "skateboard": "Sports & Outdoors",
    "surfboard": "Sports & Outdoors",
    # Clothing & Accessories
    "handbag": "Clothing & Accessories",
    "tie": "Clothing & Accessories",
    "backpack": "Clothing & Accessories",
    "umbrella": "Clothing & Accessories",
    "suitcase": "Clothing & Accessories",
    # Toys & Games
    "teddy bear": "Toys & Games",
    "kite": "Toys & Games",
    # Default
    "book": "Books & Media",
    "clock": "Home & Kitchen",
    "chair": "Furniture",
    "couch": "Furniture",
    "bed": "Furniture",
    "potted plant": "Home & Kitchen",
}

PRICE_ESTIMATES: dict[str, tuple[float, float]] = {
    "Electronics": (15.0, 200.0),
    "Beauty & Personal Care": (5.0, 60.0),
    "Home & Kitchen": (8.0, 80.0),
    "Sports & Outdoors": (10.0, 150.0),
    "Clothing & Accessories": (5.0, 100.0),
    "Toys & Games": (8.0, 50.0),
    "Books & Media": (5.0, 30.0),
    "Furniture": (50.0, 500.0),
}


class ProductDetector:
    """
    Two-stage product detection:
    1. YOLOv8 detects objects in video frames
    2. CLIP embeds detected crops for similarity matching
    """

    def __init__(
        self,
        yolo_model_path: str = "yolov8n.pt",
        clip_model_name: str = "openai/clip-vit-base-patch32",
        confidence_threshold: float = 0.45,
        device: str | None = None,
    ):
        self.confidence_threshold = confidence_threshold
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        log.info(f"Loading YOLO model from {yolo_model_path}")
        self.yolo = YOLO(yolo_model_path)

        log.info(f"Loading CLIP model {clip_model_name}")
        self.clip_model = CLIPModel.from_pretrained(clip_model_name).to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained(clip_model_name)
        self.clip_model.eval()

        log.info(f"ProductDetector ready on {self.device}")

    def detect_in_frame(
        self,
        frame: np.ndarray,
        frame_number: int = 0,
    ) -> list[DetectedProduct]:
        """Detect and embed products in a single video frame."""
        results = self.yolo(frame, conf=self.confidence_threshold, verbose=False)
        detected = []

        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                label = result.names[class_id]
                confidence = float(box.conf[0])
                category = YOLO_TO_PRODUCT_CATEGORY.get(label, "General")

                # Normalized bbox
                h, w = frame.shape[:2]
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = (x1 / w, y1 / h, (x2 - x1) / w, (y2 - y1) / h)

                # Crop for CLIP embedding
                crop = frame[int(y1):int(y2), int(x1):int(x2)]
                embedding = []
                if crop.size > 0:
                    embedding = self._embed_crop(crop)

                price_range = PRICE_ESTIMATES.get(category, (5.0, 50.0))
                detected.append(DetectedProduct(
                    label=label,
                    category=category,
                    confidence=confidence,
                    bbox=bbox,
                    frame_timestamp=frame_number,
                    embedding=embedding,
                    estimated_price_min=price_range[0],
                    estimated_price_max=price_range[1],
                ))

        return detected

    def detect_in_video(
        self,
        video_path: str,
        sample_rate: int = 30,   # sample every N frames
        max_frames: int = 300,
    ) -> list[DetectedProduct]:
        """
        Scan a video file and detect products across sampled frames.
        Returns deduplicated product list.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        all_detected: list[DetectedProduct] = []
        frame_num = 0

        try:
            while frame_num < max_frames * sample_rate:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_num % sample_rate == 0:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    detected = self.detect_in_frame(frame_rgb, frame_num)
                    all_detected.extend(detected)
                frame_num += 1
        finally:
            cap.release()

        return self._deduplicate(all_detected)

    def detect_in_image(self, image_bytes: bytes) -> list[DetectedProduct]:
        """Detect products in a single image (e.g., thumbnail)."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        frame = np.array(img)
        return self.detect_in_frame(frame)

    def _embed_crop(self, crop: np.ndarray) -> list[float]:
        """Generate CLIP embedding for an image crop."""
        try:
            pil_img = Image.fromarray(crop)
            inputs = self.clip_processor(images=pil_img, return_tensors="pt").to(self.device)
            with torch.no_grad():
                embedding = self.clip_model.get_image_features(**inputs)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            return embedding[0].cpu().tolist()
        except Exception as e:
            log.warning(f"CLIP embedding failed: {e}")
            return []

    @staticmethod
    def _deduplicate(products: list[DetectedProduct]) -> list[DetectedProduct]:
        """
        Remove duplicate detections by label.
        Keep the highest confidence detection per label.
        """
        seen: dict[str, DetectedProduct] = {}
        for p in products:
            key = p.label
            if key not in seen or p.confidence > seen[key].confidence:
                seen[key] = p
        return list(seen.values())

    def embed_text_query(self, text: str) -> list[float]:
        """Embed a text query with CLIP for similarity search."""
        inputs = self.clip_processor(text=[text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            embedding = self.clip_model.get_text_features(**inputs)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
        return embedding[0].cpu().tolist()

    def similarity(self, emb1: list[float], emb2: list[float]) -> float:
        """Cosine similarity between two CLIP embeddings."""
        a = np.array(emb1)
        b = np.array(emb2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))
