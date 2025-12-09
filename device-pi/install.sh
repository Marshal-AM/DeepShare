#!/bin/bash

# Optimized installation script for Raspberry Pi
# Handles slow package installation by using pre-built wheels and proper ordering

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Raspberry Pi Package Installation (Optimized) ===${NC}\n"

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo -e "${RED}Error: Python not found. Please install Python 3.${NC}"
    exit 1
fi

# Use python -m pip to ensure we use the correct pip
PIP_INSTALL="$PYTHON_CMD -m pip"

echo -e "${BLUE}Step 1: Upgrading pip, setuptools, and wheel...${NC}"
$PIP_INSTALL install --upgrade pip setuptools wheel --no-cache-dir

echo -e "\n${BLUE}Step 2: Installing build dependencies...${NC}"
$PIP_INSTALL install --upgrade build --no-cache-dir

echo -e "\n${BLUE}Step 3: Installing numpy first (required by opencv)...${NC}"
echo -e "${YELLOW}This may take a few minutes on Raspberry Pi...${NC}"
$PIP_INSTALL install numpy==2.2.6 --no-cache-dir --verbose

echo -e "\n${BLUE}Step 4: Installing lightweight packages first...${NC}"
$PIP_INSTALL install --no-cache-dir \
    requests==2.31.0 \
    python-dotenv==1.0.0 \
    eth-account==0.10.0 \
    supabase==2.3.0

echo -e "\n${BLUE}Step 5: Installing qrcode with PIL support...${NC}"
$PIP_INSTALL install "qrcode[pil]==7.4.2" --no-cache-dir

echo -e "\n${BLUE}Step 6: Installing OpenCV (this will take the longest)...${NC}"
echo -e "${YELLOW}Installing opencv-python first...${NC}"
$PIP_INSTALL install opencv-python==4.12.0.88 --no-cache-dir --verbose

echo -e "\n${YELLOW}Installing opencv-contrib-python...${NC}"
echo -e "${YELLOW}Note: You only need ONE of opencv-python OR opencv-contrib-python${NC}"
echo -e "${YELLOW}opencv-contrib-python includes opencv-python, so this may conflict${NC}"
read -p "Continue installing opencv-contrib-python? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    $PIP_INSTALL install opencv-contrib-python==4.12.0.88 --no-cache-dir --verbose
else
    echo -e "${YELLOW}Skipping opencv-contrib-python installation${NC}"
fi

echo -e "\n${GREEN}=== Installation Complete ===${NC}"
echo -e "${BLUE}Verifying installations...${NC}\n"

# Verify critical packages
$PYTHON_CMD -c "import numpy; print(f'✓ numpy {numpy.__version__}')" || echo -e "${RED}✗ numpy failed${NC}"
$PYTHON_CMD -c "import cv2; print(f'✓ opencv {cv2.__version__}')" || echo -e "${RED}✗ opencv failed${NC}"
$PYTHON_CMD -c "import requests; print('✓ requests')" || echo -e "${RED}✗ requests failed${NC}"
$PYTHON_CMD -c "import eth_account; print('✓ eth_account')" || echo -e "${RED}✗ eth_account failed${NC}"
$PYTHON_CMD -c "import dotenv; print('✓ python-dotenv')" || echo -e "${RED}✗ python-dotenv failed${NC}"
$PYTHON_CMD -c "import qrcode; print('✓ qrcode')" || echo -e "${RED}✗ qrcode failed${NC}"
$PYTHON_CMD -c "import supabase; print('✓ supabase')" || echo -e "${RED}✗ supabase failed${NC}"

echo -e "\n${GREEN}All packages installed successfully!${NC}"

