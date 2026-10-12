// Webcam hand tracking with MediaPipe Hand Landmarker, running fully in the
// browser. Video frames never leave the device: there is no server.
//
// MediaPipe is only downloaded when the player picks camera mode, so keyboard
// and switch players never wait on a 10 MB model.

export const MEDIAPIPE_VERSION = '0.10.14';
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export async function createTracker(video, { onStatus = () => {} } = {}) {
  onStatus('Loading hand tracking model...');
  const vision = await import(/* @vite-ignore */ `${CDN}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${CDN}/wasm`);

  let landmarker;
  for (const delegate of ['GPU', 'CPU']) {
    try {
      landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      break;
    } catch (err) {
      if (delegate === 'CPU') throw err;
    }
  }

  onStatus('Asking for camera...');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: false,
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  onStatus('');

  let lastVideoTime = -1;
  let last = null;
  const timings = [];

  // Call once per animation frame. Returns the latest landmarks (or null when
  // no hand is visible) plus how long detection took, for the on-screen stats.
  function detect(nowMs) {
    if (video.currentTime === lastVideoTime) return last;
    lastVideoTime = video.currentTime;
    const t0 = performance.now();
    const result = landmarker.detectForVideo(video, nowMs);
    const ms = performance.now() - t0;
    timings.push(ms);
    if (timings.length > 60) timings.shift();
    last = {
      landmarks: result.landmarks && result.landmarks.length ? result.landmarks[0] : null,
      detectMs: timings.reduce((a, b) => a + b, 0) / timings.length,
    };
    return last;
  }

  function stop() {
    for (const track of stream.getTracks()) track.stop();
    video.srcObject = null;
    landmarker.close();
  }

  return { detect, stop };
}
