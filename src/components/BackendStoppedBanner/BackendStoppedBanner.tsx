/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { useEffect, useState } from "react";
import { BACKEND_HEALTH_URL } from "@/config/env";
import styles from "./BackendStoppedBanner.module.scss";

const CHECK_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;

type BackendAvailability = "unknown" | "available" | "unavailable";

async function checkBackendAvailability(signal: AbortSignal): Promise<boolean> {
  const timeoutController = new AbortController();
  const timeout = window.setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const abortOnParentSignal = () => timeoutController.abort();
  signal.addEventListener("abort", abortOnParentSignal, { once: true });

  try {
    const response = await fetch(BACKEND_HEALTH_URL, {
      cache: "no-store",
      signal: timeoutController.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener("abort", abortOnParentSignal);
  }
}

export function APIStoppedBanner() {
  const [availability, setAvailability] =
    useState<BackendAvailability>("unknown");

  useEffect(function monitorAPIAvailability() {
    const controller = new AbortController();
    let isMounted = true;

    const updateAvailability = async () => {
      const isAvailable = await checkBackendAvailability(controller.signal);
      if (isMounted) {
        setAvailability(isAvailable ? "available" : "unavailable");
      }
    };

    void updateAvailability();
    const interval = window.setInterval(updateAvailability, CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  if (availability !== "unavailable") return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      ⚠️ The server is currently stopped. Reach out to Aaron Cheng for
      assistance.
    </div>
  );
}
