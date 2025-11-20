"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

type Theme = {
  id: string;
  name: string;
  skyTop: string;
  skyBottom: string;
  horizon: string;
  hillLight: string;
  hillDark: string;
  road: string;
  lane: string;
  accent: string;
};

const THEMES: Theme[] = [
  {
    id: "sunset-strip",
    name: "Sunset Strip",
    skyTop: "#ff758c",
    skyBottom: "#ff7eb3",
    horizon: "#ffd166",
    hillLight: "#d8829e",
    hillDark: "#a05f82",
    road: "#282b30",
    lane: "#f8f1ff",
    accent: "#ffd166",
  },
  {
    id: "ocean-drive",
    name: "Ocean Drive",
    skyTop: "#4facfe",
    skyBottom: "#00f2fe",
    horizon: "#6dd5ed",
    hillLight: "#5fc9f3",
    hillDark: "#3876b5",
    road: "#1c2c44",
    lane: "#b9f1ff",
    accent: "#f2a365",
  },
  {
    id: "midnight-city",
    name: "Midnight City",
    skyTop: "#0f2027",
    skyBottom: "#203a43",
    horizon: "#2c5364",
    hillLight: "#28353f",
    hillDark: "#1a252d",
    road: "#131c24",
    lane: "#6aa6c1",
    accent: "#e76f51",
  },
];

type StopHandles = {
  timeoutId: number | null;
  progressIntervalId: number | null;
};

const stopHandles: StopHandles = {
  timeoutId: null,
  progressIntervalId: null,
};

function mixChannel(value: number, luminosity: number) {
  if (luminosity < 0) {
    return Math.round(value * (1 + luminosity));
  }
  return Math.round(value + (255 - value) * luminosity);
}

function shadeColor(color: string, luminosity: number) {
  let hex = color.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length !== 6) {
    return color;
  }

  const numeric = parseInt(hex, 16);
  const r = (numeric >> 16) & 0xff;
  const g = (numeric >> 8) & 0xff;
  const b = numeric & 0xff;

  const nextR = mixChannel(r, luminosity);
  const nextG = mixChannel(g, luminosity);
  const nextB = mixChannel(b, luminosity);

  return `#${[nextR, nextG, nextB]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  time: number,
  theme: Theme,
) {
  const baseHeight = CANVAS_HEIGHT * 0.45;
  const parallax = time * 20;

  ctx.fillStyle = theme.hillDark;
  ctx.beginPath();
  ctx.moveTo(0, baseHeight);
  for (let x = 0; x <= CANVAS_WIDTH; x += 12) {
    const y =
      baseHeight +
      Math.sin((x + parallax) * 0.01) * 40 +
      Math.sin((x + parallax) * 0.005) * 25;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineTo(0, CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.hillLight;
  ctx.beginPath();
  ctx.moveTo(0, baseHeight + 30);
  for (let x = 0; x <= CANVAS_WIDTH; x += 8) {
    const y =
      baseHeight +
      30 +
      Math.sin((x + parallax * 1.2) * 0.011) * 25 +
      Math.cos((x + parallax * 0.9) * 0.004) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineTo(0, CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawRoad(ctx: CanvasRenderingContext2D, theme: Theme) {
  const roadTop = CANVAS_HEIGHT * 0.65;
  ctx.fillStyle = theme.road;
  ctx.fillRect(0, roadTop, CANVAS_WIDTH, CANVAS_HEIGHT - roadTop);

  const laneY = roadTop + 90;
  ctx.strokeStyle = theme.lane;
  ctx.lineWidth = 6;
  ctx.setLineDash([50, 40]);
  ctx.beginPath();
  ctx.moveTo(0, laneY);
  ctx.lineTo(CANVAS_WIDTH, laneY);
  ctx.stroke();
  ctx.setLineDash([]);

  const curbHeight = 12;
  ctx.fillStyle = shadeColor(theme.road, 0.2);
  ctx.fillRect(0, roadTop - curbHeight, CANVAS_WIDTH, curbHeight);
}

function drawHorizon(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  time: number,
) {
  const horizonY = CANVAS_HEIGHT * 0.52;

  // glow behind the hills
  const glowGradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    horizonY,
    30,
    CANVAS_WIDTH / 2,
    horizonY,
    CANVAS_WIDTH / 1.1,
  );
  glowGradient.addColorStop(0, `${theme.horizon}80`);
  glowGradient.addColorStop(1, `${theme.horizon}00`);
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, horizonY + 120);

  // stylized sun
  ctx.beginPath();
  const sunRadius = 55 + Math.sin(time * 0.5) * 5;
  ctx.fillStyle = `${theme.horizon}e6`;
  ctx.arc(CANVAS_WIDTH * 0.78, horizonY - 40, sunRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCityscape(
  ctx: CanvasRenderingContext2D,
  time: number,
  theme: Theme,
) {
  const skylineY = CANVAS_HEIGHT * 0.55;
  const baseSpeed = 30;
  const offset = (time * baseSpeed) % 120;

  const towers = [
    { width: 50, height: 140 },
    { width: 70, height: 200 },
    { width: 36, height: 110 },
    { width: 60, height: 170 },
    { width: 48, height: 130 },
  ];

  const palette = [theme.hillDark, theme.hillLight, shadeColor(theme.hillDark, 0.2)];

  for (let i = -1; i < 10; i += 1) {
    const tower = towers[i % towers.length];
    const x =
      i * 120 +
      (i % 2 === 0 ? 30 : 0) -
      offset +
      (Math.sin((i + time * 0.3) * 0.5) * 12);
    const y = skylineY - tower.height;
    ctx.fillStyle = palette[Math.abs(i) % palette.length];
    ctx.fillRect(x, y, tower.width, tower.height);

    // little windows
    ctx.fillStyle = `${theme.accent}50`;
    for (let row = 0; row < Math.floor(tower.height / 24); row += 1) {
      for (let col = 0; col < Math.floor(tower.width / 14); col += 1) {
        if ((row + col + i) % 2 === 0) {
          const winX = x + 6 + col * 14;
          const winY = y + 8 + row * 24;
          ctx.fillRect(winX, winY, 6, 14);
        }
      }
    }
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  time: number,
  carColor: string,
  accentColor: string,
  speed: number,
) {
  const roadTop = CANVAS_HEIGHT * 0.65;
  const carWidth = 220;
  const carHeight = 70;
  const wheelRadius = 26;
  const oscillation = Math.sin(time * 4) * 2;
  const cycle = CANVAS_WIDTH + carWidth + 180;
  const position = ((time * speed) % cycle) - carWidth - 90;
  const baseY = roadTop - carHeight - wheelRadius + oscillation;

  // motion blur trails
  const trailCount = 6;
  for (let i = 1; i <= trailCount; i += 1) {
    const trailOpacity = (trailCount - i) / (trailCount * 4);
    ctx.fillStyle = `${accentColor}${Math.round(trailOpacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    const trailX = position - i * (speed / 16);
    ctx.fillRect(trailX, baseY + carHeight * 0.5, carWidth * 0.6, 4);
  }

  // chassis shadow
  const shadowGradient = ctx.createRadialGradient(
    position + carWidth / 2,
    baseY + carHeight + wheelRadius,
    10,
    position + carWidth / 2,
    baseY + carHeight + wheelRadius,
    carWidth,
  );
  shadowGradient.addColorStop(0, "#00000080");
  shadowGradient.addColorStop(1, "#00000000");
  ctx.fillStyle = shadowGradient;
  ctx.fillRect(
    position - 20,
    baseY + carHeight + wheelRadius - 6,
    carWidth + 40,
    24,
  );

  // car body
  ctx.fillStyle = carColor;
  ctx.beginPath();
  ctx.moveTo(position, baseY + carHeight);
  ctx.lineTo(position + carWidth * 0.1, baseY + carHeight * 0.3);
  ctx.quadraticCurveTo(
    position + carWidth * 0.4,
    baseY - carHeight * 0.3,
    position + carWidth * 0.75,
    baseY - carHeight * 0.2,
  );
  ctx.lineTo(position + carWidth * 0.92, baseY + carHeight * 0.3);
  ctx.lineTo(position + carWidth, baseY + carHeight);
  ctx.closePath();
  ctx.fill();

  // body highlight
  ctx.fillStyle = shadeColor(carColor, 0.3);
  ctx.beginPath();
  ctx.moveTo(position + 20, baseY + carHeight * 0.4);
  ctx.quadraticCurveTo(
    position + carWidth * 0.5,
    baseY - carHeight * 0.35,
    position + carWidth * 0.85,
    baseY + carHeight * 0.15,
  );
  ctx.quadraticCurveTo(
    position + carWidth * 0.6,
    baseY + carHeight * 0.05,
    position + 20,
    baseY + carHeight * 0.45,
  );
  ctx.closePath();
  ctx.fill();

  // windows
  const windowGradient = ctx.createLinearGradient(
    position + carWidth * 0.2,
    baseY - carHeight * 0.1,
    position + carWidth * 0.75,
    baseY + carHeight * 0.3,
  );
  windowGradient.addColorStop(0, "#ffffffcc");
  windowGradient.addColorStop(1, "#b8e4facc");
  ctx.fillStyle = windowGradient;
  ctx.beginPath();
  ctx.moveTo(position + carWidth * 0.18, baseY + carHeight * 0.35);
  ctx.quadraticCurveTo(
    position + carWidth * 0.45,
    baseY - carHeight * 0.28,
    position + carWidth * 0.72,
    baseY - carHeight * 0.18,
  );
  ctx.lineTo(position + carWidth * 0.8, baseY + carHeight * 0.25);
  ctx.lineTo(position + carWidth * 0.3, baseY + carHeight * 0.45);
  ctx.closePath();
  ctx.fill();

  // window separator
  ctx.strokeStyle = shadeColor(carColor, -0.5);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(position + carWidth * 0.46, baseY - carHeight * 0.24);
  ctx.lineTo(position + carWidth * 0.36, baseY + carHeight * 0.45);
  ctx.stroke();

  // front light
  ctx.fillStyle = `${accentColor}d0`;
  ctx.beginPath();
  ctx.ellipse(
    position + carWidth - 12,
    baseY + carHeight * 0.7,
    18,
    12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // wheels
  const wheelPositions = [
    position + carWidth * 0.2,
    position + carWidth * 0.75,
  ];
  ctx.lineWidth = 4;
  wheelPositions.forEach((wheelX, index) => {
    const rotation = (time * speed * 0.08 + index * Math.PI) % (Math.PI * 2);
    ctx.fillStyle = "#1f2933";
    ctx.beginPath();
    ctx.arc(wheelX, baseY + carHeight + wheelRadius, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d9e2ec";
    ctx.beginPath();
    ctx.arc(
      wheelX,
      baseY + carHeight + wheelRadius,
      wheelRadius * 0.6,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    ctx.strokeStyle = "#9fb3c8";
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = rotation + (spoke * Math.PI * 2) / 6;
      const innerRadius = wheelRadius * 0.2;
      const outerRadius = wheelRadius * 0.9;
      ctx.beginPath();
      ctx.moveTo(
        wheelX + Math.cos(angle) * innerRadius,
        baseY + carHeight + wheelRadius + Math.sin(angle) * innerRadius,
      );
      ctx.lineTo(
        wheelX + Math.cos(angle) * outerRadius,
        baseY + carHeight + wheelRadius + Math.sin(angle) * outerRadius,
      );
      ctx.stroke();
    }
  });

  // signature accent stripe
  ctx.fillStyle = shadeColor(carColor, -0.25);
  ctx.fillRect(
    position + carWidth * 0.15,
    baseY + carHeight * 0.65,
    carWidth * 0.55,
    8,
  );
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  time: number,
  theme: Theme,
) {
  const cloudColor = `${theme.skyBottom}b0`;
  for (let i = 0; i < 5; i += 1) {
    const baseX =
      ((time * (10 + i * 5)) % (CANVAS_WIDTH + 200)) - 200 + i * 80;
    const baseY = 120 + Math.sin(time * 0.8 + i) * 20 + i * 5;
    ctx.fillStyle = cloudColor;

    ctx.beginPath();
    ctx.ellipse(baseX, baseY, 60, 28, 0, 0, Math.PI * 2);
    ctx.ellipse(baseX + 35, baseY - 10, 46, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(baseX - 40, baseY - 6, 40, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(baseX + 6, baseY + 14, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  seconds: number,
  theme: Theme,
  carColor: string,
  speed: number,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawHorizon(ctx, theme, seconds);
  drawCityscape(ctx, seconds, theme);
  drawMountains(ctx, seconds, theme);
  drawClouds(ctx, seconds, theme);
  drawRoad(ctx, theme);
  drawCar(ctx, seconds, carColor, theme.accent, speed);
}

export function CarVideoStudio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [duration, setDuration] = useState(8);
  const [speed, setSpeed] = useState(220);
  const [carColor, setCarColor] = useState("#ff4757");
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimestampRef = useRef<number>(0);

  const theme = useMemo(
    () => THEMES.find((candidate) => candidate.id === themeId) ?? THEMES[0],
    [themeId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;
    const render = (now: number) => {
      drawScene(context, now / 1000, theme, carColor, speed);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [theme, carColor, speed]);

  useEffect(() => {
    return () => {
      if (stopHandles.timeoutId !== null) {
        clearTimeout(stopHandles.timeoutId);
      }
      if (stopHandles.progressIntervalId !== null) {
        clearInterval(stopHandles.progressIntervalId);
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (recording) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError(
        "MediaRecorder is not supported in this browser. Please try Chrome or Firefox.",
      );
      return;
    }

    if (stopHandles.timeoutId !== null) {
      clearTimeout(stopHandles.timeoutId);
      stopHandles.timeoutId = null;
    }
    if (stopHandles.progressIntervalId !== null) {
      clearInterval(stopHandles.progressIntervalId);
      stopHandles.progressIntervalId = null;
    }

    setError(null);

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    const stream = canvas.captureStream(60);
    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const supportedMime =
      mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ??
      "video/webm";

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: supportedMime });
    } catch (caught) {
      console.error("Failed to create MediaRecorder", caught);
      setError("Unable to start recording. Check browser permissions.");
      return;
    }

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onerror = (event) => {
      console.error("Recording error", event.error);
      setError("Recording failed. Try again.");
    };
    recorder.onstop = () => {
      if (stopHandles.progressIntervalId !== null) {
        clearInterval(stopHandles.progressIntervalId);
        stopHandles.progressIntervalId = null;
      }
      setProgress(1);
      setRecording(false);
      const blob = new Blob(chunks, { type: supportedMime });
      if (blob.size === 0) {
        setError("Recording did not produce any data.");
        return;
      }
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      recorderRef.current = null;
    };

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    startTimestampRef.current = performance.now();
    setProgress(0);

    stopHandles.progressIntervalId = window.setInterval(() => {
      const elapsed = performance.now() - startTimestampRef.current;
      const ratio = Math.min(elapsed / (duration * 1000), 1);
      setProgress(ratio);
    }, 120);

    stopHandles.timeoutId = window.setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      stopHandles.timeoutId = null;
    }, duration * 1000);
  };

  const handleCancel = () => {
    if (!recorderRef.current) {
      return;
    }
    if (recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
    setProgress(0);
    if (stopHandles.timeoutId !== null) {
      clearTimeout(stopHandles.timeoutId);
      stopHandles.timeoutId = null;
    }
    if (stopHandles.progressIntervalId !== null) {
      clearInterval(stopHandles.progressIntervalId);
      stopHandles.progressIntervalId = null;
    }
  };

  return (
    <section className="flex w-full flex-col gap-8 rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl shadow-sky-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 md:flex-row">
      <div className="flex flex-1 flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/30 shadow-xl"
        />
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200/50 bg-white/70 p-4 dark:border-slate-700/40 dark:bg-slate-800/70">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
            <span>{recording ? "Rendering…" : "Preview"}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={recording}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span role="img" aria-label="video camera">
                🎬
              </span>
              {recording ? "Recording…" : "Generate Video"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={!recording}
              className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:text-slate-100"
            >
              Stop
            </button>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download="car-drive.webm"
                className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 dark:text-green-300"
              >
                <span role="img" aria-label="down arrow">
                  ⬇️
                </span>
                Download
              </a>
            ) : null}
          </div>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-sm font-medium text-red-500 dark:border-red-800/60 dark:bg-red-900/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-slate-200/60 bg-white/80 p-6 dark:border-slate-700/40 dark:bg-slate-900/80">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Director&apos;s Console
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Adjust the vibe, tune the speed, and paint your perfect ride before
            pressing record.
          </p>
        </header>
        <label className="flex flex-col gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Scene Theme
          </span>
          <select
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {THEMES.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Clip Duration</span>
            <span>{duration}s</span>
          </div>
          <input
            type="range"
            min={4}
            max={18}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-500 dark:bg-slate-700"
          />
        </label>
        <label className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Road Speed</span>
            <span>{speed} px/s</span>
          </div>
          <input
            type="range"
            min={120}
            max={360}
            step={10}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-500 dark:bg-slate-700"
          />
        </label>
        <label className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Car Color</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {carColor.toUpperCase()}
            </span>
          </div>
          <input
            type="color"
            value={carColor}
            onChange={(event) => setCarColor(event.target.value)}
            className="h-12 w-full cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-transparent p-1 dark:border-slate-600"
          />
        </label>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
          <p className="font-semibold">Tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Use 8-12 seconds for buttery smooth loops.</li>
            <li>Increase road speed for a high-energy chase feel.</li>
            <li>
              Pick contrasting car colors so highlights and details pop on
              screen.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
