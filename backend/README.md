# i-Witness IPFS Service

FastAPI service for uploading captures to IPFS and storing CIDs in Supabase.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your credentials to `.env`:
- `PINATA_JWT` - Your Pinata JWT token
- `PINATA_GATEWAY` - Your Pinata gateway URL
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

4. Run the service:
```bash
python main.py
# Or
uvicorn main:app --host 0.0.0.0 --port 8000
```

The service will run on `http://localhost:8000`

## Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /upload-json` - Upload JSON data with base64 images to IPFS
  - `wallet_address` (form field)
  - `data` (form field - JSON string)

## Supabase Table

Make sure you have an `images` table with:
- `wallet_address` (VARCHAR)
- `CID` (VARCHAR)

