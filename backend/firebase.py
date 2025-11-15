import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
# Try to use environment variable first (for production)
firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
if firebase_creds_json and firebase_creds_json.strip():
    # Parse JSON string from environment variable
    try:
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
    except json.JSONDecodeError as e:
        raise ValueError(f"FIREBASE_CREDENTIALS_JSON contains invalid JSON: {str(e)}. Please check your environment variable.")
else:
    # Fall back to file (for local development)
    cred_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "speechscore-4df8f-firebase-adminsdk-fbsvc-67747fe552.json")
    if os.path.exists(cred_file):
        cred = credentials.Certificate(cred_file)
    else:
        raise ValueError(
            "Firebase credentials not found. "
            "Set FIREBASE_CREDENTIALS_JSON (as a JSON string) or FIREBASE_CREDENTIALS_FILE (as a file path) environment variable. "
            f"Current FIREBASE_CREDENTIALS_JSON is: {'empty' if not firebase_creds_json else 'set but invalid'}"
        )

# Only initialize if not already initialized
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    id_token = authorization.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID Token")
