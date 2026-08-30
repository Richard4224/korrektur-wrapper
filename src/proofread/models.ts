const STORAGE_KEY = "korrektur-wrapper-model";

export const MODEL_OPTIONS = [
  { id: "gpt-4o", label: "gpt-4o" },
  { id: "gpt-4o-mini", label: "gpt-4o-mini" },
  { id: "gpt-4.1", label: "gpt-4.1" },
  { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
  { id: "gpt-4.1-nano", label: "gpt-4.1-nano" },
  { id: "gpt-5", label: "gpt-5" },
  { id: "gpt-5-mini", label: "gpt-5-mini" },
  { id: "o4-mini", label: "o4-mini" },
] as const;

export const DEFAULT_MODEL = "gpt-4o";

export function sanitizeModel(value: string): string {
  const trimmed = value.trim();
  if (!/^[\w.-]{1,80}$/.test(trimmed)) return DEFAULT_MODEL;
  return trimmed;
}

export function loadModel(): string {
  try {
    return sanitizeModel(localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL);
  } catch {
    return DEFAULT_MODEL;
  }
}

export function saveModel(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, sanitizeModel(value));
  } catch {
    // ignore
  }
}
