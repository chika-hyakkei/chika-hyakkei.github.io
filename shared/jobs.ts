export const JOB_IDS = ["warrior", "thief", "priest", "mage", "knight", "sage", "samurai", "alchemist"] as const;
export type JobKey = typeof JOB_IDS[number];
export const isJobKey = (value: unknown): value is JobKey => typeof value === "string" && (JOB_IDS as readonly string[]).includes(value);
