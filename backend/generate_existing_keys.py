from encryption import vote_encryption
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Generate RSA key pair
public_pem, private_pem = vote_encryption.generate_keypair()

# Connect to your database
conn = mysql.connector.connect(
    host="localhost",
    user="root",                
    password=os.getenv("DB_PASSWORD"),   
    database="secureelectiondb"
)
cursor = conn.cursor()

# Update the existing election (replace 1 with your actual electionId)
cursor.execute("""
    UPDATE election
    SET publicKeyPem = %s, privateKeyPem = %s
    WHERE electionId = 1
""", (public_pem, private_pem))

conn.commit()
cursor.close()
conn.close()

print("✅ Keys generated and added to the existing election!")