import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import { normalizeCode } from "@/lib/codeUtils";
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
import {
  clearHostSession,
  clearRoomSession,
  getClientId,
  markHostStartedRoomCode,
  saveRoomSession,
} from "@/lib/session";
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";
import { PhaseCountdown } from "./PhaseCountdown/PhaseCountdown";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";

type RoomPublicState = Contracts.RoomPublicState;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function GameRoom() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isRematchSubmitting, setIsRematchSubmitting] = useState(false);
  const [state, setState] = useState<RoomPublicState | null>(() =>
    roomSocket.getLastRoomState(normalizeCode(code ?? "")),
  );
  const [isIntro, setIsIntro] = useState(true);

  const suppressRejoinNoticeRef = useRef(false);
  const turnNameRef = useRef<HTMLSpanElement | null>(null);

  const roomCode = normalizeCode(code ?? "");
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

  const currentTurnPlayer = state?.currentTurnPlayerId
    ? (state.players.find(
        (player) => player.id === state.currentTurnPlayerId,
      ) ?? null)
    : null;
  const currentTurnName = currentTurnPlayer?.name ?? "";

  useAutoFitText(turnNameRef, {
    minFontSizePx: 22,
    watch: currentTurnName,
    enabled: !!currentTurnName,
  });

  const handleExit = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostSession();
    if (roomCode) clearRoomSession(roomCode);
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomClosed = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostSession();
    if (roomCode) clearRoomSession(roomCode);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((nextState: RoomPublicState) => {
    setState(nextState);
    if (nextState.phase !== "FINISHED") {
      setIsRematchSubmitting(false);
    }
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
    roomCode: roomCode || null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

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
      markHostStartedRoomCode(roomCode);
    },
    [state, roomCode],
  );

  useEffect(
    function redirectHostToLobbyAfterRematchRestart() {
      if (!state) return;
      if (state.phase !== "LOBBY") return;
      if (!roomCode) return;
      navigate(`${ROUTES.HOST_LOBBY}/${roomCode}`, { replace: true });
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
          markHostStartedRoomCode(roomCode);
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
            ROOM {roomCode || "--"}
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

          <GameStatusCard label="PHASE">
            <div className={styles.itemRow}>
              <MainTextTypography variant="h2" className={styles.bigText}>
                {state.phase}
              </MainTextTypography>

              <PhaseCountdown state={state} className={styles.bigText} />
            </div>
          </GameStatusCard>

          <GameStatusCard label="CURRENT ITEM:">
            <CurrentItemDisplay
              item={currentItem}
              isVisible={SHOW_CURRENT_ITEM_PHASES.has(state.phase)}
              rowClassName={styles.itemRow}
              imageClassName={styles.itemImage}
              fallbackClassName={styles.itemImageFallback}
              textAlign="center"
            />
          </GameStatusCard>

          <GameStatusCard label="TURN:">
            <div className={styles.itemRow}>
              {currentTurnName ? (
                <div className={styles.turnRow}>
                  <PlayerAvatar
                    avatar={currentTurnPlayer?.avatar}
                    size={45}
                    className={styles.turnAvatar}
                  />
                  <div className={styles.turnPhrase}>
                    <MainTextTypography
                      variant="h2"
                      tone="player"
                      className={styles.turnName}
                      ref={turnNameRef}
                    >
                      {currentTurnName}
                    </MainTextTypography>
                    <MainTextTypography variant="h2" muted>
                      {"'s turn"}
                    </MainTextTypography>
                  </div>
                </div>
              ) : (
                <MainTextTypography variant="h2" muted>
                  —
                </MainTextTypography>
              )}
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
