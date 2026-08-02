#!/usr/bin/env python3
"""Interactive script to help set up Firebase credentials"""
import json
import os
import sys
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"

    print("=" * 80)
    print("Firebase Credentials Setup")
    print("=" * 80)
    print()

    # Check current .env file
    firebase_creds_json = None
    firebase_creds_file = None

    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith("FIREBASE_CREDENTIALS_JSON=") and not line.startswith("#"):
                    firebase_creds_json = line.split("=", 1)[1].strip()
                elif line.startswith("FIREBASE_CREDENTIALS_FILE=") and not line.startswith("#"):
                    firebase_creds_file = line.split("=", 1)[1].strip()

    # Validate existing credentials if present
    if firebase_creds_json:
        try:
            cred_dict = json.loads(firebase_creds_json)
            required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"]
            missing_fields = [field for field in required_fields if field not in cred_dict]

            if missing_fields:
                print(f"⚠️  Existing FIREBASE_CREDENTIALS_JSON is missing required fields: {', '.join(missing_fields)}")
                print()
            else:
                print("✅ Found valid FIREBASE_CREDENTIALS_JSON in .env file")
                print()
                return
        except json.JSONDecodeError:
            print("⚠️  Existing FIREBASE_CREDENTIALS_JSON contains invalid JSON")
            print()

    if firebase_creds_file and os.path.exists(firebase_creds_file):
        try:
            with open(firebase_creds_file, 'r') as f:
                cred_dict = json.load(f)
            required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"]
            missing_fields = [field for field in required_fields if field not in cred_dict]

            if missing_fields:
                print(f"⚠️  Credentials file is missing required fields: {', '.join(missing_fields)}")
                print()
            else:
                print(f"✅ Found valid credentials file: {firebase_creds_file}")
                print()
                return
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"⚠️  Error reading credentials file: {e}")
            print()

    # No valid credentials found - guide user
    print("No valid Firebase credentials found.")
    print()
    print("To set up Firebase credentials, you have two options:")
    print()
    print("OPTION 1: Use a credentials file (recommended for local development)")
    print("  1. Download your Firebase service account key from:")
    print("     https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk")
    print("  2. Save it to a file (e.g., firebase-credentials.json)")
    print("  3. Run this script with the file path:")
    print("     python backend/scripts/setup_firebase.py <path-to-credentials-file>")
    print()
    print("OPTION 2: Use JSON string (for production/deployment)")
    print("  1. Download your Firebase service account key")
    print("  2. Convert it using: python backend/scripts/convert_firebase_creds.py <path-to-file>")
    print("  3. Copy the output and add it to .env as FIREBASE_CREDENTIALS_JSON=...")
    print()

    # If file path provided as argument, process it
    if len(sys.argv) > 1:
        cred_file_path = sys.argv[1]

        if not os.path.exists(cred_file_path):
            print(f"❌ Error: File not found: {cred_file_path}")
            sys.exit(1)

        try:
            with open(cred_file_path, 'r') as f:
                cred_dict = json.load(f)

            required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri"]
            missing_fields = [field for field in required_fields if field not in cred_dict]

            if missing_fields:
                print(f"❌ Error: Credentials file is missing required fields: {', '.join(missing_fields)}")
                print("Please ensure you downloaded the complete service account key from Firebase Console.")
                sys.exit(1)

            # Ask user which method they prefer
            print(f"✅ Valid credentials file found: {cred_file_path}")
            print()
            print("How would you like to configure it?")
            print("  1. Use file path (FIREBASE_CREDENTIALS_FILE) - recommended for local dev")
            print("  2. Use JSON string (FIREBASE_CREDENTIALS_JSON) - recommended for production")
            print()
            choice = input("Enter choice (1 or 2): ").strip()

            if choice == "1":
                # Update .env with file path
                update_env_file(env_file, f"FIREBASE_CREDENTIALS_FILE={cred_file_path}", "FIREBASE_CREDENTIALS_JSON")
                print(f"✅ Updated .env file with FIREBASE_CREDENTIALS_FILE={cred_file_path}")
            elif choice == "2":
                # Convert to JSON string
                single_line_json = json.dumps(cred_dict, separators=(',', ':'))
                update_env_file(env_file, f"FIREBASE_CREDENTIALS_JSON={single_line_json}", "FIREBASE_CREDENTIALS_FILE")
                print("✅ Updated .env file with FIREBASE_CREDENTIALS_JSON")
            else:
                print("Invalid choice. Exiting.")
                sys.exit(1)

            print()
            print("✅ Firebase credentials configured successfully!")
            print("You can now start the backend server.")

        except json.JSONDecodeError as e:
            print(f"❌ Error: Invalid JSON file: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)
    else:
        print("💡 Tip: You can also run this script with a credentials file path:")
        print("     python backend/scripts/setup_firebase.py <path-to-firebase-credentials.json>")
        print()

def update_env_file(env_file, new_line, remove_key):
    """Update .env file with new Firebase credentials line"""
    lines = []
    if env_file.exists():
        with open(env_file, 'r') as f:
            lines = f.readlines()

    # Remove old Firebase credential lines
    lines = [line for line in lines if not line.strip().startswith(f"{remove_key}=") and not line.strip().startswith(f"FIREBASE_CREDENTIALS_JSON=") and not line.strip().startswith(f"FIREBASE_CREDENTIALS_FILE=")]

    # Add new line
    lines.append(new_line + "\n")

    with open(env_file, 'w') as f:
        f.writelines(lines)

if __name__ == "__main__":
    main()
