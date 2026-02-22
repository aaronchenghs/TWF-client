import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import { normalizeCode } from "@/lib/stringNormalizers";
import { ROUTES } from "@/routes/routes";
import * as Contracts from "@twf/contracts";
import { TierBoard } from "./TierBoard/TierBoard";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { GameStatusCard } from "./GameStatusCard/GameStatusCard";
import { IS_DEBUG_ENABLED } from "@/config/env";
import clsx from "clsx";
import { CurrentItemDisplay } from "@/components/CurrentItemDisplay/CurrentItemDisplay";
import { ItemPlacementReveal } from "./Overlays/ItemPlacementReveal/ItemPlacementReveal";
import { SHOW_CURRENT_ITEM_PHASES } from "@/lib/tierItems";
import { PlayerTurnReveal } from "./Overlays/PlayerTurnReveal/PlayerTurnReveal";
import { VoteResultsReveal } from "./Overlays/VoteResultsReveal/VoteResultsReveal";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { getClientId, saveRoomSession } from "@/lib/session";
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";
import { PhaseCountdown } from "./PhaseCountdown/PhaseCountdown";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAppSelector, type AppState } from "@/store/store";
import { usePhaseClock } from "@/lib/hooks/usePhaseClock";
import {
  clearHostRoomState,
  markHostRoomStarted,
  readHostRoomCode,
} from "@/lib/roomClientState";

type RoomPublicState = Contracts.RoomPublicState;
type TierItemId = Contracts.TierItemId;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function GameRoom() {
  const navigate = useNavigate();
  const $isStreamerMode = useAppSelector(
    (state: AppState) => state.userSettings.isStreamerMode,
  );
  const roomCode = normalizeCode(readHostRoomCode());

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isRematchSubmitting, setIsRematchSubmitting] = useState(false);
  const [state, setState] = useState<RoomPublicState | null>(() =>
    roomSocket.getLastRoomState(roomCode),
  );
  const [isIntro, setIsIntro] = useState(true);
  const [phaseRingSize, setPhaseRingSize] = useState({ width: 0, height: 0 });

  const suppressRejoinNoticeRef = useRef(false);
  const phaseCardRef = useRef<HTMLElement | null>(null);

  const displayRoomCode = $isStreamerMode
    ? roomCode
      ? "****"
      : "--"
    : roomCode || "--";
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const isHostUnexpectedExitEligible = !!state && state.phase !== "FINISHED";
  const hasState = state != null;

  const currentItem = state?.currentItem
    ? {
        name:
          state.itemMetaById?.[state.currentItem]?.name ?? state.currentItem,
        imageSrc: state.itemMetaById?.[state.currentItem]?.imageSrc,
      }
    : null;

  const currentItemProgress = useMemo(() => {
    if (!state?.currentItem) return { index: null, total: null };

    const total = state.itemMetaById
      ? Object.keys(state.itemMetaById).length
      : null;
    if (!total) return { index: null, total: null };

    const placed = new Set<TierItemId>();
    Object.values(state.tiers ?? {}).forEach((items) => {
      items?.forEach((id) => placed.add(id));
    });

    const index = placed.size + (placed.has(state.currentItem) ? 0 : 1);

    return { index: Math.min(index, total), total };
  }, [state]);

  const currentItemLabel =
    currentItemProgress.index && currentItemProgress.total
      ? `CURRENT ITEM (${currentItemProgress.index}/${currentItemProgress.total}):`
      : "CURRENT ITEM:";

  const currentTurnPlayerId = state?.currentTurnPlayerId ?? null;
  const phaseClock = usePhaseClock(state, 50);

  const phaseRing = useMemo(() => {
    const inset = 4;
    const outerWidth = Math.max(0, phaseRingSize.width);
    const outerHeight = Math.max(0, phaseRingSize.height);
    const width = Math.max(0, outerWidth - inset * 2);
    const height = Math.max(0, outerHeight - inset * 2);
    const radius = Math.max(0, Math.min(14, width / 2, height / 2));

    const perimeter =
      width > 0 && height > 0
        ? 2 * (width + height - 4 * radius) + 2 * Math.PI * radius
        : 0;
    const dash = (phaseClock.progress01 ?? 0) * perimeter;
    const gap = perimeter * 2;

    const left = inset;
    const top = inset;
    const right = inset + width;
    const bottom = inset + height;
    const topCenterX = inset + width / 2;
    const topRightX = right - radius;
    const topLeftX = left + radius;
    const bottomRightY = bottom - radius;
    const topRightY = top + radius;
    const bottomLeftY = bottom - radius;
    const topLeftY = top + radius;
    const bottomLeftX = left + radius;
    const bottomRightX = right - radius;

    const d =
      width > 0 && height > 0
        ? `M ${topCenterX} ${top} ` +
          `H ${topRightX} ` +
          `A ${radius} ${radius} 0 0 1 ${right} ${topRightY} ` +
          `V ${bottomRightY} ` +
          `A ${radius} ${radius} 0 0 1 ${bottomRightX} ${bottom} ` +
          `H ${bottomLeftX} ` +
          `A ${radius} ${radius} 0 0 1 ${left} ${bottomLeftY} ` +
          `V ${topLeftY} ` +
          `A ${radius} ${radius} 0 0 1 ${topLeftX} ${top} ` +
          `H ${topCenterX}`
        : "";

    return {
      viewBox: `0 0 ${Math.max(outerWidth, 1)} ${Math.max(outerHeight, 1)}`,
      d,
      dashArray: `${dash} ${gap}`,
    };
  }, [phaseClock.progress01, phaseRingSize.height, phaseRingSize.width]);

  const handleExit = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomClosed = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((nextState: RoomPublicState) => {
    setState(nextState);
    if (nextState.phase !== "FINISHED") setIsRematchSubmitting(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (!state || state.phase !== "FINISHED") return;
    setIsRematchSubmitting(true);
    roomSocket.playAgain();
  }, [state]);

  useUnexpectedExitRejoinNotice({
    kind: "host_game",
    roomCode,
    isEligible: isHostUnexpectedExitEligible,
    suppressRef: suppressRejoinNoticeRef,
  });

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useEffect(function trackPhaseCardSize() {
    const element = phaseCardRef.current;
    if (!element) return;

    const readSize = () => {
      const rect = element.getBoundingClientRect();
      setPhaseRingSize((prev) => {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    readSize();

    const observer = new ResizeObserver(() => {
      readSize();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(
    function endIntroAfterFirstFrame() {
      if (!hasState) return;
      const raf = requestAnimationFrame(() => setIsIntro(false));
      return () => cancelAnimationFrame(raf);
    },
    [hasState],
  );

  useEffect(
    function persistStartedHostEvidence() {
      if (!state) return;
      if (!roomCode) return;
      if (state.phase === "LOBBY") return;
      markHostRoomStarted(roomCode);
    },
    [state, roomCode],
  );

  useEffect(
    function redirectHostToLobbyAfterRematchRestart() {
      if (!state) return;
      if (state.phase !== "LOBBY") return;
      if (!roomCode) return;
      navigate(ROUTES.HOST_LOBBY, { replace: true });
    },
    [navigate, roomCode, state],
  );

  useEffect(
    function ensureHostGameConnection() {
      if (!roomCode || !isRoomCodeValid) {
        handleRoomClosed();
        return;
      }

      const clientId = getClientId();
      let cancelled = false;

      roomSocket
        .joinRoomOrThrow({ code: roomCode, role: "host", clientId })
        .then(({ state: joinedState }) => {
          if (cancelled) return;
          saveRoomSession({ code: roomCode, role: "host" });
          markHostRoomStarted(roomCode);
          setState(joinedState);
        })
        .catch(() => {
          if (cancelled) return;
          handleRoomClosed();
        });

      return () => {
        cancelled = true;
      };
    },
    [roomCode, isRoomCodeValid, handleRoomClosed],
  );

  if (!state) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <MainTextTypography variant="h2">Game</MainTextTypography>
          <MainTextTypography variant="h5" muted>
            ROOM {displayRoomCode}
          </MainTextTypography>
        </header>

        <div className={styles.center}>
          <MainTextTypography variant="body" muted>
            Connecting
            <AnimatedDots />
          </MainTextTypography>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.root, isIntro && styles.intro)}>
      <main className={styles.main}>
        <section className={styles.boardSection}>
          <TierBoard state={state} />
        </section>

        <aside className={styles.sideSection}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <TWFLogo className={styles.logo} aria-hidden="true" />
            </div>

            <div className={styles.headerRight}>
              <AccentButton
                variant="secondary"
                onClick={() => setIsConfirmExitOpen(true)}
              >
                Exit
              </AccentButton>
            </div>
          </header>

          <GameStatusCard className={styles.phaseCard} cardRef={phaseCardRef}>
            <svg
              className={styles.phaseProgressRing}
              viewBox={phaseRing.viewBox}
              aria-hidden="true"
            >
              <path className={styles.phaseProgressTrack} d={phaseRing.d} />
              <path
                className={styles.phaseProgressActive}
                d={phaseRing.d}
                strokeDasharray={phaseRing.dashArray}
                strokeDashoffset={0}
              />
            </svg>
            <div className={clsx(styles.itemRow, styles.phaseCardContent)}>
              <MainTextTypography variant="h2" className={styles.bigText}>
                {state.phase}
              </MainTextTypography>

              <PhaseCountdown
                secondsLeft={phaseClock.secondsLeft}
                className={styles.bigText}
              />
            </div>
          </GameStatusCard>

          <GameStatusCard label={currentItemLabel}>
            <CurrentItemDisplay
              item={currentItem}
              isVisible={SHOW_CURRENT_ITEM_PHASES.has(state.phase)}
              rowClassName={styles.itemRow}
              imageClassName={styles.itemImage}
              fallbackClassName={styles.itemImageFallback}
              textAlign="center"
            />
          </GameStatusCard>

          <GameStatusCard
            className={styles.playersCard}
            bodyClassName={styles.playersBody}
          >
            <div className={styles.activePlayersList} role="list">
              <AnimatePresence initial={false}>
                {state?.players.length > 0 ? (
                  state?.players.map((player) => {
                    const isCurrentTurnPlayer =
                      player.id === currentTurnPlayerId;

                    return (
                      <motion.div
                        key={player.id}
                        layout
                        role="listitem"
                        className={clsx(
                          styles.activePlayerRow,
                          isCurrentTurnPlayer && styles.activePlayerRowCurrent,
                        )}
                        initial={{ opacity: 0, x: "50%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "50%" }}
                        transition={{
                          duration: 0.28,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <PlayerAvatar
                          avatar={player.avatar}
                          size={40}
                          className={styles.activePlayerAvatar}
                          sway
                        />
                        <MainTextTypography
                          variant={isCurrentTurnPlayer ? "h2" : "h3"}
                          tone={isCurrentTurnPlayer ? "player" : "default"}
                          muted
                          className={styles.activePlayerName}
                        >
                          {player.name}
                        </MainTextTypography>
                      </motion.div>
                    );
                  })
                ) : (
                  <MainTextTypography variant="body" muted>
                    No active players
                  </MainTextTypography>
                )}
              </AnimatePresence>
            </div>
          </GameStatusCard>

          {state.phase === "FINISHED" ? (
            <GameStatusCard label="NEXT ROUND">
              <div className={styles.rematchCard}>
                <MainTextTypography variant="body" muted textAlign="center">
                  Return to lobby with the same players and a new tier set.
                </MainTextTypography>
                <AccentButton
                  onClick={handlePlayAgain}
                  disabled={isRematchSubmitting}
                >
                  {isRematchSubmitting ? "Starting..." : "Play Again"}
                </AccentButton>
              </div>
            </GameStatusCard>
          ) : null}
        </aside>
      </main>

      {/** --- #region OVERLAYS and MODALS --- */}

      <PlayerTurnReveal state={state} />
      <ItemPlacementReveal state={state} />
      <VoteResultsReveal state={state} />
      <ConfirmationModal
        open={isConfirmExitOpen}
        title="Close Game?"
        message="This will boot all players from the game."
        confirmText="Exit"
        destructive
        onCancel={() => setIsConfirmExitOpen(false)}
        onConfirm={() => {
          setIsConfirmExitOpen(false);
          handleExit();
        }}
      />

      {IS_DEBUG_ENABLED && (
        <div className={styles.devControls}>
          <span>DEV CONTROLS:</span>
          <button type="button" onClick={roomSocket.debugTogglePause}>
            {state.debug?.paused ? "Resume" : "Pause"}
          </button>
          <div className={styles.prevnextButtonsGroup}>
            <button type="button" onClick={() => roomSocket.debugPrev()}>
              Prev
            </button>
            <button type="button" onClick={() => roomSocket.debugNext()}>
              Next
            </button>
          </div>
        </div>
      )}

      {/** --- #endregion OVERLAYS and MODALS --- */}
    </div>
  );
}
