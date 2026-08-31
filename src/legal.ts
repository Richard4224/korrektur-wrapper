export const OPERATOR_NAME = "Benedikt Richard Brickwell";
export const OPERATOR_EMAIL = "brickwellbenedikt@gmail.com";
export const LEGAL_STAND = "31. August 2026";

export type LegalPage = "impressum" | "datenschutz" | "nutzung";

export function legalPageFromHash(hash = ""): LegalPage | null {
  const id = hash.replace(/^#\/?/, "").split("?")[0]?.split("&")[0] ?? "";
  if (id === "impressum" || id === "datenschutz" || id === "nutzung") {
    return id;
  }
  return null;
}
