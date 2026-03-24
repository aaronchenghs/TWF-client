import { useNavigate } from "react-router-dom";
import styles from "./HostLobby.module.scss";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";
import { normalizeCode } from "@/lib/stringNormalizers";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { ROUTES } from "@/routes/routes";
import { getClientId, saveRoomSession } from "@/lib/session";
import type { Guid } from "@/lib/guid";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";
import {
  clearHostRoomState,
  markHostRoomStarted,
  readHostRoomCode,
} from "@/lib/roomClientState";
import { TierSetSelection } from "./TierSetSelection/TierSetSelection";
import { HostSidePanel } from "./HostSidePanel/HostSidePanel";
import { useHostLobbySoundEffects } from "@/lib/hooks/useSoundEffects";
import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import {
  useHostLobbyGameSettingsController,
} from "./GameSettingsModal/useHostLobbyGameSettingsController";

const CODE_LENGTH = Contracts.CODE_LENGTH;
type TierSetSummary = Contracts.TierSetSummary;
type RoomPublicState = Contracts.RoomPublicState;
const { exit: ExitIcon } = APP_ICONS;

export default function HostLobby() {
  const navigate = useNavigate();

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [isTierSetsLoading, setIsTierSetsLoading] = useState(true);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [countdownNumber, setCountdownNumber] = useState<3 | 2 | 1 | null>(
    null,
  );
  const suppressRejoinNoticeRef = useRef(false);

  useHostLobbySoundEffects(roomState, countdownNumber);

  const roomCode = normalizeCode(readHostRoomCode());
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const {
    gameSettings,
    handleGameSettingsChange,
    handleIncomingRoomState,
  } = useHostLobbyGameSettingsController({ roomCode });
  const players = roomState?.players ?? [];
  const selectedTierSetId = (roomState?.tierSetId ?? null) as Guid | null;
  const selectedTierSetName =
    tierSets.find((tier) => tier.id === selectedTierSetId)?.title ?? null;
  const isCloseLobbyDisabled = countdownNumber !== null;

  useUnexpectedExitRejoinNotice({
    kind: "host_lobby",
    roomCode,
    isEligible: isRoomCodeValid,
    suppressRef: suppressRejoinNoticeRef,
  });

  const handleCloseLobby = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    roomSocket.closeRoom();
    navigate(ROUTES.LANDING);
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((state: RoomPublicState) => {
    handleIncomingRoomState(state);
    setRoomState(state);
    if (state.phase !== "LOBBY") markHostRoomStarted(state.code);
  }, [handleIncomingRoomState]);

  const handleRoomClosed = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useEffect(
    function redirectStartedRoomToGameRoute() {
      if (!roomState) return;
      if (roomState.phase === "LOBBY") return;
      suppressRejoinNoticeRef.current = true;
      navigate(ROUTES.GAME_ROOM, { replace: true });
    },
    [navigate, roomState],
  );

  useEffect(
    function handleRoomConnection() {
      if (!isRoomCodeValid) {
        handleRoomClosed();
        return;
      }

      const clientId = getClientId();
      let cancelled = false;

      roomSocket
        .joinRoomOrThrow({ code: roomCode, role: "host", clientId })
        .then(() => {
          saveRoomSession({ code: roomCode, role: "host" });
        })
        .catch(() => handleRoomClosed());

      roomSocket
        .listTierSets()
        .then((listed) => {
          if (cancelled) return;
          startTransition(() => {
            setTierSets(listed);
            setIsTierSetsLoading(false);
          });
        })
        .catch(() => {
          if (cancelled) return;
          startTransition(() => {
            setTierSets([]);
            setIsTierSetsLoading(false);
          });
        });

      return () => {
        cancelled = true;
      };
    },
    [roomCode, isRoomCodeValid, handleRoomClosed],
  );

  return (
    <div className={styles.root}>
      <div className={styles.topRightAction}>
        <ExpandingIconButton
          icon={
            <ExitIcon
              {...ICON_PROPS.quickActions}
              aria-hidden="true"
            />
          }
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
        <MainTextTypography variant="h1" className={styles.title}>
          Hosting Lobby
        </MainTextTypography>
      </header>

      <div className={styles.layout}>
        <TierSetSelection
          tierSets={tierSets}
          selectedTierSetId={selectedTierSetId}
          isLoading={isTierSetsLoading}
        />

        <HostSidePanel
          roomCode={roomCode}
          players={players}
          gameSettings={gameSettings}
          onGameSettingsChange={handleGameSettingsChange}
          selectedTierSetId={selectedTierSetId}
          selectedTierSetName={selectedTierSetName}
          onCountdownDisplayCountChange={setCountdownNumber}
          suppressRejoinNoticeRef={suppressRejoinNoticeRef}
        />
      </div>

      <ConfirmationModal
        open={isConfirmCloseOpen}
        title="Close Lobby?"
        message="This ends the session for everyone currently connected."
        confirmText="Close"
        destructive
        onCancel={() => setIsConfirmCloseOpen(false)}
        onConfirm={() => {
          setIsConfirmCloseOpen(false);
          window.requestAnimationFrame(handleCloseLobby);
        }}
      />
    </div>
  );
}
