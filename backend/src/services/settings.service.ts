import prisma from "../config/database";

export interface SystemSettings {
  morningCheckInStart: string;
  morningCheckInEnd: string;
  lunchStartTime: string;
  lunchReturnDeadline: string;
  workEndTime: string;
  gracePeriodMinutes: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  morningCheckInStart: "08:30",
  morningCheckInEnd: "08:45",
  lunchStartTime: "12:30",
  lunchReturnDeadline: "13:30",
  workEndTime: "17:30",
  gracePeriodMinutes: 15,
};

let cachedSettings: SystemSettings | null = null;

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    if (cachedSettings) {
      return cachedSettings;
    }

    try {
      const dbSettings = await prisma.systemSetting.findMany();
      const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));

      cachedSettings = {
        morningCheckInStart: settingsMap.get("morningCheckInStart") || DEFAULT_SETTINGS.morningCheckInStart,
        morningCheckInEnd: settingsMap.get("morningCheckInEnd") || DEFAULT_SETTINGS.morningCheckInEnd,
        lunchStartTime: settingsMap.get("lunchStartTime") || DEFAULT_SETTINGS.lunchStartTime,
        lunchReturnDeadline: settingsMap.get("lunchReturnDeadline") || DEFAULT_SETTINGS.lunchReturnDeadline,
        workEndTime: settingsMap.get("workEndTime") || DEFAULT_SETTINGS.workEndTime,
        gracePeriodMinutes: parseInt(
          settingsMap.get("gracePeriodMinutes") || String(DEFAULT_SETTINGS.gracePeriodMinutes),
          10
        ),
      };
    } catch (error) {
      // Fallback to defaults if DB connection or query fails during start
      cachedSettings = { ...DEFAULT_SETTINGS };
    }

    return cachedSettings;
  },

  async updateSettings(data: SystemSettings): Promise<SystemSettings> {
    const keys = Object.keys(data) as Array<keyof SystemSettings>;

    for (const key of keys) {
      const val = String(data[key]);
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val },
      });
    }

    cachedSettings = { ...data };
    return cachedSettings;
  },

  getSettingsSync(): SystemSettings {
    return cachedSettings || DEFAULT_SETTINGS;
  },
};
