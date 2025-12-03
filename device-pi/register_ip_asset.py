#!/usr/bin/env python3
"""
DeepShare - Register IP Asset on Story Protocol
Sends captured image CID and depth metadata to Story Protocol server
"""

import sys
import json
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def register_ip_asset(image_cid, depth_metadata_file, metadata_cid=None, minting_fee=None, commercial_rev_share=None):
    """
    Register captured image with depth metadata as IP asset
    
    Args:
        image_cid: IPFS CID of the captured image (original photo)
        depth_metadata_file: Path to depth metadata JSON file
        metadata_cid: IPFS CID of the full metadata JSON (includes depth data, signatures, etc.)
        minting_fee: License minting fee in IP tokens (e.g., "0.1")
        commercial_rev_share: Revenue share percentage (e.g., 10)
    """
    # Get configuration from .env
    story_server_url = os.getenv('STORY_SERVER_URL', 'http://localhost:3003')
    device_address = os.getenv('WALLET_ADDRESS')
    
    # Get user-configured royalty settings from .env (or use passed values)
    if minting_fee is None:
        minting_fee = os.getenv('IP_MINTING_FEE', '0.1')
    if commercial_rev_share is None:
        commercial_rev_share = int(os.getenv('IP_REVENUE_SHARE', '10'))
    
    if not device_address:
        print("❌ Error: WALLET_ADDRESS not found in .env")
        return False
    
    # Load depth metadata
    try:
        with open(depth_metadata_file, 'r') as f:
            depth_metadata = json.load(f)
    except Exception as e:
        print(f"❌ Error loading depth metadata: {e}")
        return False
    
    # Prepare request payload
    payload = {
        'imageCid': image_cid,
        'metadataCid': metadata_cid,  # IPFS CID of full metadata JSON with depth data
        'depthMetadata': depth_metadata,  # Fallback if metadataCid not available
        'deviceAddress': device_address,
        'mintingFee': minting_fee,
        'commercialRevShare': commercial_rev_share
    }
    
    print(f"\n>> Registering IP Asset on Story Protocol...")
    print(f"   Image CID: {image_cid}")
    if metadata_cid:
        print(f"   Metadata CID: {metadata_cid}")
    print(f"   Device: {device_address}")
    print(f"   Minting Fee: {minting_fee} IP tokens")
    print(f"   Revenue Share: {commercial_rev_share}%")
    
    try:
        # Send request to Story Protocol server
        response = requests.post(
            f'{story_server_url}/register-ip',
            json=payload,
            timeout=120  # IP registration can take time
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                data = result['data']
                print(f"\n[SUCCESS] IP Asset registered successfully!")
                print(f"   IP Asset ID: {data['ipId']}")
                print(f"   Token ID: {data['tokenId']}")
                print(f"   Transaction: {data['txHash']}")
                print(f"   NFT Contract: {data['nftContract']}")
                print(f"\n[EXPLORER] View on Explorer:")
                print(f"   {data['explorerUrl']}")
                
                # Save IP registration info
                output_file = depth_metadata_file.replace('depth_meta', 'ip_registration')
                with open(output_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                print(f"\n[SAVED] IP registration details saved to: {output_file}")
                return True
            else:
                print(f"[ERROR] Registration failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"[ERROR] HTTP Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] Cannot connect to Story Protocol server at {story_server_url}")
        print(f"   Make sure the server is running: cd story-server && npm start")
        return False
    except requests.exceptions.Timeout:
        print(f"[ERROR] Request timed out (IP registration takes 30-60 seconds)")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python register_ip_asset.py <image_cid> <depth_metadata_file> [metadata_cid] [minting_fee] [revenue_share]")
        print("Example: python register_ip_asset.py QmaLRFE... depth_meta_1234.json bafkrei... 0.1 10")
        print("\nOptional arguments:")
        print("  metadata_cid: CID of full metadata JSON (from IPFS service)")
        print("  minting_fee: License fee in IP tokens (default from .env or 0.1)")
        print("  revenue_share: Revenue share % (default from .env or 10)")
        sys.exit(1)
    
    image_cid = sys.argv[1]
    depth_metadata_file = sys.argv[2]
    
    # Check if 3rd argument looks like a CID (starts with 'Qm' or 'baf') or a number
    metadata_cid = None
    minting_fee = None
    revenue_share = None
    
    if len(sys.argv) > 3:
        arg3 = sys.argv[3]
        # If it looks like a CID, use it as metadata_cid
        if arg3.startswith('Qm') or arg3.startswith('baf'):
            metadata_cid = arg3
            minting_fee = sys.argv[4] if len(sys.argv) > 4 else None
            revenue_share = int(sys.argv[5]) if len(sys.argv) > 5 else None
        else:
            # Otherwise it's minting_fee
            minting_fee = arg3
            revenue_share = int(sys.argv[4]) if len(sys.argv) > 4 else None
    
    success = register_ip_asset(image_cid, depth_metadata_file, metadata_cid, minting_fee, revenue_share)
    sys.exit(0 if success else 1)

