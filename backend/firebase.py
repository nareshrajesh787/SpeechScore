import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
# Try to use environment variable first (for production)
firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
cred = None

if firebase_creds_json and len(firebase_creds_json) > 10:  # Basic validation - JSON should be longer than 10 chars
    # Parse JSON string from environment variable
    try:
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
    except json.JSONDecodeError as e:
        print(f"Warning: FIREBASE_CREDENTIALS_JSON contains invalid JSON: {str(e)}")
        print("Falling back to file-based credentials...")
        cred = None  # Will fall through to file check below

# Fall back to file if JSON env var not set or invalid
if cred is None:
    cred_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "speechscore-4df8f-firebase-adminsdk-fbsvc-67747fe552.json")
    if os.path.exists(cred_file):
        print(f"Using Firebase credentials from file: {cred_file}")
        cred = credentials.Certificate(cred_file)
    else:
        error_msg = (
            "Firebase credentials not found.\n\n"
            "To fix this on Railway:\n"
            "1. Run locally: python backend/convert_firebase_creds.py backend/speechscore-4df8f-firebase-adminsdk-fbsvc-67747fe552.json\n"
            "2. Copy the output string\n"
            "3. In Railway, go to Variables and set:\n"
            "   Name: FIREBASE_CREDENTIALS_JSON\n"
            "   Value: <paste the entire string>\n\n"
            f"Current FIREBASE_CREDENTIALS_JSON status: {'empty or not set' if not firebase_creds_json else 'set but invalid JSON'}"
        )
        raise ValueError(error_msg)

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
