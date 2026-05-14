/** Fired after the saved_job_ids cookie is updated so the header badge can sync. */
export const SAVED_JOBS_COOKIE_CHANGED = "24jobsalerts:saved-jobs-cookie-changed";

export function notifySavedJobsCookieChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SAVED_JOBS_COOKIE_CHANGED));
}
