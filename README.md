# BioMech: Real-Time Posture Analysis

Real-time human posture analysis using MediaPipe + OpenCV, with two usage modes:

- Desktop mode: local OpenCV window (`main.py`)
- Web mode: Flask camera API + Next.js dashboard frontend (`camera_api.py` + `frontend/`)

This README is written for someone cloning this project for the first time.

## 1. What You Need Before Running

Install these prerequisites on your device:

- Python: 3.10 to 3.12 recommended
- Node.js: 18.x or newer (LTS recommended)
- npm: comes with Node.js
- Webcam access (built-in or external USB camera)

Optional but recommended:

- Git
- A virtual environment for Python dependencies

## 2. Clone and Open the Project

```bash
git clone https://github.com/Kowshik-Kumar/Bio-Tech.git
cd Bio-Tech
```

If your folder name is already `biomech`, run commands from the project root (same folder containing `main.py`, `camera_api.py`, and `frontend/`).

## 3. Python Backend Setup

### 3.1 Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3.2 Install Python packages

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Installed backend dependencies:

- `opencv-python`
- `mediapipe==0.10.14`
- `numpy`
- `flask`

## 4. Frontend Setup (Next.js)

From project root:

```bash
cd frontend
npm install
```

Then return to root for backend commands when needed:

```bash
cd ..
```

## 5. Running the Project

You can run either mode independently, or run backend + frontend together for full web experience.

### Mode A: Desktop OpenCV Window

From project root:

```bash
python main.py
```

What it does:

- Opens webcam stream in a local window
- Draws posture landmarks and metrics
- Lets you calibrate baseline posture
- Saves output artifacts to `output/`

Keyboard controls:

- `c`: calibrate current posture as baseline
- `q`: quit session

### Mode B: Web Dashboard (recommended full-stack run)

Run these in two terminals.

Terminal 1 (project root): start camera API

```bash
python camera_api.py
```

This starts Flask on `http://127.0.0.1:8000`.

Terminal 2 (`frontend/`): start Next.js app

```bash
cd frontend
npm run dev
```

Open:

- `http://localhost:3000`

Navigate to any Live Analysis page to see stream + posture status.

## 6. Frontend Environment Variables (Optional)

Create `frontend/.env.local` only if you want non-default API/stream URLs.

```bash
NEXT_PUBLIC_CAMERA_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_CAMERA_STREAM_URL=http://127.0.0.1:8000/camera/feed
```

Defaults already point to localhost, so this step is optional.

## 7. API Endpoints (Flask)

When `camera_api.py` is running:

- `GET /camera/health`
	- Returns camera availability, calibration state, feedback
- `POST /camera/calibrate`
	- Stores current visible posture as baseline
- `POST /camera/calibration/stop`
	- Clears active calibration
- `GET /camera/feed`
	- MJPEG video stream used by frontend live view

Base URL: `http://127.0.0.1:8000`

## 8. Output Files

Session outputs are written to `output/`:

- `posture_YYYYMMDD_HHMMSS.mp4` (processed video)
- `metrics_YYYYMMDD_HHMMSS.csv` (posture metrics)

## 9. Project Structure

Top-level:

- `main.py`: desktop posture app loop (OpenCV window mode)
- `camera_api.py`: Flask service for web mode camera stream + controls
- `pose_detector.py`: MediaPipe pose processing and overlay drawing
- `angle_utils.py`: metric computations and smoothing helpers
- `requirements.txt`: Python dependencies
- `frontend/`: Next.js dashboard app

Frontend highlights:

- `frontend/app/`: routes/pages
- `frontend/components/`: reusable UI and live analysis widgets
- `frontend/lib/mockData.ts`: sample data for charts/session lists

## 10. Common Issues and Fixes

### Webcam not opening

- Close other apps using camera (Zoom/Meet/Teams/etc.)
- Grant OS camera permission to terminal/IDE
- Reconnect external webcam and retry

### `Cannot reach camera API` in frontend

- Confirm `camera_api.py` is running in another terminal
- Open `http://127.0.0.1:8000/camera/health` in browser
- Verify firewall is not blocking local port `8000`

### Frontend opens but no live stream

- Check `NEXT_PUBLIC_CAMERA_STREAM_URL`
- Confirm API feed endpoint works: `http://127.0.0.1:8000/camera/feed`
- Ensure backend terminal shows no runtime errors

### Python install errors

- Upgrade pip first: `pip install --upgrade pip`
- Ensure correct Python interpreter is active
- If needed, recreate `.venv` and reinstall requirements

### Node module issues

From `frontend/`:

```bash
rm -rf node_modules package-lock.json
npm install
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 11. Recommended First Run Checklist

1. Create and activate `.venv`
2. Install Python requirements
3. Install frontend npm packages
4. Start `camera_api.py`
5. Start `frontend` with `npm run dev`
6. Open `http://localhost:3000`
7. Go to live page and use `Calibrate` once your posture is stable

## 12. Development Notes

- This repository includes generated output files in local `output/`, but current ignore rules prevent future runtime artifacts from polluting commits.
- For day-to-day Git usage:

```bash
git add -A
git commit -m "your message"
git push
```

## 13. Rule-Based Sports Biomechanics Analyzer

The Sports module now includes a frontend-only, rule-based cricket analysis engine.

What it does:

- Takes normalized keypoints (`0` to `1`) as posture input
- Runs deterministic biomechanical checks (no machine learning training)
- Detects posture errors with expected ranges and severity
- Saves sessions to browser LocalStorage (no external database)
- Displays live feedback and session history in the UI

Routes:

- `/sports`: Sports landing page
- `/sports/live`: Cricket live analysis page with "Start Analysis"
- `/sports/sessions`: Session history panel from LocalStorage

Core frontend files:

- `frontend/lib/biomechanics/types.ts`
- `frontend/lib/biomechanics/utils.ts`
- `frontend/lib/biomechanics/rules.ts`
- `frontend/lib/biomechanics/engine.ts`
- `frontend/lib/biomechanics/storage.ts`
- `frontend/lib/biomechanics/sampleData.ts`

Implemented cricket rules:

- Elbow Angle (`shoulder-elbow-wrist`, error if `< 165 deg`)
- Front Knee Alignment (`right_knee_x` expected `0.50 - 0.53`)
- Cross-Base Alignment (foot line vs shoulder line)
- Lateral Flexion (spine tilt expected `<= 20 deg`)
- Hip-Shoulder Separation (`20 - 45 deg`, warning/error bands)

Utility functions included:

- `calculateAngle(A, B, C)`
- `calculateSlope(A, B)`
- `calculateBodyTilt(hip, neck)`
- `calculateAlignment(line1, line2)`

LocalStorage schema:

```json
{
	"sessions": [
		{
			"timestamp": "2026-04-06T19:00:00",
			"exercise": "cricket_bowling",
			"errors": [
				{
					"rule": "Front Knee Alignment",
					"value": 0.48,
					"expected": "0.50 - 0.53",
					"severity": "medium",
					"message": "Front knee misaligned"
				}
			]
		}
	]
}
```

Sample posture datasets for testing are provided in:

- `correctCricketPosture`
- `incorrectCricketPosture`

Both are available from `frontend/lib/biomechanics/sampleData.ts` and can be switched on `/sports/live` before running analysis.

## 14. Live Camera + MediaPipe Sports Mode

Sports live mode now runs fully in-browser camera capture and MediaPipe pose detection.

Flow:

- Open `/sports`
- Click Cricket
- Camera starts automatically on `/sports/live`
- Pose skeleton is drawn on canvas overlay
- Every 5th frame sends normalized keypoints to FastAPI `/analyze`
- Backend returns rule violations and UI updates live feedback and session history

Backend API file:

- `sports_api.py`

Run sports backend (FastAPI):

```powershell
./run_sports_backend.ps1
```

or:

```powershell
python -m uvicorn sports_api:app --host 0.0.0.0 --port 8001 --reload
```

Run frontend:

```powershell
cd frontend
npm run dev
```

Optional frontend env variable:

```bash
NEXT_PUBLIC_SPORTS_API_BASE=http://127.0.0.1:8001
```

