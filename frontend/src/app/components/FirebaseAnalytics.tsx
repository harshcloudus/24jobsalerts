"use client";

import { useEffect } from "react";

export default function FirebaseAnalytics() {
  useEffect(() => {
    import("@/lib/firebase").then(({ initFirebaseAnalytics }) => {
      initFirebaseAnalytics();
    });
  }, []);

  return null;
}
