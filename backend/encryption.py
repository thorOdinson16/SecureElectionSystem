from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend
import base64
import hashlib

class VoteEncryption:
    @staticmethod
    def generate_keypair():
        """Generate RSA key pair for election"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        public_key = private_key.public_key()
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        return public_pem, private_pem
    
    @staticmethod
    def encrypt_vote(candidate_id: int, public_key_pem: str) -> tuple[str, str]:
        """Encrypt vote using RSA public key"""
        vote_data = str(candidate_id).encode('utf-8')
        
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
        
        encrypted = public_key.encrypt(
            vote_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')
        vote_hash = hashlib.sha256(encrypted).hexdigest()
        
        return encrypted_b64, vote_hash
    
    @staticmethod
    def decrypt_vote(encrypted_vote_b64: str, private_key_pem: str) -> int:
        """Decrypt vote using RSA private key"""
        encrypted_vote = base64.b64decode(encrypted_vote_b64)
        
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )
        
        decrypted = private_key.decrypt(
            encrypted_vote,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return int(decrypted.decode('utf-8'))

vote_encryption = VoteEncryption()