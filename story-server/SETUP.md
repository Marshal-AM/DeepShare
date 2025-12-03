# DeepShare Story Protocol Server Setup

## Quick Start

### 1. Install Dependencies
```bash
cd story-server
npm install
```

### 2. Configure Environment

Create `.env` file with your private key:

```bash
# Server's wallet private key (REQUIRED)
PRIVATE_KEY=7a425200e31e8409c27abbc9aaae49a94c314426ef2e569d3a33ffc289a34e76

# Server configuration
PORT=3003
RPC_URL=https://aeneid.storyrpc.io
CHAIN_ID=aeneid

# Default royalty settings (users can override)
DEFAULT_MINTING_FEE=0.1
DEFAULT_COMMERCIAL_REV_SHARE=10
```

### 3. Fund Your Wallet

**IMPORTANT**: Your server wallet needs IP tokens for gas fees!

**Wallet Address**: `0x2514844F312c02Ae3C9d4fEb40db4eC8830b6844`

**Get Testnet Tokens**:
1. Visit: https://faucet.story.foundation/
2. Enter your wallet address
3. Request tokens (you'll get ~10 IP tokens)

**Gas Costs**:
- Collection creation: ~0.037 IP (once)
- IP registration: ~0.037 IP (per image)
- Estimate: ~100 images per 10 IP tokens

### 4. Start Server
```bash
npm start
```

You should see:
```
✅ Story Protocol client initialized
   Server Wallet: 0x2514844F312c02Ae3C9d4fEb40db4eC8830b6844
   Balance: 4.7876 IP tokens

🚀 DeepShare IP Registration Server
   Port: 3003
   Network: aeneid
   RPC: https://aeneid.storyrpc.io
   Default License Fee: 0.1 IP tokens
   Default Revenue Share: 10%

✅ Server ready to register IP assets
```

## How It Works

### Server Architecture

```
┌────────────────────────────────┐
│   Story Server (.env)          │
│   PRIVATE_KEY                  │
│   IP Tokens: 4.8               │
│   Pays for ALL registrations   │
└────────────────────────────────┘
         │
         │ Creates IP assets for devices
         ▼
┌────────────────────────────────┐
│   Device (captures image)      │
│   Sends: CID + metadata        │
│   Sets: minting fee + %        │
│   NO private key needed        │
└────────────────────────────────┘
```

### What the Server Does

1. **Receives** image CID and depth metadata from device
2. **Creates** NFT collection (first time only)
3. **Registers** image as IP asset on Story Protocol
4. **Attaches** commercial license with user's royalty settings
5. **Returns** IP asset ID and blockchain proof

### What the Device Does

1. **Captures** image with depth data
2. **Uploads** to IPFS
3. **Sends** CID to server
4. **Sets** minting fee and revenue share
5. **Receives** IP asset proof

## API Usage

### Register IP Asset

**Endpoint**: `POST /register-ip`

**Request**:
```json
{
  "imageCid": "QmaLRFE54U2RiqmAa219bnaEzbv7XS7YAHTTk3QKTqQ6pr",
  "depthMetadata": {
    "shape": [480, 640],
    "min": 0.5,
    "max": 10.0,
    "mean": 3.2
  },
  "deviceAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "mintingFee": "0.2",
  "commercialRevShare": 15
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ipId": "0xF0A67d1776887077E6dcaE7FB6E292400B608678",
    "tokenId": "1",
    "licenseTermsIds": ["2460"],
    "txHash": "0x54d35b50694cd...",
    "nftContract": "0xBBE83B07463e5784BDd6d6569F3a8936127e3d69",
    "imageIpfsUrl": "ipfs://QmaLRFE...",
    "mintingFee": 0.2,
    "commercialRevShare": 15,
    "explorerUrl": "https://aeneid.explorer.story.foundation/ipa/0xF0A..."
  }
}
```

## Security Notes

### Private Key Management

⚠️ **CRITICAL**: The `PRIVATE_KEY` in server's `.env` pays for all registrations!

**Keep it secure**:
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit to GitHub
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ✅ Monitor wallet balance

### Production Deployment

For production, use environment variables instead of `.env`:

```bash
# Set in hosting environment (Heroku, AWS, etc.)
export PRIVATE_KEY=your_key_here
export RPC_URL=https://mainnet.storyrpc.io
export CHAIN_ID=mainnet
```

## Monitoring

### Check Balance
```bash
# Server shows balance on startup
# Or query manually
curl http://localhost:3003/health
```

### Refill Wallet

When balance is low:
1. **Testnet**: Use faucet again
2. **Mainnet**: Transfer IP tokens from exchange

## Troubleshooting

### "PRIVATE_KEY not found"
- Check `.env` file exists
- Verify `PRIVATE_KEY=...` line present
- No spaces around `=`

### "Insufficient funds for gas"
- Server wallet needs IP tokens
- Check balance on startup message
- Get tokens from faucet (testnet)

### "Cannot connect to Story Protocol"
- Check `RPC_URL` in `.env`
- Verify internet connection
- Try different RPC endpoint

## Development

### Run in dev mode with auto-reload:
```bash
npm run dev
```

### Test the API:
```bash
curl -X POST http://localhost:3003/register-ip \
  -H "Content-Type: application/json" \
  -d '{
    "imageCid": "QmTest...",
    "depthMetadata": {},
    "deviceAddress": "0x..."
  }'
```

## Production Checklist

- [ ] Server has sufficient IP tokens
- [ ] `.env` file secured (not in git)
- [ ] RPC_URL pointing to correct network
- [ ] Server running with process manager (PM2)
- [ ] Health monitoring enabled
- [ ] Balance alerts configured
- [ ] Backup of private key stored securely

## Support

For issues:
- Check server logs
- Verify wallet balance
- Test with Story Protocol explorer
- Review transaction hashes

