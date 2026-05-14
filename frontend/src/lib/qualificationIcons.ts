/**
 * Material Symbols names (use with class `material-symbols-rounded`, FILL on in CSS).
 * Matches backend QUALIFICATION_BUCKETS keys in `backend/app/crud/jobs.py`.
 */
const QUALIFICATION_ICON_BY_LABEL: Record<string, string> = {
  "7th pass": "workspace_premium",
  "8th pass": "workspace_premium",
  "10th pass": "menu_book",
  "12th pass": "auto_stories",
  undergraduate: "workspace_premium",
  "postgraduate & research": "school",
  professional: "workspace_premium",
};

function iconFromHeuristics(q: string): string {
  if (q.includes("10th") || q.includes("matriculation") || q.includes("madhyamik")) return "menu_book";
  if (q.includes("12th") || q.includes("intermediate") || q.includes("10+2") || q.includes("higher secondary"))
    return "auto_stories";
  if (
    q.includes("post") ||
    q.includes(" pg") ||
    q.includes("pg ") ||
    q.includes("master") ||
    q.includes("ph.d") ||
    q.includes("phd") ||
    q.includes("m.sc") ||
    q.includes("msc")
  )
    return "school";
  if (q.includes("b.e") || q.includes("b.tech") || q.includes("engineering")) return "memory";
  if (q.includes("mbbs") || q.includes("medical") || q.includes("health")) return "health_and_safety";
  if (q.includes("iti") || q.includes("vocational")) return "construction";
  if (q.includes("diploma")) return "badge";
  if (q.includes("7th") || q.includes("8th")) return "workspace_premium";
  return "workspace_premium";
}

export function getQualificationIcon(qual: string): string {
  const key = qual.trim().toLowerCase();
  const mapped = QUALIFICATION_ICON_BY_LABEL[key];
  if (mapped) return mapped;
  return iconFromHeuristics(key);
}
