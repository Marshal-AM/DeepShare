#!/bin/bash

# Device Registration Script
# Generates wallet, fetches device details, and creates QR code with registration URL

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== DeepShare Device Registration ===${NC}\n"

# Check if Python is available (try python3 first, then python)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo -e "${YELLOW}Error: Python not found. Please install Python 3.${NC}"
    exit 1
fi

# Use python -m pip to ensure we use the correct pip
PIP_INSTALL="$PYTHON_CMD -m pip"

# Check if required Python packages are installed
echo -e "${BLUE}Checking dependencies...${NC}"
if ! $PYTHON_CMD -c "import eth_account" 2>/dev/null; then
    echo -e "${YELLOW}Installing required Python packages...${NC}"
    $PIP_INSTALL install eth-account --quiet || {
        echo -e "${YELLOW}Warning: Failed to install eth-account automatically.${NC}"
        echo -e "${YELLOW}Please install manually: $PIP_INSTALL install eth-account${NC}"
    }
fi

# Check if qrcode library is available
if ! $PYTHON_CMD -c "import qrcode" 2>/dev/null; then
    echo -e "${YELLOW}Installing qrcode library...${NC}"
    $PIP_INSTALL install "qrcode[pil]" --quiet || {
        echo -e "${YELLOW}Warning: Failed to install qrcode automatically.${NC}"
        echo -e "${YELLOW}Please install manually: $PIP_INSTALL install qrcode[pil]${NC}"
    }
fi

# Final check - exit if packages are still missing
if ! $PYTHON_CMD -c "import eth_account, qrcode" 2>/dev/null; then
    echo -e "${YELLOW}Error: Required packages are missing.${NC}"
    echo -e "${YELLOW}Please install manually:${NC}"
    echo -e "  $PIP_INSTALL install eth-account qrcode[pil]"
    exit 1
fi

# Generate wallet and get device details
echo -e "${BLUE}Generating wallet and fetching device details...${NC}"
REGISTRATION_DATA=$($PYTHON_CMD generate_wallet.py)

# Parse JSON output
WALLET_ADDRESS=$(echo "$REGISTRATION_DATA" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data['wallet']['address'])")
PRIVATE_KEY=$(echo "$REGISTRATION_DATA" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data['wallet']['private_key'])")
DEVICE_DETAILS=$(echo "$REGISTRATION_DATA" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data['device_details_formatted'])")

# URL encode device details for URL
DEVICE_DETAILS_ENCODED=$(echo "$DEVICE_DETAILS" | $PYTHON_CMD -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")

# Get the frontend URL (default to localhost, can be overridden)
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3002}"
REGISTRATION_URL="${FRONTEND_URL}/register?address=${WALLET_ADDRESS}&details=${DEVICE_DETAILS_ENCODED}"

echo -e "\n${GREEN}✓ Wallet generated successfully!${NC}"
echo -e "${BLUE}Wallet Address: ${GREEN}${WALLET_ADDRESS}${NC}"
echo -e "${BLUE}Registration URL: ${GREEN}${REGISTRATION_URL}${NC}\n"

# Prompt for IP licensing configuration
echo -e "${BLUE}=== IP Licensing Configuration ===${NC}"
echo -e "${YELLOW}Configure royalty settings for your captured images:${NC}\n"

# Prompt for minting fee
echo -e "${BLUE}Enter License Minting Fee (in IP tokens, e.g., 0.1):${NC}"
read -p "> " IP_MINTING_FEE
# Validate and set default if empty
if [ -z "$IP_MINTING_FEE" ]; then
    IP_MINTING_FEE="0.1"
    echo -e "${YELLOW}Using default: 0.1 IP tokens${NC}"
fi

# Prompt for revenue share
echo -e "\n${BLUE}Enter Commercial Revenue Share (percentage 0-100, e.g., 10):${NC}"
read -p "> " IP_REVENUE_SHARE
# Validate and set default if empty
if [ -z "$IP_REVENUE_SHARE" ]; then
    IP_REVENUE_SHARE="10"
    echo -e "${YELLOW}Using default: 10%${NC}"
fi

echo -e "\n${GREEN}✓ Royalty Settings Configured:${NC}"
echo -e "${BLUE}  - License Fee: ${GREEN}${IP_MINTING_FEE} IP tokens${NC}"
echo -e "${BLUE}  - Revenue Share: ${GREEN}${IP_REVENUE_SHARE}%${NC}\n"

# Save configuration to .env file
echo -e "${BLUE}Saving configuration to .env file...${NC}"

# Function to update or append to .env
update_env() {
    local key=$1
    local value=$2
    if [ -f .env ] && grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    touch .env
fi

# Save all configuration
update_env "PRIVATE_KEY" "${PRIVATE_KEY}"
update_env "WALLET_ADDRESS" "${WALLET_ADDRESS}"
update_env "IP_MINTING_FEE" "${IP_MINTING_FEE}"
update_env "IP_REVENUE_SHARE" "${IP_REVENUE_SHARE}"

echo -e "${GREEN}✓ Configuration saved to .env${NC}\n"

# Generate and display QR code in terminal
echo -e "${BLUE}Generating QR code...${NC}\n"
$PYTHON_CMD << EOF
import qrcode
import sys

url = "${REGISTRATION_URL}"
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=1,
    border=1,
)
qr.add_data(url)
qr.make(fit=True)

# Display QR code in terminal using ASCII
# Try to use terminal module if available, otherwise use simple ASCII
try:
    import qrcode.terminal
    qrcode.terminal.draw(qr)
except (ImportError, AttributeError):
    # Fallback: simple ASCII representation
    qr.print_ascii(invert=True)
EOF

echo -e "\n"

# Display device details
echo -e "${BLUE}Device Details:${NC}"
echo -e "${YELLOW}${DEVICE_DETAILS}${NC}\n"

echo -e "${GREEN}=== Registration Setup Complete ===${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Scan the QR code or visit: ${GREEN}${REGISTRATION_URL}${NC}"
echo -e "2. Review device details on the registration page"
echo -e "3. Click 'Submit' to register your device in Supabase"
echo -e "\n${YELLOW}⚠️  IMPORTANT: Keep your private key secure!${NC}"
echo -e "${YELLOW}   Configuration saved in: ${SCRIPT_DIR}/.env${NC}"
echo -e "\n${GREEN}💰 Your IP Licensing Settings:${NC}"
echo -e "${BLUE}   License Fee: ${IP_MINTING_FEE} IP tokens${NC}"
echo -e "${BLUE}   Revenue Share: ${IP_REVENUE_SHARE}%${NC}"
echo -e "${YELLOW}   These will apply to ALL captured images${NC}\n"

# Save wallet address to .env as well
if ! grep -q "^WALLET_ADDRESS=" .env; then
    echo "WALLET_ADDRESS=${WALLET_ADDRESS}" >> .env
    echo -e "${GREEN}✓ Wallet address saved to .env${NC}\n"
fi

# Hardcoded IPFS service URL (same as capture script)
IPFS_SERVICE_URL="http://localhost:8000"

# Check if IPFS service is accessible
echo -e "${BLUE}Checking IPFS service connection...${NC}"
if ! $PYTHON_CMD -c "import requests; requests.get('${IPFS_SERVICE_URL}/health', timeout=2)" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Warning: Cannot reach IPFS service at ${IPFS_SERVICE_URL}${NC}"
    echo -e "${YELLOW}   Make sure the FastAPI server is running!${NC}"
    echo -e "${YELLOW}   Start it with: cd ../ipfs-service && python main.py${NC}\n"
    echo -e "${YELLOW}   The IPFS service is REQUIRED for registration check and uploads.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ IPFS service is accessible${NC}\n"

# Install requests if needed for check_registration.py
$PYTHON_CMD -c "import requests" 2>/dev/null || {
    echo -e "${YELLOW}Installing requests library...${NC}"
    $PIP_INSTALL install requests --quiet
}

# Wait for device registration - REQUIRED
echo -e "${BLUE}Waiting for device registration...${NC}"
echo -e "${YELLOW}Device must be registered before capture can start.${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit (registration is required)${NC}\n"

# Poll for registration
MAX_ATTEMPTS=600  # 10 minutes (600 * 1 second)
ATTEMPT=0
REGISTERED=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Check if device is registered
    if $PYTHON_CMD check_registration.py "$WALLET_ADDRESS" 2>/dev/null; then
        REGISTERED=true
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
        echo -e "${YELLOW}Still waiting for registration... (${ATTEMPT}s elapsed)${NC}"
        echo -e "${BLUE}   Scan QR code or visit: ${REGISTRATION_URL}${NC}"
    fi
    sleep 1
done

if [ "$REGISTERED" = true ]; then
    echo -e "\n${GREEN}✓ Device registered successfully!${NC}"
    echo -e "${GREEN}✓ Proceeding to start capture script...${NC}\n"
else
    echo -e "\n${YELLOW}⚠ Timeout waiting for registration.${NC}"
    echo -e "${YELLOW}   Device registration is required before capture can start.${NC}"
    echo -e "${YELLOW}   Please register the device and run the script again.${NC}\n"
    exit 1
fi

# Check Story Protocol server
STORY_SERVER_URL="http://localhost:3003"
echo -e "${BLUE}Checking Story Protocol server connection...${NC}"
if $PYTHON_CMD -c "import requests; requests.get('${STORY_SERVER_URL}/health', timeout=2)" 2>/dev/null; then
    echo -e "${GREEN}✓ Story Protocol server is running at: ${STORY_SERVER_URL}${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Story Protocol server not accessible at ${STORY_SERVER_URL}${NC}"
    echo -e "${YELLOW}   Images will be captured but NOT registered as IP assets${NC}"
    echo -e "${YELLOW}   Start the server: cd ../story-server && npm start${NC}"
    read -p "Continue without IP registration? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Save Story server URL to .env
if ! grep -q "^STORY_SERVER_URL=" .env; then
    echo "STORY_SERVER_URL=${STORY_SERVER_URL}" >> .env
fi

# Hardcoded IPFS service URL
IPFS_SERVICE_URL="http://localhost:8000"

echo -e "${BLUE}Checking IPFS service connection...${NC}"
# Check if IPFS service is accessible
if $PYTHON_CMD -c "import requests; requests.get('${IPFS_SERVICE_URL}/health', timeout=2)" 2>/dev/null; then
    echo -e "${GREEN}✓ IPFS service is accessible at: ${IPFS_SERVICE_URL}${NC}\n"
else
    echo -e "${YELLOW}⚠ Warning: Cannot reach IPFS service at ${IPFS_SERVICE_URL}${NC}"
    echo -e "${YELLOW}   Make sure the FastAPI server is running!${NC}"
    echo -e "${YELLOW}   Start it with: cd ../ipfs-service && python main.py${NC}\n"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start the main capture script
echo -e "${BLUE}Starting main capture script...${NC}"
echo -e "${BLUE}Uploads will be sent to: ${IPFS_SERVICE_URL}${NC}\n"

# Check which capture script exists
if [ -f "depthmap.py" ]; then
    echo -e "${GREEN}Starting depthmap.py...${NC}\n"
    $PYTHON_CMD depthmap.py
elif [ -f "depthfinal4.py" ]; then
    echo -e "${GREEN}Starting depthfinal4.py...${NC}\n"
    $PYTHON_CMD depthfinal4.py
else
    echo -e "${YELLOW}Error: No capture script found (depthmap.py or depthfinal4.py)${NC}"
    exit 1
fi

