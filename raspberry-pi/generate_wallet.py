#!/usr/bin/env python3
"""
Generate Ethereum wallet and private key for device registration
"""
import json
import sys
from eth_account import Account
from eth_account.signers.local import LocalAccount

def generate_wallet():
    """Generate a new Ethereum wallet"""
    # Create a new account
    account: LocalAccount = Account.create()
    
    wallet_data = {
        'private_key': account.key.hex(),
        'address': account.address,
        'public_key': account.key.hex()  # For reference, though private key contains this
    }
    
    return wallet_data

def get_device_details():
    """Fetch Raspberry Pi device details"""
    import platform
    import subprocess
    import socket
    import os
    
    device_info = {}
    
    try:
        # System information
        device_info['hostname'] = socket.gethostname()
        device_info['platform'] = platform.platform()
        device_info['processor'] = platform.processor()
        device_info['machine'] = platform.machine()
        device_info['system'] = platform.system()
        device_info['release'] = platform.release()
        
        # CPU info
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
                for line in cpuinfo.split('\n'):
                    if 'Model' in line or 'model name' in line.lower():
                        device_info['cpu_model'] = line.split(':')[-1].strip()
                        break
        except:
            device_info['cpu_model'] = 'Unknown'
        
        # Memory info
        try:
            result = subprocess.run(['free', '-h'], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                if len(lines) > 1:
                    mem_line = lines[1].split()
                    if len(mem_line) > 1:
                        device_info['total_memory'] = mem_line[1]
        except:
            device_info['total_memory'] = 'Unknown'
        
        # Serial number (Raspberry Pi specific)
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
                for line in cpuinfo.split('\n'):
                    if 'Serial' in line:
                        device_info['serial'] = line.split(':')[-1].strip()
                        break
        except:
            device_info['serial'] = 'Unknown'
        
        # MAC address
        try:
            result = subprocess.run(['cat', '/sys/class/net/eth0/address'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                device_info['mac_address'] = result.stdout.strip()
            else:
                # Try wlan0
                result = subprocess.run(['cat', '/sys/class/net/wlan0/address'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    device_info['mac_address'] = result.stdout.strip()
                else:
                    device_info['mac_address'] = 'Unknown'
        except:
            device_info['mac_address'] = 'Unknown'
        
        # IP address
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            device_info['ip_address'] = s.getsockname()[0]
            s.close()
        except:
            device_info['ip_address'] = 'Unknown'
        
    except Exception as e:
        device_info['error'] = str(e)
    
    return device_info

if __name__ == '__main__':
    # Generate wallet
    wallet = generate_wallet()
    
    # Get device details
    device_details = get_device_details()
    
    # Format device details as newline-separated string
    device_details_str = '\n'.join([f"{k}: {v}" for k, v in device_details.items()])
    
    # Output JSON
    output = {
        'wallet': wallet,
        'device_details': device_details,
        'device_details_formatted': device_details_str
    }
    
    print(json.dumps(output, indent=2))

