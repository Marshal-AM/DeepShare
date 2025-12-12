#!/usr/bin/env python3
"""
Check if device is registered via IPFS service
"""
import sys
import os
import requests

# Hardcoded IPFS service URL
IPFS_SERVICE_URL = "https://deepsharebackend-739298578243.us-central1.run.app"

def check_device_registered(wallet_address, service_url):
    """
    Check if device with wallet_address is registered via FastAPI service
    Returns True if registered, False otherwise
    """
    try:
        url = f"{service_url}/check-registration/{wallet_address}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            is_registered = data.get("registered", False)
            # Debug output (only if not registered to avoid spam)
            if not is_registered:
                print(f"Device not registered yet. Response: {data}", file=sys.stderr)
            return is_registered
        else:
            print(f"Error checking registration: {response.status_code} - {response.text}", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"Error checking registration: {e}", file=sys.stderr)
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: check_registration.py <wallet_address>")
        sys.exit(1)
    
    wallet_address = sys.argv[1]
    is_registered = check_device_registered(wallet_address, IPFS_SERVICE_URL)
    
    # Exit with 0 if registered, 1 if not
    sys.exit(0 if is_registered else 1)

