import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomPublicState } from "@twf/contracts";

type UsePhaseStartOverlayOpts = {
  /** Phase that should edge-trigger the reveal (entering that phase). */
  openOnPhase: RoomPublicState["phase"];
  /**
   * Extra "edge trigger" key that can force re-open while staying in the same phase.
   * Example: currentTurnPlayerId changes while phase === "PLACE".
   */
  reopenKey?: string | number | null | undefined;

  /** How long the overlay stays open. */
  openMs: number;

  /**
   * If true, the hook will immediately close if the game leaves `openOnPhase`.
   * Usually true for phase-driven overlays.
   */
  closeIfPhaseMismatch?: boolean;

  /**
   * Optional guard: require these values to exist before opening.
   * Example: require currentItem for placement reveal.
   */
  shouldOpen?: () => boolean;

  /**
   * If true, do not open on the very first state seen by this hook.
   * Useful when joining mid-phase and you only want real phase transitions.
   */
  skipInitialOpen?: boolean;
};

type usePhaseStartOverlayProps = {
  isOpen: boolean;
  /** Bumps on every open; use in motion key to restart animations. */
  token: number;
  close: () => void;
  open: () => void;
};

export function usePhaseStartOverlay(
  state: RoomPublicState | null,
  opts: UsePhaseStartOverlayOpts,
): usePhaseStartOverlayProps {
  const {
    openOnPhase,
    reopenKey,
    openMs,
    closeIfPhaseMismatch = true,
    shouldOpen,
    skipInitialOpen = false,
  } = opts;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [revealToken, setRevealToken] = useState<number>(0);

  const prevPhaseRef = useRef<RoomPublicState["phase"] | null>(null);
  const prevReopenKeyRef = useRef<typeof reopenKey>(undefined);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (!closeTimeoutRef.current) return;
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const open = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
    setRevealToken((t) => t + 1);

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, openMs);
  }, [clearCloseTimer, openMs]);

  const close = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
  }, [clearCloseTimer]);

  useEffect(
    function handlePhaseEdgeTrigger() {
      if (!state) {
        prevPhaseRef.current = null;
        prevReopenKeyRef.current = reopenKey;
        clearCloseTimer();
        queueMicrotask(() => setIsOpen(false));
        return;
      }

      const prevPhase = prevPhaseRef.current;
      const currPhase = state.phase;

      const isInitial = prevPhase === null;

      if (skipInitialOpen && isInitial) {
        prevPhaseRef.current = currPhase;
        prevReopenKeyRef.current = reopenKey;

        if (closeIfPhaseMismatch && currPhase !== openOnPhase) {
          clearCloseTimer();
          queueMicrotask(() => setIsOpen(false));
        }

        return;
      }

      const hasEnteredPhase =
        prevPhase !== openOnPhase && currPhase === openOnPhase;

      const isReopenKeyChanged =
        currPhase === openOnPhase &&
        reopenKey !== undefined &&
        prevReopenKeyRef.current !== undefined &&
        prevReopenKeyRef.current !== reopenKey;

      prevPhaseRef.current = currPhase;
      prevReopenKeyRef.current = reopenKey;

      if (closeIfPhaseMismatch && currPhase !== openOnPhase) {
        clearCloseTimer();
        queueMicrotask(() => setIsOpen(false));
        return;
      }

      if (!hasEnteredPhase && !isReopenKeyChanged) return;
      if (!shouldOpen?.()) return;

      queueMicrotask(() => {
        clearCloseTimer();
        setIsOpen(true);
        setRevealToken((t) => t + 1);

        closeTimeoutRef.current = window.setTimeout(() => {
          setIsOpen(false);
        }, openMs);
      });
    },
    [
      state,
      openOnPhase,
      reopenKey,
      closeIfPhaseMismatch,
      shouldOpen,
      skipInitialOpen,
      clearCloseTimer,
      openMs,
    ],
  );

  useEffect(
    function cleanupOverlayTimer() {
      return () => {
        clearCloseTimer();
      };
    },
    [clearCloseTimer],
  );

  return { isOpen, token: revealToken, open, close };
}
