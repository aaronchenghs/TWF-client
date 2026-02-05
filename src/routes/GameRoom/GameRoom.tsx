import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import { normalizeCode } from "@/lib/codeUtils";
import { ROUTES } from "@/routes/routes";
import * as Contracts from "@twf/contracts";
import { usePhaseClock } from "@/lib/hooks/usePhaseClock";
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
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { getPlayerNameById } from "@/lib/players";

type RoomPublicState = Contracts.RoomPublicState;

export default function GameRoom() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [state, setState] = useState<RoomPublicState | null>(null);
  const [isIntro, setIsIntro] = useState(true);

  const clock = usePhaseClock(state);
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const hasState = state != null;

  const currentItem = state?.currentItem
    ? {
        name:
          state.itemMetaById?.[state.currentItem]?.name ?? state.currentItem,
        imageSrc: state.itemMetaById?.[state.currentItem]?.imageSrc,
      }
    : null;

  const currentTurnName = state?.currentTurnPlayerId
    ? getPlayerNameById(state.players, state.currentTurnPlayerId, "")
    : "";

  const handleExit = useCallback(() => {
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const handleRoomClosed = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  useEffect(
    function endIntroAfterFirstFrame() {
      if (!hasState) return;
      const raf = requestAnimationFrame(() => setIsIntro(false));
      return () => cancelAnimationFrame(raf);
    },
    [hasState],
  );

  useRoomSubscriptions({
    roomCode: roomCode || null,
    onState: setState,
    onClosed: handleRoomClosed,
  });

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
              <MainTextTypography variant="h3" className={styles.bigText}>
                {state.phase}
              </MainTextTypography>

              <MainTextTypography variant="h3" className={styles.bigText}>
                {clock.secondsLeft ?? "--"}
              </MainTextTypography>
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
                  <MainTextTypography
                    variant="h3"
                    tone="player"
                    className={styles.turnName}
                  >
                    {currentTurnName}
                  </MainTextTypography>
                  <MainTextTypography variant="h3" muted>
                    {"'s turn"}
                  </MainTextTypography>
                </div>
              ) : (
                <MainTextTypography variant="h3" muted>
                  —
                </MainTextTypography>
              )}
            </div>
          </GameStatusCard>
        </aside>
      </main>

      {/** --- #region OVERLAYS and MODALS --- */}

      <PlayerTurnReveal state={state} />

      <ItemPlacementReveal state={state} />

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
