import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import styles from "./HostLobby.module.scss";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
import { CODE_LENGTH, type RoomPublicState } from "@twf/contracts";
import { normalizeCode } from "@/lib/stringNormalizers";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { ROUTES } from "@/routes/routes";
import { getClientId, saveRoomSession } from "@/lib/session";
import type { Guid } from "@/lib/guid";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import {
  clearHostRoomState,
  markHostRoomStarted,
  readHostRoomCode,
} from "@/lib/roomClientState";
import { CountdownOverlay } from "./CountdownOverlay/CountdownOverlay";
import { useHostLobbySoundEffects } from "@/lib/hooks/useSoundEffects";
import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useHostLobbyGameCustomizationController } from "./GameCustomizationModal/useHostLobbyGameCustomizationController";
import { GameSettingsPanel } from "./GameSettingsPanel/GameSettingsPanel";
import { PlayerJoinPanel } from "./PlayerJoinPanel/PlayerJoinPanel";

const HOST_EXIT_FADE_MS = 350;

const { exit: ExitIcon } = APP_ICONS;
const GameCustomizationModal = lazy(() =>
  import("./GameCustomizationModal/GameCustomizationModal").then((module) => ({
    default: module.GameCustomizationModal,
  })),
);

export default function HostLobby() {
  const navigate = useNavigate();

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState<boolean>(false);
  const [isGameCustomizationOpen, setIsGameCustomizationOpen] =
    useState<boolean>(false);
  const [isStartCountdownOpen, setIsStartCountdownOpen] =
    useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [isTransitioningToGame, setIsTransitioningToGame] =
    useState<boolean>(false);
  const [countdownNumber, setCountdownNumber] = useState<3 | 2 | 1 | null>(
    null,
  );

  const [isCountdownOutroActive, setIsCountdownOutroActive] =
    useState<boolean>(false);
  useHostLobbySoundEffects(roomState, countdownNumber, isCountdownOutroActive);

  const navigateToGameTimeoutRef = useRef<number | null>(null);

  const roomCode = normalizeCode(readHostRoomCode());
  const {
    gameCustomization,
    handleGameCustomizationChange,
    handleIncomingRoomState,
  } = useHostLobbyGameCustomizationController({ roomCode });

  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const players = roomState?.players ?? [];
  const selectedTierSetId = (roomState?.tierSetId ?? null) as Guid | null;

  const isCloseLobbyDisabled =
    countdownNumber !== null || isTransitioningToGame;
  const joinLocationLabel =
    typeof window === "undefined"
      ? "tierswithfriends.com"
      : window.location.host;

  const handleCloseLobby = useCallback(() => {
    clearHostRoomState(roomCode);
    roomSocket.closeRoom();
    navigate(ROUTES.LANDING);
  }, [navigate, roomCode]);

  const handleRoomState = useCallback(
    (state: RoomPublicState) => {
      handleIncomingRoomState(state);
      setRoomState(state);
      if (state.phase !== "LOBBY") markHostRoomStarted(state.code);
    },
    [handleIncomingRoomState],
  );

  const handleRoomClosed = useCallback(() => {
    clearHostRoomState(roomCode);
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleStartGameTransition = useCallback(() => {
    if (navigateToGameTimeoutRef.current != null) return;

    setIsTransitioningToGame(true);

    navigateToGameTimeoutRef.current = window.setTimeout(() => {
      navigateToGameTimeoutRef.current = null;
      navigate(ROUTES.GAME_ROOM, { replace: true });
    }, HOST_EXIT_FADE_MS);
  }, [navigate]);

  const handleStartClick = useCallback(() => {
    setIsStartCountdownOpen(true);
  }, []);

  const handleCancelCountdown = useCallback(() => {
    setIsStartCountdownOpen(false);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setIsStartCountdownOpen(false);
    markHostRoomStarted(roomCode);
    roomSocket.startGame(roomCode);
    handleStartGameTransition();
  }, [handleStartGameTransition, roomCode]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useEffect(
    function redirectStartedRoomToGameRoute() {
      if (!roomState) return;
      if (roomState.phase === "LOBBY") return;
      const frameId = window.requestAnimationFrame(handleStartGameTransition);
      return () => window.cancelAnimationFrame(frameId);
    },
    [handleStartGameTransition, roomState],
  );

  useEffect(function clearPendingGameNavigationOnUnmount() {
    return () => {
      if (navigateToGameTimeoutRef.current == null) return;
      window.clearTimeout(navigateToGameTimeoutRef.current);
    };
  }, []);

  useEffect(
    function handleRoomConnection() {
      if (!isRoomCodeValid) {
        handleRoomClosed();
        return;
      }

      const clientId = getClientId();

      roomSocket
        .joinRoomOrThrow({ code: roomCode, role: "host", clientId })
        .then(() => {
          saveRoomSession({ code: roomCode, role: "host" });
        })
        .catch(() => handleRoomClosed());
    },
    [roomCode, isRoomCodeValid, handleRoomClosed],
  );

  return (
    <div className={clsx(styles.root, isTransitioningToGame && styles.exiting)}>
      <div className={styles.topRightAction}>
        <ExpandingIconButton
          icon={<ExitIcon {...ICON_PROPS.quickActions} aria-hidden="true" />}
          label="Close Lobby"
          ariaLabel="Close Lobby"
          expandDirection="left"
          variant="destructive"
          onClick={() => setIsConfirmCloseOpen(true)}
          disabled={isCloseLobbyDisabled}
        />
      </div>

      <header className={styles.header}>
        <TWFLogo className={styles.logo} aria-hidden="true" />
      </header>

      <div className={styles.layoutShell}>
        <div className={styles.layout}>
          <GameSettingsPanel
            className={clsx(styles.lobbyPanel, styles.hostPanel)}
            canLoadTierSets={isRoomCodeValid}
            selectedTierSetId={selectedTierSetId}
            playerCount={players.length}
            players={players}
            isStartCountdownOpen={isStartCountdownOpen}
            onOpenGameSettings={() => setIsGameCustomizationOpen(true)}
            onStartGame={handleStartClick}
          />

          <PlayerJoinPanel
            className={clsx(styles.lobbyPanel, styles.joinPanel)}
            roomCode={roomCode}
            players={players}
            joinLocationLabel={joinLocationLabel}
          />
        </div>
      </div>

      <CountdownOverlay
        open={isStartCountdownOpen}
        onCancel={handleCancelCountdown}
        onComplete={handleCountdownComplete}
        onDisplayCountChange={setCountdownNumber}
        onOutroActiveChange={setIsCountdownOutroActive}
      />

      {isGameCustomizationOpen ? (
        <Suspense fallback={null}>
          <GameCustomizationModal
            open
            settings={gameCustomization}
            onClose={() => setIsGameCustomizationOpen(false)}
            onChange={handleGameCustomizationChange}
          />
        </Suspense>
      ) : null}

      <ConfirmationModal
        open={isConfirmCloseOpen}
        title="Close Lobby?"
        message="This ends the session for everyone currently connected."
        confirmAction={{
          text: "Close",
          onAction: () => {
            setIsConfirmCloseOpen(false);
            window.requestAnimationFrame(handleCloseLobby);
          },
        }}
        destructive
        onCancel={() => setIsConfirmCloseOpen(false)}
      />
    </div>
  );
}
