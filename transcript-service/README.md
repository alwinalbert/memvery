# YouTube Transcript Service

A Python Flask microservice that fetches YouTube video transcripts using yt-dlp.

## Why This Service?

YouTube's API and Node.js libraries often get blocked. This Python service uses `yt-dlp` (actively maintained YouTube downloader) which reliably bypasses these restrictions.

## Setup

### 1. Install Python Dependencies

```bash
cd transcript-service
pip install -r requirements.txt
```

Or if using Python 3:
```bash
pip3 install -r requirements.txt
```

### 2. Run the Service

```bash
python app.py
```

Or:
```bash
python3 app.py
```

The service will start on **http://localhost:8000**

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "transcript-service"
}
```

### Get Transcript
```
POST /transcript
```

Request Body:
```json
{
  "url": "https://www.youtube.com/watch?v=aircAruvnKk",
  "languages": ["en"]
}
```

Response:
```json
{
  "transcript": [
    {
      "text": "This is a 3.",
      "start": 4.22,
      "duration": 1.84
    },
    ...
  ],
  "title": "But what is a neural network? | Deep learning chapter 1",
  "channel": "3Blue1Brown",
  "duration": 1121
}
```

## Testing

### Test with curl:
```bash
curl -X POST http://localhost:8000/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=aircAruvnKk"}'
```

### Test health endpoint:
```bash
curl http://localhost:8000/health
```

## How It Works

1. Uses `yt-dlp` to extract video info and subtitles
2. Prefers `json3` subtitle format for best timestamp accuracy
3. Parses transcript segments with start time and duration
4. Returns structured data to Node.js backend

## Dependencies

- **Flask**: Web framework
- **flask-cors**: Enable CORS for cross-origin requests
- **yt-dlp**: YouTube video/transcript extractor (actively maintained fork of youtube-dl)

## Troubleshooting

### "No module named flask"
Run: `pip install -r requirements.txt`

### "No captions available"
The video doesn't have captions/subtitles

### Port 8000 already in use
Kill the process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill
```

## Integration

This service is called by the Node.js backend at `server/src/services/youtube.ts`:

```typescript
const response = await fetch('http://localhost:8000/transcript', {
  method: 'POST',
  body: JSON.stringify({ url: youtubeUrl })
});
```
