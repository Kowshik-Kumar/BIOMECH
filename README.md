# Real-Time Human Posture Detection

## Install

```bash
pip install -r requirements.txt
```

## Run (Desktop OpenCV Window)

```bash
python main.py
```

This starts the original local webcam window.

## Run (Frontend Live Camera Feed)

1. Start the Python camera API from project root:

```bash
python camera_api.py
```

2. Start Next.js frontend:

```bash
cd frontend
npm install
npm run dev
```

3. Open `http://localhost:3000` and go to a Live Analysis page.

The live component now consumes the MJPEG stream at `http://127.0.0.1:8000/camera/feed`.

Optional frontend environment overrides (`frontend/.env.local`):

```bash
NEXT_PUBLIC_CAMERA_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_CAMERA_STREAM_URL=http://127.0.0.1:8000/camera/feed
```

## Controls

- Press `c` to calibrate your current posture as ideal reference.
- Press `q` to quit.

For frontend mode, use the `Calibrate` button in the live camera panel.

## Project Structure

- `pose_detector.py`: MediaPipe Pose detection and skeleton drawing logic.
- `angle_utils.py`: Joint angle and alignment utility functions.
- `main.py`: Webcam loop, calibration (`c`), posture evaluation, and output recording.
- `camera_api.py`: Flask API that streams processed webcam frames to the frontend and exposes camera health/calibration endpoints.

## Outputs

- Processed video with posture overlays: saved in `output/`.
- Posture metrics CSV for later analysis: saved in `output/`.

## Phase 1 Notes

- Posture is evaluated against your calibrated baseline.
- If not calibrated, the app prompts you to press `c`.
