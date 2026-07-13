import prisma from "../config/database";
import { normalizeTimeValue } from "../utils/time-format";

export interface SystemSettings {
  morningCheckInStart: string;
  morningCheckInEnd: string;
  lunchStartTime: string;
  lunchReturnDeadline: string;
  workEndTime: string;
  gracePeriodMinutes: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  morningCheckInStart: "07:30",
  morningCheckInEnd: "08:45",
  lunchStartTime: "12:30",
  lunchReturnDeadline: "14:30",
  workEndTime: "17:30",
  gracePeriodMinutes: 15,
};

const SETTING_KEYS: Array<keyof SystemSettings> = [
  "morningCheckInStart",
  "morningCheckInEnd",
  "lunchStartTime",
  "lunchReturnDeadline",
  "workEndTime",
  "gracePeriodMinutes",
];

let cachedSettings: SystemSettings | null = null;

function normalizeSettings(data: Partial<SystemSettings>): SystemSettings {
  return {
    morningCheckInStart: normalizeTimeValue(
      data.morningCheckInStart || DEFAULT_SETTINGS.morningCheckInStart
    ),
    morningCheckInEnd: normalizeTimeValue(
      data.morningCheckInEnd || DEFAULT_SETTINGS.morningCheckInEnd
    ),
    lunchStartTime: normalizeTimeValue(data.lunchStartTime || DEFAULT_SETTINGS.lunchStartTime),
    lunchReturnDeadline: normalizeTimeValue(
      data.lunchReturnDeadline || DEFAULT_SETTINGS.lunchReturnDeadline
    ),
    workEndTime: normalizeTimeValue(data.workEndTime || DEFAULT_SETTINGS.workEndTime),
    gracePeriodMinutes: Number(data.gracePeriodMinutes ?? DEFAULT_SETTINGS.gracePeriodMinutes),
  };
}

async function ensureDefaultSettings(): Promise<void> {
  const count = await prisma.systemSetting.count();
  if (count > 0) {
    return;
  }

  for (const key of SETTING_KEYS) {
    const value =
      key === "gracePeriodMinutes"
        ? String(DEFAULT_SETTINGS.gracePeriodMinutes)
        : String(DEFAULT_SETTINGS[key]);

    await prisma.systemSetting.create({
      data: { key, value },
    });
  }
}

async function loadFromDb(): Promise<SystemSettings> {
  try {
    await ensureDefaultSettings();

    const dbSettings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));

    cachedSettings = normalizeSettings({
      morningCheckInStart: settingsMap.get("morningCheckInStart"),
      morningCheckInEnd: settingsMap.get("morningCheckInEnd"),
      lunchStartTime: settingsMap.get("lunchStartTime"),
      lunchReturnDeadline: settingsMap.get("lunchReturnDeadline"),
      workEndTime: settingsMap.get("workEndTime"),
      gracePeriodMinutes: parseInt(
        settingsMap.get("gracePeriodMinutes") || String(DEFAULT_SETTINGS.gracePeriodMinutes),
        10
      ),
    });
  } catch (error) {
    console.error("Failed to load settings from database:", error);
    cachedSettings = { ...DEFAULT_SETTINGS };
  }

  return cachedSettings;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    return loadFromDb();
  },

  async updateSettings(data: SystemSettings): Promise<SystemSettings> {
    const normalized = normalizeSettings(data);

    for (const key of SETTING_KEYS) {
      const val =
        key === "gracePeriodMinutes"
          ? String(normalized.gracePeriodMinutes)
          : String(normalized[key]);

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val },
      });
    }

    await prisma.systemSetting.upsert({
      where: { key: "settingsUpdatedAt" },
      update: { value: String(Date.now()) },
      create: { key: "settingsUpdatedAt", value: String(Date.now()) },
    });

    cachedSettings = null;
    return loadFromDb();
  },

  getSettingsSync(): SystemSettings {
    return cachedSettings || DEFAULT_SETTINGS;
  },
};
