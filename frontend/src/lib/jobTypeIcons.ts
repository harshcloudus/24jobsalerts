/**
 * Material Symbols names for job type / sector tiles.
 * Mirrors the heuristic previously inlined in app/job-types/page.tsx.
 */
export function getJobTypeIcon(type: string): string {
  const t = type.toLowerCase();

  if (
    t.includes("government job") &&
    !t.includes("airline") &&
    !t.includes("bank") &&
    !t.includes("forest") &&
    !t.includes("health") &&
    !t.includes("court") &&
    !t.includes("municipal") &&
    !t.includes("post") &&
    !t.includes("psc") &&
    !t.includes("police") &&
    !t.includes("railway")
  )
    return "account_balance";

  if (t.includes("private")) return "business_center";
  if (t.includes("airline") || t.includes("aviation")) return "flight";
  if (t.includes("bank")) return "account_balance_wallet";
  if (t.includes("forest")) return "park";
  if (t.includes("health")) return "health_and_safety";
  if (t.includes("high court") || t.includes("court")) return "gavel";
  if (t.includes("municipal") || t.includes("corporation")) return "location_city";
  if (t.includes("police")) return "local_police";
  if (t.includes("post office") || t.includes("postal")) return "mail";
  if (t.includes("psc") || t.includes("public service")) return "how_to_reg";
  if (t.includes("railway") || t.includes("rail")) return "train";
  if (t.includes("defence") || t.includes("army") || t.includes("military"))
    return "military_tech";
  if (t.includes("teaching") || t.includes("education") || t.includes("school"))
    return "school";
  if (t.includes("engineer") || t.includes("technical")) return "engineering";
  if (t.includes("it") || t.includes("software") || t.includes("tech"))
    return "computer";
  if (t.includes("science") || t.includes("research")) return "science";

  // Fallback: hash-based icon variety
  const fallbacks = ["work", "badge", "verified_user", "star", "groups"];
  const hash = t.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
}

export function sortJobTypes(types: string[]): string[] {
  return [...types].sort((a, b) => {
    const norm = (s: string) => s.toLowerCase().trim();
    const aNorm = norm(a);
    const bNorm = norm(b);
    const aScore =
      aNorm === "government job" ? 0 : aNorm === "private job" ? 1 : 2;
    const bScore =
      bNorm === "government job" ? 0 : bNorm === "private job" ? 1 : 2;
    if (aScore !== bScore) return aScore - bScore;
    return a.localeCompare(b);
  });
}
