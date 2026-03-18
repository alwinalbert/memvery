"""
YouTube Transcript Service

A Flask microservice that fetches YouTube video transcripts using yt-dlp.
This service bypasses YouTube's API restrictions and provides reliable transcript fetching.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import json
import urllib.request

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'transcript-service'})

@app.route('/transcript', methods=['POST'])
def get_transcript():
    """
    Fetch YouTube video transcript

    Request body:
    {
        "url": "https://youtube.com/watch?v=...",
        "languages": ["en"]  # optional, defaults to ["en"]
    }

    Response:
    {
        "transcript": [
            {"text": "...", "start": 0.0, "duration": 2.5},
            ...
        ],
        "title": "Video Title",
        "channel": "Channel Name",
        "duration": 1234
    }
    """
    try:
        data = request.get_json()
        video_url = data.get('url')
        languages = data.get('languages', ['en'])

        if not video_url:
            return jsonify({'error': 'URL is required'}), 400

        print(f"🔍 Fetching transcript for: {video_url}")

        # Configure yt-dlp options
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': languages,
            'quiet': True,
            'no_warnings': True,
        }

        # Extract video info and subtitles
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)

            # Get video metadata
            title = info.get('title', 'Unknown')
            channel = info.get('channel', 'Unknown')
            duration = info.get('duration', 0)

            print(f"📺 Video: {title}")
            print(f"👤 Channel: {channel}")

            # Get subtitles
            subtitles = info.get('automatic_captions') or info.get('subtitles')

            if not subtitles:
                return jsonify({'error': 'No captions available for this video'}), 404

            # Get English subtitles (or first available language)
            lang_code = None
            for lang in languages:
                if lang in subtitles:
                    lang_code = lang
                    break

            if not lang_code:
                lang_code = list(subtitles.keys())[0]

            subs = subtitles[lang_code]

            # Find json3 format (best for timestamp accuracy)
            json3_sub = next((s for s in subs if s.get('ext') == 'json3'), None)

            if not json3_sub:
                # Fallback to first available format
                json3_sub = subs[0]

            # Download subtitle data
            print(f"📥 Downloading subtitles ({lang_code})...")
            response = urllib.request.urlopen(json3_sub['url'])
            subtitle_data = json.loads(response.read())

            # Parse transcript from json3 format
            events = subtitle_data.get('events', [])
            transcript = []

            for event in events:
                if 'segs' in event:
                    start_ms = event.get('tStartMs', 0)
                    duration_ms = event.get('dDurationMs', 0)

                    # Combine all text segments
                    text = ''.join([seg.get('utf8', '') for seg in event.get('segs', [])])

                    if text.strip():
                        transcript.append({
                            'text': text.strip(),
                            'start': start_ms / 1000,  # Convert to seconds
                            'duration': duration_ms / 1000 if duration_ms else 0
                        })

            print(f"✅ Extracted {len(transcript)} transcript segments")

            return jsonify({
                'transcript': transcript,
                'title': title,
                'channel': channel,
                'duration': duration
            })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 YouTube Transcript Service")
    print("📡 Running on: http://127.0.0.1:8000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8000, debug=True)
