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
  morningCheckInStart: "06:30",
  morningCheckInEnd: "08:45",
  lunchStartTime: "12:30",
  lunchReturnDeadline: "13:30",
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
  if (count === 0) {
    for (const key of SETTING_KEYS) {
      const value =
        key === "gracePeriodMinutes"
          ? String(DEFAULT_SETTINGS.gracePeriodMinutes)
          : String(DEFAULT_SETTINGS[key]);

      await prisma.systemSetting.create({
        data: { key, value },
      });
    }
  } else {
    // Normalize and clean up legacy DB settings values
    const settingsList = await prisma.systemSetting.findMany();
    for (const s of settingsList) {
      if (s.key === "gracePeriodMinutes") continue;
      const normalized = normalizeTimeValue(s.value);
      let corrected = normalized;

      if (s.key === "morningCheckInStart" && (normalized === "07:30" || s.value.includes("07:30"))) {
        corrected = "06:30";
      } else if (s.key === "lunchStartTime" && (normalized === "00:30" || s.value.includes("12:30 AM"))) {
        corrected = "12:30";
      } else if (s.key === "lunchReturnDeadline" && (normalized === "14:30" || s.value.includes("14:30") || s.value.includes("2:30"))) {
        corrected = "13:30";
      } else if (s.key === "workEndTime" && (normalized === "05:30" || s.value.includes("5:30"))) {
        corrected = "17:30";
      }

      if (corrected !== s.value) {
        await prisma.systemSetting.update({
          where: { key: s.key },
          data: { value: corrected },
        });
      }
    }
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
