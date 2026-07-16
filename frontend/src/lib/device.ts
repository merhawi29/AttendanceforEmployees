const DEVICE_ID_KEY = "attendance_device_id";

function generateUUID(): string {
  return crypto.randomUUID();
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS")) return "iOS";
  return "Unknown";
}

function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334903);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("AttendanceFingerprint123!", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("AttendanceFingerprint123!", 4, 17);
    return canvas.toDataURL();
  } catch (e) {
    return "";
  }
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceInfo() {
  const canvasFp = getCanvasFingerprint();
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const screenWidth = window.screen.width || 0;
  const screenHeight = window.screen.height || 0;
  const colorDepth = window.screen.colorDepth || 0;
  const dpr = window.devicePixelRatio || 1;

  const ua = navigator.userAgent;
  const uaData = (navigator as any).userAgentData || null;

  let detectedType = "unknown";
  const hasAndroid = /Android/i.test(ua);
  const hasIPhone = /iPhone/i.test(ua);
  const hasIPad = /iPad/i.test(ua);
  const hasMobile = /Mobile/i.test(ua);
  const hasTablet = /Tablet/i.test(ua);
  const isIPadDesktopMode = platform === "MacIntel" && maxTouchPoints > 0;
  const isArmPlatform = platform.toLowerCase().includes("arm") || platform.toLowerCase().includes("aarch64");
  const minDim = Math.min(screenWidth, screenHeight);
  const hasSmallTouchScreen = minDim > 0 && minDim < 768 && maxTouchPoints > 0;

  if (hasIPhone || hasIPad || hasAndroid || isIPadDesktopMode) {
    detectedType = "mobile";
  } else if (hasTablet || hasSmallTouchScreen) {
    detectedType = "tablet";
  } else if (platform.startsWith("Win") || platform === "MacIntel" || platform.startsWith("Linux")) {
    detectedType = "desktop";
  }

  const payload = [
    ua,
    platform,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    colorDepth,
    dpr,
    canvasFp
  ].join("###");

  const deviceInfo = {
    deviceId: getDeviceId(),
    deviceName: `${getOS()} - ${getBrowser()}`,
    browser: getBrowser(),
    operatingSystem: getOS(),
    userAgent: navigator.userAgent,
    platform,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    fingerprint: cyrb53(payload),
  };

  console.group("[DeviceInfo] Detected device information");
  console.log("navigator.userAgent:", ua);
  console.log("navigator.userAgentData:", uaData ? JSON.parse(JSON.stringify(uaData)) : "not available");
  console.log("navigator.platform:", platform);
  console.log("navigator.maxTouchPoints:", maxTouchPoints);
  console.log("screen.width:", screenWidth);
  console.log("screen.height:", screenHeight);
  console.log("window.devicePixelRatio:", dpr);
  console.log("detected device type:", detectedType);
  console.log("payload sent to server:", deviceInfo);
  console.groupEnd();

  return deviceInfo;
}

export function resetDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
