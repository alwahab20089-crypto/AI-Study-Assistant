import { GOAL_TYPES, GOAL_LIMITS } from "../constants/goalConstants.js";

/**
 * Validates a goal "type" against the fixed allow-list. Never accept
 * arbitrary goal types from the frontend (spec section 2).
 */
export const isValidGoalType = (type) => GOAL_TYPES.includes(type);

/**
 * Validates a goal "target" for the given type. Returns
 * { valid: true, value } or { valid: false, reason }.
 */
export const validateGoalTarget = (type, target) => {
  const limits = GOAL_LIMITS[type];

  if (!limits) {
    return { valid: false, reason: "Unknown goal type" };
  }

  const num = Number(target);

  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { valid: false, reason: "target must be a whole number" };
  }

  if (num <= 0) {
    return { valid: false, reason: "target must be a positive number" };
  }

  if (num < limits.min || num > limits.max) {
    return {
      valid: false,
      reason: `target must be between ${limits.min} and ${limits.max}`,
    };
  }

  return { valid: true, value: num };
};

/**
 * Parses a "YYYY-MM-DD" calendar date string into a UTC-midnight Date,
 * matching the date convention already used by progressService.js
 * (getWeeklyActivity's startOfUtcDay). Returns null if invalid.
 * If dateStr is omitted, defaults to today (UTC).
 */
export const parseCalendarDate = (dateStr) => {
  if (dateStr === undefined || dateStr === null || dateStr === "") {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }

  const d = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
};