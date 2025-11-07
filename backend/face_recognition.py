import cv2
import numpy as np
from mtcnn import MTCNN
from keras_facenet import FaceNet
import pickle
import os
from typing import Optional, Tuple
import base64
from PIL import Image
from io import BytesIO
import logging
import sys
import os
import tensorflow as tf

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'   # 0 = all, 1 = INFO, 2 = WARNING, 3 = ERROR
tf.get_logger().setLevel(logging.ERROR)

class FaceRecognitionSystem:
    def __init__(self):
        self.detector = MTCNN()
        self.embedder = FaceNet()
        self.encoding_dir = "face_encodings"
        os.makedirs(self.encoding_dir, exist_ok=True)
    
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """Decode base64 image string to numpy array"""
        img_data = base64.b64decode(base64_string.split(',')[1])
        img = Image.open(BytesIO(img_data))
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    
    def detect_face(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Detect face in image and return cropped face"""
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        faces = self.detector.detect_faces(rgb_image)
        
        if not faces:
            return None
        
        # Get the face with highest confidence
        face = max(faces, key=lambda x: x['confidence'])
        if face['confidence'] < 0.9:
            return None
        
        x, y, w, h = face['box']
        # Add padding
        padding = 20
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = w + 2 * padding
        h = h + 2 * padding
        
        face_img = rgb_image[y:y+h, x:x+w]
        return cv2.resize(face_img, (160, 160))
    
    def get_face_encoding(self, face_img: np.ndarray) -> np.ndarray:
        """Get face encoding using FaceNet"""
        face_img = np.expand_dims(face_img, axis=0)
        encoding = self.embedder.embeddings(face_img)
        return encoding[0]
    
    def register_face(self, voter_id: int, base64_image: str) -> Tuple[bool, str, Optional[bytes]]:
        """Register a new face encoding"""
        try:
            image = self.decode_base64_image(base64_image)
            face = self.detect_face(image)
            
            if face is None:
                return False, "No face detected or low confidence", None
            
            encoding = self.get_face_encoding(face)
            encoding_bytes = pickle.dumps(encoding)
            
            # Save encoding
            encoding_path = os.path.join(self.encoding_dir, f"voter_{voter_id}.pkl")
            with open(encoding_path, 'wb') as f:
                f.write(encoding_bytes)
            
            return True, "Face registered successfully", encoding_bytes
        
        except Exception as e:
            return False, f"Error: {str(e)}", None
    
    def verify_face(self, voter_id: int, base64_image: str, stored_encoding: bytes) -> Tuple[bool, str, float]:
        """Verify face against stored encoding"""
        try:
            image = self.decode_base64_image(base64_image)
            face = self.detect_face(image)
            
            if face is None:
                return False, "No face detected", 0.0
            
            current_encoding = self.get_face_encoding(face)
            stored_encoding_array = pickle.loads(stored_encoding)
            
            # Calculate cosine similarity
            similarity = np.dot(current_encoding, stored_encoding_array)
            similarity = similarity / (np.linalg.norm(current_encoding) * np.linalg.norm(stored_encoding_array))
            
            threshold = 0.6
            if similarity >= threshold:
                return True, "Face verified successfully", float(similarity)
            else:
                return False, "Face does not match", float(similarity)
        
        except Exception as e:
            return False, f"Error: {str(e)}", 0.0

face_recognition_system = FaceRecognitionSystem()