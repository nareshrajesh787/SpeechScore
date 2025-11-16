#!/usr/bin/env python3
"""
Helper script to convert Firebase credentials JSON file to a single-line string
for use in Railway environment variables.

Usage:
    python convert_firebase_creds.py path/to/firebase-credentials.json

Output: A single-line JSON string ready to paste into Railway's FIREBASE_CREDENTIALS_JSON variable
"""

import json
import sys
import os

def convert_to_single_line(json_file_path):
    """Read Firebase credentials JSON and convert to single-line string."""
    if not os.path.exists(json_file_path):
        print(f"Error: File not found: {json_file_path}")
        sys.exit(1)

    try:
        with open(json_file_path, 'r') as f:
            cred_dict = json.load(f)

        # Convert back to JSON string (single line, no extra spaces)
        single_line_json = json.dumps(cred_dict, separators=(',', ':'))

        print("\n" + "="*80)
        print("Copy this entire string and paste it into Railway's FIREBASE_CREDENTIALS_JSON variable:")
        print("="*80)
        print(single_line_json)
        print("="*80)
        print("\n✅ Ready to paste into Railway!")
        print("\nNote: Make sure to copy the ENTIRE string above (it's all one line)")

        return single_line_json

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert_firebase_creds.py <path-to-firebase-credentials.json>")
        print("\nExample:")
        print("  python convert_firebase_creds.py speechscore-4df8f-firebase-adminsdk-fbsvc-67747fe552.json")
        sys.exit(1)

    convert_to_single_line(sys.argv[1])
