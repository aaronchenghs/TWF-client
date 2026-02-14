import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import styles from "./HostLobby.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { SubtextDivider } from "@/components/SubtextDivider/SubtextDivider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { roomSocket } from "@/services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";
import { normalizeCode } from "@/lib/codeUtils";
import { TierSetGridEntry } from "./TierSetGridEntry/TierSetGridEntry";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { CopyTextButton } from "@/components/CopyTextButton/CopyTextButton";
import { ROUTES } from "@/routes/routes";
import { CountdownOverlay } from "./CountdownOverlay/CountdownOverlay";
import {
  clearHostSession,
  clearRoomSession,
  getClientId,
  hasSeenHostLobbyPlayTip,
  markHostStartedRoomCode,
  saveRoomSession,
} from "@/lib/session";
import type { Guid } from "@/lib/guid";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";
import { ExpandingIconButton } from "@/components/ExpandingIconButton/ExpandingIconButton";
import { Bug, CircleHelp, Settings } from "lucide-react";
import { useAppDispatch, useAppSelector, type AppState } from "@/store/store";
import { openSettingsModal } from "@/store/slices/userSettingsSlice";
import {
  hideTipByKind,
  showTip,
  TIP_KINDS,
} from "@/store/slices/tipsPopupSlice";
import { openIssueReportModal } from "@/store/slices/issueReportSlice";

const CODE_LENGTH = Contracts.CODE_LENGTH;
const LOBBY_CAPACITY = Contracts.LOBBY_CAPACITY;
const BEST_PLAY_TIP_DELAY_MS = 500;
type TierSetSummary = Contracts.TierSetSummary;
type RoomPublicState = Contracts.RoomPublicState;

export default function HostLobby() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const $isShowTips = useAppSelector(
    (state: AppState) => state.userSettings.isShowTips,
  );
  const { code } = useParams<{ code: string }>();

  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [isStartCountdownOpen, setIsStartCountdownOpen] = useState(false);
  const [tierSetWithDetailsOpen, setTierSetWithDetailsOpen] =
    useState<Guid | null>(null);

  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const suppressRejoinNoticeRef = useRef(false);

  const players = useMemo(
    () => (roomState?.players ?? []).filter((p) => p.connected !== false),
    [roomState],
  );
  const playerCount = players.length;
  const selectedTierSetId = roomState?.tierSetId ?? null;
  const isStartEnabled = !!selectedTierSetId && playerCount >= 2;
  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;

  const selectedTierSetName = useMemo(() => {
    if (!selectedTierSetId) return null;
    return (
      tierSets.find((tier) => tier.id === selectedTierSetId)?.title ?? null
    );
  }, [tierSets, selectedTierSetId]);

  const handleCloseLobby = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostSession();
    if (roomCode) clearRoomSession(roomCode);
    roomSocket.closeRoom();
    navigate(ROUTES.LANDING);
  }, [navigate, roomCode]);

  const handleSelectTierSet = useCallback((ts: TierSetSummary) => {
    roomSocket.setTierSet(ts.id);
  }, []);

  const handleStartClick = useCallback(() => {
    if (!isStartEnabled) return;
    setIsStartCountdownOpen(true);
  }, [isStartEnabled]);

  const handleCancelCountdown = useCallback(() => {
    setIsStartCountdownOpen(false);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    markHostStartedRoomCode(roomCode);
    roomSocket.startGame(roomCode);
    navigate(`${ROUTES.GAME_ROOM}/${roomCode}`);
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((state: RoomPublicState) => {
    setRoomState(state);
    if (state.phase !== "LOBBY") {
      markHostStartedRoomCode(state.code);
    }
  }, []);

  useUnexpectedExitRejoinNotice({
    kind: "host_lobby",
    roomCode,
    isEligible: isRoomCodeValid,
    suppressRef: suppressRejoinNoticeRef,
  });

  useEffect(
    function maybeShowBestPlayTip() {
      if (!isRoomCodeValid) return;
      if (!$isShowTips) return;
      if (hasSeenHostLobbyPlayTip()) return;

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
      navigate(`${ROUTES.GAME_ROOM}/${roomState.code}`, { replace: true });
    },
    [navigate, roomState],
  );

  const handleRoomClosed = useCallback(() => {
    suppressRejoinNoticeRef.current = true;
    clearHostSession();
    if (roomCode) clearRoomSession(roomCode);
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleSettingsClick = useCallback(
    () => dispatch(openSettingsModal()),
    [dispatch],
  );
  const handleHelpClick = useCallback(() => void 0, []);
  const handleReportIssueClick = useCallback(() => {
    dispatch(openIssueReportModal());
  }, [dispatch]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useEffect(
    function handleRoomConnection() {
      if (!isRoomCodeValid) return;

      const clientId = getClientId();

      roomSocket
        .joinRoomOrThrow({ code: roomCode, role: "host", clientId })
        .then(() => {
          saveRoomSession({ code: roomCode, role: "host" });
        })
        .catch(() => handleRoomClosed());

      roomSocket
        .listTierSets()
        .then(setTierSets)
        .catch(() => setTierSets([]));
    },
    [roomCode, isRoomCodeValid, handleRoomClosed],
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <MainTextTypography variant="h1" className={styles.title}>
          Hosting Lobby
        </MainTextTypography>

        <div className={styles.roomMeta}>
          <MainTextTypography className={styles.roomLabel} variant="h4">
            Room Code:
          </MainTextTypography>
          <div className={styles.roomCodeContainer}>
            <CopyTextButton
              value={roomCode}
              disabled={!isRoomCodeValid}
              title="Copy room code"
            />
            <MainTextTypography className={styles.roomCode} variant="h2">
              {roomCode || "----"}
            </MainTextTypography>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.left}>
          <SubtextDivider text="Choose a Tier List" />

          <div className={styles.presetGrid}>
            {tierSets.length === 0 ? (
              <MainTextTypography variant="body" muted>
                Loading tier lists
                <AnimatedDots />
              </MainTextTypography>
            ) : (
              tierSets.map((set) => (
                <TierSetGridEntry
                  key={set.id}
                  tierSet={set}
                  selected={set.id === selectedTierSetId}
                  onSelect={handleSelectTierSet}
                  setOpenDetailsTierSet={setTierSetWithDetailsOpen}
                  openDetailsTierSetId={tierSetWithDetailsOpen}
                />
              ))
            )}
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.panel}>
            <MainTextTypography variant="h3">
              Players ({playerCount}/{LOBBY_CAPACITY})
            </MainTextTypography>

            <ul className={styles.playerList}>
              {players.length === 0 ? (
                <MainTextTypography
                  className={styles.player}
                  variant="body"
                  muted
                >
                  Waiting
                  <AnimatedDots />
                </MainTextTypography>
              ) : (
                players.map((player) => (
                  <li className={styles.playerEntry} key={player.id}>
                    <MainTextTypography
                      className={styles.player}
                      variant="h6"
                      tone="player"
                    >
                      {player.name}
                    </MainTextTypography>
                    <AccentButton
                      variant="destructive"
                      size="small"
                      onClick={() => roomSocket.bootPlayerFromLobby(player.id)}
                    >
                      Kick
                    </AccentButton>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className={clsx(styles.panel, styles.controls)}>
            <div
              className={clsx(
                styles.selectedTierSetCard,
                !selectedTierSetName && styles.selectedTierSetCardEmpty,
              )}
            >
              <div className={styles.selectedTierSetHeader}>
                <MainTextTypography
                  variant="caption"
                  letterSpacing="wide"
                  className={styles.selectedTierSetLabel}
                >
                  Selected Tier Set
                </MainTextTypography>
              </div>

              <MainTextTypography
                variant={selectedTierSetName ? "h4" : "body"}
                textAlign="center"
                muted={!selectedTierSetName}
                className={styles.selectedTierSetName}
              >
                {selectedTierSetName ?? "No tier set selected"}
              </MainTextTypography>
            </div>

            <AccentButton
              variant="primary"
              disabled={!isStartEnabled || isStartCountdownOpen}
              onClick={handleStartClick}
            >
              Start Game
            </AccentButton>

            <AccentButton
              variant="secondary"
              onClick={() => setIsConfirmCloseOpen(true)}
              disabled={isStartCountdownOpen}
            >
              Close Lobby
            </AccentButton>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={isConfirmCloseOpen}
        title="Close Lobby?"
        message="This ends the session for everyone currently connected."
        confirmText="Close"
        destructive
        onCancel={() => setIsConfirmCloseOpen(false)}
        onConfirm={handleCloseLobby}
      />

      <CountdownOverlay
        open={isStartCountdownOpen}
        onCancel={handleCancelCountdown}
        onComplete={handleCountdownComplete}
      />

      <div className={styles.quickActions}>
        <ExpandingIconButton
          icon={<Settings aria-hidden="true" />}
          label="Settings"
          onClick={handleSettingsClick}
          expandDirection="right"
        />
        <ExpandingIconButton
          icon={<CircleHelp aria-hidden="true" />}
          label="Help"
          onClick={handleHelpClick}
          expandDirection="right"
        />
        <ExpandingIconButton
          icon={<Bug aria-hidden="true" />}
          label="Report Issue"
          onClick={handleReportIssueClick}
          expandDirection="right"
        />
      </div>
    </div>
  );
}
