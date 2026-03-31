# Real-Time Human Posture Detection (Sports + Rehab)

## Install

```bash
pip install opencv-python "mediapipe==0.10.14" numpy
```

## Run

```bash
python main.py
```

## Controls

- Press `c` to calibrate your current posture as ideal reference.
- Press `q` to quit.

## Project Structure

- `pose_detector.py`: MediaPipe Pose detection and skeleton/overlay drawing logic.
- `angle_utils.py`: Joint angle and alignment utility functions.
- `main.py`: Webcam loop, posture evaluation, feedback rendering, and recording.

## Outputs

- Processed video with posture overlays: saved in `output/`.
- Posture metrics CSV for later analysis: saved in `output/`.
