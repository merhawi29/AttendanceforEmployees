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

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceInfo() {
  return {
    deviceId: getDeviceId(),
    deviceName: `${getOS()} - ${getBrowser()}`,
    browser: getBrowser(),
    operatingSystem: getOS(),
    userAgent: navigator.userAgent,
  };
}

export function resetDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
