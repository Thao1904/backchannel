"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminSettings, CameraTrackingState } from "@/lib/chat-types";

declare global {
  interface Window {
    FaceMesh?: any;
    Hands?: any;
    Camera?: any;
  }
}

interface CameraTrackerProps {
  enabled?: boolean;
  settings: Pick<
    AdminSettings,
    | "cameraStateRenderMap"
    | "cameraOpenThreshold"
    | "cameraClosedThreshold"
    | "cameraOcclusionThreshold"
    | "cameraUncertainThreshold"
    | "cameraSensitivity"
  >;
  onCipherChange: (enabled: boolean) => void;
  onStateChange?: (state: CameraTrackingState) => void;
  className?: string;
}

const LEFT_EYE = { left: 33, right: 133, top: 159, bottom: 145 };
const RIGHT_EYE = { left: 362, right: 263, top: 386, bottom: 374 };
const LEFT_LID_PAIRS = [
  [159, 145],
  [158, 153],
  [160, 144],
];
const RIGHT_LID_PAIRS = [
  [386, 374],
  [385, 380],
  [387, 373],
];
const LEFT_IRIS_CENTER = 468;
const LEFT_IRIS_RING = [469, 470, 471, 472];
const RIGHT_IRIS_CENTER = 473;
const RIGHT_IRIS_RING = [474, 475, 476, 477];
const DEFAULT_OPEN_THRESHOLD = 0.275;
const DEFAULT_CLOSED_THRESHOLD = 0.055;
const OPEN_CONFIRM_MS = 250;
const CLOSED_CONFIRM_MS = 450;
const FACE_HOLD_MS = 900;
const IRIS_HOLD_MS = 250;
const SMOOTHING = 0.38;
const DEFAULT_OCCLUSION_THRESHOLD = 0.48;
const HANDS_EVERY_N_FRAMES = 2;
const DEFAULT_UNCERTAIN_IRIS_QUALITY = 0.62;

const STATE_TEXT: Record<CameraTrackingState, string> = {
  RED: "Open",
  GREEN: "Closed",
  YELLOW: "Uncertain",
  BLUE: "Occluded",
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function CameraTracker({
  enabled = true,
  settings,
  onCipherChange,
  onStateChange,
  className,
}: CameraTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  const latestHandsRef = useRef<any[]>([]);
  const smoothedLandmarksRef = useRef<any[] | null>(null);
  const lastKnownLandmarksRef = useRef<any[] | null>(null);
  const lastSeenAtRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastStableIrisRef = useRef<{
    left: any | null;
    right: any | null;
  }>({ left: null, right: null });
  const timersRef = useRef({ open: 0, closed: 0 });
  const [trackerState, setTrackerState] = useState<CameraTrackingState>("BLUE");
  const [statusText, setStatusText] = useState("Starting camera...");
  const frameCountRef = useRef(0);
  const trackerStateRef = useRef<CameraTrackingState>("BLUE");

  const sensitivity = Math.max(0.5, Math.min(1.5, settings.cameraSensitivity || 1));
  const openThreshold = Math.max(
    0.12,
    Math.min(0.5, settings.cameraOpenThreshold / sensitivity),
  );
  const closedThreshold = Math.max(
    0.01,
    Math.min(0.18, settings.cameraClosedThreshold * sensitivity),
  );
  const occlusionThreshold = Math.max(
    0.15,
    Math.min(0.85, settings.cameraOcclusionThreshold / sensitivity),
  );
  const uncertainThreshold = Math.max(
    0.2,
    Math.min(0.95, settings.cameraUncertainThreshold * (2 - sensitivity * 0.5)),
  );

  useEffect(() => {
    if (!enabled) {
      onCipherChange(false);
      onStateChange?.("GREEN");
      return;
    }

    onCipherChange(settings.cameraStateRenderMap[trackerState] === "cipher");
    onStateChange?.(trackerState);
  }, [enabled, onCipherChange, onStateChange, settings.cameraStateRenderMap, trackerState]);

  useEffect(() => {
    let active = true;

    function pointOf(landmark: { x: number; y: number }) {
      const canvas = canvasRef.current;
      return {
        x: (1 - landmark.x) * (canvas?.width ?? 1),
        y: landmark.y * (canvas?.height ?? 1),
      };
    }

    function handPointToCanvas(point: { x: number; y: number }) {
      const canvas = canvasRef.current;
      return {
        x: (1 - point.x) * (canvas?.width ?? 1),
        y: point.y * (canvas?.height ?? 1),
      };
    }

    function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function average(values: number[]) {
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    function drawBaseFrame() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function eyeRatio(landmarks: any[], eye: typeof LEFT_EYE) {
      const left = pointOf(landmarks[eye.left]);
      const right = pointOf(landmarks[eye.right]);
      const top = pointOf(landmarks[eye.top]);
      const bottom = pointOf(landmarks[eye.bottom]);
      const horizontal = dist(left, right);
      const vertical = dist(top, bottom);
      return horizontal === 0 ? 0 : vertical / horizontal;
    }

    function eyelidGapScore(
      landmarks: any[],
      eye: typeof LEFT_EYE,
      lidPairs: number[][],
    ) {
      const eyeWidth = dist(
        pointOf(landmarks[eye.left]),
        pointOf(landmarks[eye.right]),
      );
      const gaps = lidPairs.map(([topIndex, bottomIndex]) =>
        dist(pointOf(landmarks[topIndex]), pointOf(landmarks[bottomIndex])),
      );
      return eyeWidth === 0 ? 0 : average(gaps) / eyeWidth;
    }

    function smoothLandmarks(current: any[]) {
      const smoothedLandmarks = smoothedLandmarksRef.current;
      if (!smoothedLandmarks || smoothedLandmarks.length !== current.length) {
        smoothedLandmarksRef.current = current.map((landmark) => ({
          ...landmark,
        }));
        return smoothedLandmarksRef.current;
      }

      smoothedLandmarksRef.current = current.map((landmark, index) => {
        const previous = smoothedLandmarks[index];
        return {
          x: previous.x + (landmark.x - previous.x) * SMOOTHING,
          y: previous.y + (landmark.y - previous.y) * SMOOTHING,
          z: previous.z + (landmark.z - previous.z) * SMOOTHING,
        };
      });

      return smoothedLandmarksRef.current;
    }

    function irisGeometry(landmarks: any[], centerIndex: number, ringIndexes: number[]) {
      const center = pointOf(landmarks[centerIndex]);
      const ringPoints = ringIndexes.map((index) => pointOf(landmarks[index]));
      const radii = ringPoints.map((point) => dist(point, center));
      const radius = average(radii);

      return {
        center,
        radius,
        circularity:
          1 -
          Math.min(
            1,
            average(radii.map((value) => Math.abs(value - radius))) /
              Math.max(radius, 1),
          ),
      };
    }

    function irisIsReliable(iris: any, eyeWidth: number) {
      const minRadius = eyeWidth * 0.035;
      const maxRadius = eyeWidth * 0.4;
      return (
        iris.radius >= minRadius &&
        iris.radius <= maxRadius &&
        iris.circularity >= 0.12
      );
    }

    function resolveIris(
      side: "left" | "right",
      iris: any,
      reliable: boolean,
      now: number,
      allowRecovery = true,
    ) {
      if (reliable) {
        lastStableIrisRef.current[side] = {
          ...iris,
          center: { ...iris.center },
          seenAt: now,
        };
        return iris;
      }

      const cached = lastStableIrisRef.current[side];
      if (allowRecovery && cached && now - cached.seenAt <= IRIS_HOLD_MS) {
        return cached;
      }

      return iris;
    }

    function irisQuality(leftIris: any, rightIris: any) {
      const radiusBalance =
        1 -
        Math.min(
          1,
          Math.abs(leftIris.radius - rightIris.radius) /
            Math.max(Math.max(leftIris.radius, rightIris.radius), 1),
        );
      const circularity = (leftIris.circularity + rightIris.circularity) / 2;
      return Math.max(0, Math.min(1, circularity * 0.7 + radiusBalance * 0.3));
    }

    function faceBounds(landmarks: any[]) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const landmark of landmarks) {
        const point = pointOf(landmark);
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    function isReliableFace(landmarks: any[]) {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const bounds = faceBounds(landmarks);
      const areaRatio = (bounds.width * bounds.height) / (canvas.width * canvas.height);
      return areaRatio > 0.035 && bounds.width > 90 && bounds.height > 90;
    }

    function eyeCriticalPoints(
      landmarks: any[],
      eye: typeof LEFT_EYE,
      lidPairs: number[][],
      irisCenter: number,
    ) {
      const points = [
        pointOf(landmarks[eye.left]),
        pointOf(landmarks[eye.right]),
        pointOf(landmarks[eye.top]),
        pointOf(landmarks[eye.bottom]),
        pointOf(landmarks[irisCenter]),
      ];

      lidPairs.forEach(([topIndex, bottomIndex]) => {
        points.push(pointOf(landmarks[topIndex]));
        points.push(pointOf(landmarks[bottomIndex]));
      });

      return points;
    }

    function computeHandOverlapWithEyes(hands: any[], landmarks: any[]) {
      const leftCritical = eyeCriticalPoints(
        landmarks,
        LEFT_EYE,
        LEFT_LID_PAIRS,
        LEFT_IRIS_CENTER,
      );
      const rightCritical = eyeCriticalPoints(
        landmarks,
        RIGHT_EYE,
        RIGHT_LID_PAIRS,
        RIGHT_IRIS_CENTER,
      );
      const leftRadius = Math.max(
        12,
        dist(
          pointOf(landmarks[LEFT_EYE.left]),
          pointOf(landmarks[LEFT_EYE.right]),
        ) * 0.18,
      );
      const rightRadius = Math.max(
        12,
        dist(
          pointOf(landmarks[RIGHT_EYE.left]),
          pointOf(landmarks[RIGHT_EYE.right]),
        ) * 0.18,
      );

      const perHand = hands.map((hand) => {
        let leftHits = 0;
        let rightHits = 0;
        for (const landmark of hand) {
          const point = handPointToCanvas(landmark);
          if (leftCritical.some((criticalPoint) => dist(point, criticalPoint) <= leftRadius)) {
            leftHits += 1;
          }
          if (rightCritical.some((criticalPoint) => dist(point, criticalPoint) <= rightRadius)) {
            rightHits += 1;
          }
        }
        return { leftHits, rightHits };
      });

      return perHand.some(
        (hand) =>
          hand.leftHits / 21 >= occlusionThreshold ||
          hand.rightHits / 21 >= occlusionThreshold,
      );
    }

    function updateState(nextState: CameraTrackingState, nextText: string) {
      if (!active) return;
      trackerStateRef.current = nextState;
      setTrackerState(nextState);
      setStatusText(nextText);
    }

    function updateTrackingState(landmarks: any[], deltaMs: number, faceRecovered = false) {
      const now = performance.now();
      const rawLeftIris = irisGeometry(landmarks, LEFT_IRIS_CENTER, LEFT_IRIS_RING);
      const rawRightIris = irisGeometry(
        landmarks,
        RIGHT_IRIS_CENTER,
        RIGHT_IRIS_RING,
      );
      const leftEyeWidth = dist(
        pointOf(landmarks[LEFT_EYE.left]),
        pointOf(landmarks[LEFT_EYE.right]),
      );
      const rightEyeWidth = dist(
        pointOf(landmarks[RIGHT_EYE.left]),
        pointOf(landmarks[RIGHT_EYE.right]),
      );
      const leftIris = resolveIris(
        "left",
        rawLeftIris,
        irisIsReliable(rawLeftIris, leftEyeWidth),
        now,
      );
      const rightIris = resolveIris(
        "right",
        rawRightIris,
        irisIsReliable(rawRightIris, rightEyeWidth),
        now,
      );

      if (!isReliableFace(landmarks)) {
        timersRef.current.open = 0;
        timersRef.current.closed = 0;
        updateState("BLUE", "Face occluded");
        return;
      }

      if (computeHandOverlapWithEyes(latestHandsRef.current, landmarks)) {
        timersRef.current.open = 0;
        timersRef.current.closed = 0;
        updateState("BLUE", "Hands near eyes");
        return;
      }

      const quality = irisQuality(leftIris, rightIris);
      const leftGap = eyelidGapScore(landmarks, LEFT_EYE, LEFT_LID_PAIRS);
      const rightGap = eyelidGapScore(landmarks, RIGHT_EYE, RIGHT_LID_PAIRS);
      const bothClosed =
        leftGap <= closedThreshold && rightGap <= closedThreshold;
      const eyeOpenScore =
        (eyeRatio(landmarks, LEFT_EYE) + eyeRatio(landmarks, RIGHT_EYE)) / 2;

      if (!bothClosed && quality < uncertainThreshold) {
        timersRef.current.open = 0;
        timersRef.current.closed = 0;
        updateState("YELLOW", faceRecovered ? "Face recovering" : "Signal weak");
        return;
      }

      if (eyeOpenScore >= openThreshold) {
        timersRef.current.open += deltaMs;
        timersRef.current.closed = 0;
      } else if (bothClosed || eyeOpenScore <= closedThreshold) {
        timersRef.current.closed += deltaMs;
        timersRef.current.open = 0;
      } else {
        timersRef.current.open *= 0.72;
        timersRef.current.closed *= 0.72;
      }

      if (timersRef.current.closed >= CLOSED_CONFIRM_MS) {
        updateState("GREEN", "Eyes closed");
        return;
      }

      if (timersRef.current.open >= OPEN_CONFIRM_MS) {
        updateState("RED", "Eyes open");
        return;
      }

      updateState("YELLOW", "Checking eyes");
    }

    function drawModeOverlay(mode: CameraTrackingState) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const colorMap: Record<CameraTrackingState, string> = {
        RED: "rgba(255, 60, 60, 0.85)",
        GREEN: "rgba(34, 197, 94, 0.85)",
        YELLOW: "rgba(245, 158, 11, 0.85)",
        BLUE: "rgba(59, 130, 246, 0.85)",
      };

      ctx.fillStyle = colorMap[mode];
      ctx.fillRect(12, 12, 132, 34);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 14px Helvetica Neue, Arial, sans-serif";
      ctx.fillText(mode, 24, 34);
    }

    async function initialize() {
      if (!enabled) {
        updateState("GREEN", "Readable mode");
        return;
      }

      try {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"),
        ]);

        if (!active || !videoRef.current || !canvasRef.current) return;

        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        videoRef.current.srcObject = streamRef.current;

        await new Promise<void>((resolve) => {
          if (!videoRef.current) {
            resolve();
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            resolve();
          };
        });

        const width = videoRef.current.videoWidth || 1280;
        const height = videoRef.current.videoHeight || 720;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        faceMeshRef.current = new window.FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        handsRef.current = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.4,
        });
        handsRef.current.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.35,
        });

        faceMeshRef.current.onResults((results: any) => {
          drawBaseFrame();
          const now = performance.now();
          const deltaMs = lastFrameTimeRef.current
            ? Math.min(80, now - lastFrameTimeRef.current)
            : 16;
          lastFrameTimeRef.current = now;

          const detected = results.multiFaceLandmarks?.[0];
          if (detected) {
            const smoothed = smoothLandmarks(detected);
            lastKnownLandmarksRef.current = smoothed.map((landmark: any) => ({
              ...landmark,
            }));
            lastSeenAtRef.current = now;
            updateTrackingState(smoothed, deltaMs, false);
            drawModeOverlay(trackerStateRef.current);
            return;
          }

          const recentlySeen =
            lastKnownLandmarksRef.current &&
            now - lastSeenAtRef.current <= FACE_HOLD_MS;
          if (recentlySeen && lastKnownLandmarksRef.current) {
            updateTrackingState(lastKnownLandmarksRef.current, deltaMs, true);
            drawModeOverlay(trackerStateRef.current);
            return;
          }

          smoothedLandmarksRef.current = null;
          lastKnownLandmarksRef.current = null;
          timersRef.current.open = 0;
          timersRef.current.closed = 0;
          updateState("BLUE", "No face");
          drawModeOverlay("BLUE");
        });

        handsRef.current.onResults((results: any) => {
          latestHandsRef.current = results.multiHandLandmarks || [];
        });

        cameraRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => {
            frameCountRef.current += 1;
            await faceMeshRef.current.send({ image: videoRef.current });
            if (frameCountRef.current % HANDS_EVERY_N_FRAMES === 0) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width,
          height,
        });

        await cameraRef.current.start();
        updateState("YELLOW", "Tracking");
      } catch {
        updateState("BLUE", "Camera blocked");
      }
    }

    void initialize();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      cameraRef.current?.stop?.();
    };
  }, [
    enabled,
    closedThreshold,
    occlusionThreshold,
    onCipherChange,
    openThreshold,
    uncertainThreshold,
  ]);


  return (
    <div
      className={`relative h-28 w-full overflow-hidden rounded-[1.35rem] border-[3px] border-[#262626] bg-black shadow-[4px_4px_0_0_rgba(0,0,0,0.18)] sm:h-32 ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
        {enabled
          ? `${statusText} · ${STATE_TEXT[trackerState]} · ${settings.cameraStateRenderMap[trackerState]}`
          : "Readable mode · tracking off · normal"}
      </div>
    </div>
  );
}
