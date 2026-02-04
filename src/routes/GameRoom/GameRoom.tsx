import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { socketClient } from "../../services/sockets/socketClient";
import { roomSocket } from "../../services/sockets/roomSocket";
import { normalizeCode } from "../../lib/codeUtils";
import { ROUTES } from "../routes";
import * as Contracts from "@twf/contracts";
import { usePhaseClock } from "../../lib/hooks/usePhaseClock";
import { TierBoard } from "./TierBoard/TierBoard";
import { getTurnLabel } from "../../lib/phaseLabels";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import { GameStatusCard } from "./GameStatusCard/GameStatusCard";
import { IS_DEBUG_ENABLED } from "../../config/env";
import clsx from "clsx";
import { LoadableImage } from "../../components/LoadableImage/LoadableImage";
import { ItemPlacementReveal } from "./Overlays/ItemPlacementReveal/ItemPlacementReveal";
import { SHOW_CURRENT_ITEM_PHASES } from "../../lib/tierItems";
import { PlayerTurnReveal } from "./Overlays/PlayerTurnReveal/PlayerTurnReveal";

type RoomPublicState = Contracts.RoomPublicState;

export default function GameRoom() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [state, setState] = useState<RoomPublicState | null>(null);
  const [isIntro, setIsIntro] = useState(true);

  const clock = usePhaseClock(state);
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);

  const handleExit = useCallback(() => {
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  useEffect(
    function handleIntroTransition() {
      if (!state) return;
      const raf = requestAnimationFrame(() => setIsIntro(false));
      return () => cancelAnimationFrame(raf);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!state],
  );

  useEffect(
    function handleRoomConnection() {
      if (!roomCode) return;

      const offState = roomSocket.onRoomState((s) => {
        setState(s);
      });

      const offClosed = roomSocket.onRoomClosed(() => {
        socketClient.disconnect();
        navigate(ROUTES.LANDING, { replace: true });
      });

      return () => {
        offState();
        offClosed();
      };
    },
    [roomCode, navigate],
  );

  if (!state) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <MainTextTypography variant="h2">Game</MainTextTypography>
          <MainTextTypography variant="h5" muted>
            ROOM {roomCode || "—"}
          </MainTextTypography>
        </header>

        <div className={styles.center}>
          <MainTextTypography variant="body" muted>
            Connecting…
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
              <TWFLogo className={styles.logo} />
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
                {clock.secondsLeft ?? "—"}
              </MainTextTypography>
            </div>
          </GameStatusCard>

          <GameStatusCard label="CURRENT ITEM:">
            {SHOW_CURRENT_ITEM_PHASES.has(state.phase) ? (
              state.currentItem ? (
                (() => {
                  const meta = state.itemMetaById?.[state.currentItem];
                  const name = meta?.name ?? state.currentItem;
                  const imageSrc = meta?.imageSrc;

                  return (
                    <div className={styles.itemRow}>
                      <LoadableImage
                        className={styles.itemImage}
                        src={imageSrc}
                        alt={name}
                        loading="lazy"
                        draggable={false}
                        fallback={
                          <div
                            className={styles.itemImageFallback}
                            aria-hidden="true"
                          >
                            <MainTextTypography textAlign="center" variant="h4">
                              {name}
                            </MainTextTypography>
                          </div>
                        }
                      />
                      <MainTextTypography textAlign="center" variant="h4">
                        {name}
                      </MainTextTypography>
                    </div>
                  );
                })()
              ) : (
                <MainTextTypography textAlign="center" variant="body" muted>
                  —
                </MainTextTypography>
              )
            ) : (
              <MainTextTypography textAlign="center" variant="h4" muted>
                ???
              </MainTextTypography>
            )}
          </GameStatusCard>

          <GameStatusCard label="TURN:">
            <div className={styles.itemRow}>
              <MainTextTypography variant="h3" muted>
                {getTurnLabel(state)}
              </MainTextTypography>
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
          <span>👨‍💻 DEV CONTROLS:</span>
          <button onClick={roomSocket.debugTogglePause}>
            {state.debug?.paused ? "⏯ Resume" : "⏸Pause"}
          </button>
          <div className={styles.prevnextButtonsGroup}>
            <button onClick={() => roomSocket.debugPrev()}>⏮ Prev</button>
            <button onClick={() => roomSocket.debugNext()}>Next ⏭</button>
          </div>
        </div>
      )}

      {/** --- #endregion OVERLAYS and MODALS --- */}
    </div>
  );
}
