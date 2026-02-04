import { useEffect, useRef, useState } from "react";
import type * as Contracts from "@twf/contracts";

type RoomPublicState = Contracts.RoomPublicState;

export type UsePhaseStartOverlayOpts = {
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
};

export type usePhaseStartOverlayProps = {
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
  } = opts;

  const [isOpen, setIsOpen] = useState(false);
  const [revealToken, setRevealToken] = useState(0);

  const prevPhaseRef = useRef<RoomPublicState["phase"] | null>(null);
  const prevReopenKeyRef = useRef<typeof reopenKey>(undefined);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (!closeTimeoutRef.current) return;
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }

  function open() {
    clearCloseTimer();
    setIsOpen(true);
    setRevealToken((t) => t + 1);

    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, openMs);
  }

  function close() {
    clearCloseTimer();
    setIsOpen(false);
  }

  useEffect(
    function handleEdgeOpen() {
      if (!state) {
        prevPhaseRef.current = null;
        prevReopenKeyRef.current = reopenKey;
        close();
        return;
      }

      const prevPhase = prevPhaseRef.current;
      const currPhase = state.phase;

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
        close();
        return;
      }

      if (!hasEnteredPhase && !isReopenKeyChanged) return;
      if (!shouldOpen?.()) return;

      open();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [state?.phase, reopenKey, !!state],
  );

  useEffect(function handleCleanupOnUnmount() {
    return () => {
      clearCloseTimer();
    };
  }, []);

  return { isOpen, token: revealToken, open, close };
}
