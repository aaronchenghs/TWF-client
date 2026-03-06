import { useNavigate } from "react-router-dom";
import styles from "./HostLobby.module.scss";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
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
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import {
  hideTipByKind,
  showTip,
  TIP_KINDS,
} from "@/store/slices/tipsPopupSlice";
import {
  clearHostRoomState,
  markHostRoomStarted,
  readHostRoomCode,
} from "@/lib/roomClientState";
import { getLocalStorageValue, LOCAL_STORAGE_KEYS } from "@/lib/localStorage";
import { TierSetSelection } from "./TierSetSelection/TierSetSelection";
import { HostSidePanel } from "./HostSidePanel/HostSidePanel";
import { useHostLobbySoundEffects } from "@/lib/hooks/useSoundEffects";

const CODE_LENGTH = Contracts.CODE_LENGTH;
const BEST_PLAY_TIP_DELAY_MS = 500;
type TierSetSummary = Contracts.TierSetSummary;
type RoomPublicState = Contracts.RoomPublicState;

export default function HostLobby() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [isTierSetsLoading, setIsTierSetsLoading] = useState(true);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [countdownNumber, setCountdownNumber] = useState<3 | 2 | 1 | null>(
    null,
  );
  const suppressRejoinNoticeRef = useRef(false);

  const roomCode = normalizeCode(readHostRoomCode());
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;

  const players = useMemo(
    () => (roomState?.players ?? []).filter((p) => p.connected !== false),
    [roomState],
  );

  const selectedTierSetId = (roomState?.tierSetId ?? null) as Guid | null;

  const selectedTierSetName =
    tierSets.find((tier) => tier.id === selectedTierSetId)?.title ?? null;

  const handleCloseLobby = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    roomSocket.closeRoom();
    navigate(ROUTES.LANDING);
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((state: RoomPublicState) => {
    setRoomState(state);
    if (state.phase !== "LOBBY") markHostRoomStarted(state.code);
  }, []);

  const handleRoomClosed = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostRoomState(roomCode);
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  useUnexpectedExitRejoinNotice({
    kind: "host_lobby",
    roomCode,
    isEligible: isRoomCodeValid,
    suppressRef: suppressRejoinNoticeRef,
  });

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useHostLobbySoundEffects(roomState, countdownNumber);

  useEffect(
    function maybeShowBestPlayTip() {
      if (
        !isRoomCodeValid ||
        !$isShowTips ||
        getLocalStorageValue(LOCAL_STORAGE_KEYS.HOST_LOBBY_PLAY_TIP_SEEN)
      )
        return;

      const tipTimer = window.setTimeout(() => {
        dispatch(showTip(TIP_KINDS.HOST_LOBBY_BEST_PLAY));
      }, BEST_PLAY_TIP_DELAY_MS);

      return () => {
        window.clearTimeout(tipTimer);
      };
    },
    [isRoomCodeValid, $isShowTips, dispatch],
  );

  useEffect(
    function hideBestPlayTipWhenDisabled() {
      if ($isShowTips) return;
      dispatch(hideTipByKind(TIP_KINDS.HOST_LOBBY_BEST_PLAY));
    },
    [$isShowTips, dispatch],
  );

  useEffect(
    function cleanupBestPlayTipOnLeave() {
      return () => {
        dispatch(hideTipByKind(TIP_KINDS.HOST_LOBBY_BEST_PLAY));
      };
    },
    [dispatch],
  );

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
      <header className={styles.header}>
        <TWFLogo className={styles.logo} aria-hidden="true" />
        <MainTextTypography variant="h2" className={styles.title}>
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
          selectedTierSetId={selectedTierSetId}
          selectedTierSetName={selectedTierSetName}
          onCloseLobby={() => setIsConfirmCloseOpen(true)}
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
