import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ROUTES } from "../routes";
import { normalizeCode } from "../../lib/codeUtils";
import { socketClient } from "../../services/sockets/socketClient";
import { roomSocket } from "../../services/sockets/roomSocket";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerGameController.module.scss";
import { AwaitingControls } from "./Controls/AwaitingControls";
import { PlaceControls } from "./Controls/PlaceControls";
import { VoteControls } from "./Controls/VoteControls";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import { GameStatusCard } from "../GameRoom/GameStatusCard/GameStatusCard";
import * as Contracts from "@twf/contracts";
type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierId = Contracts.TierId;
type VoteValue = Contracts.VoteValue;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerGameController() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<RoomPublicState | null>(null);
  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(
    socketClient.getMyPlayerId()
  );

  // TODO: snackbar for errors
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [err, setErr] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  const isMyTurn = !!myPlayerId && state?.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state?.phase === "VOTE" && !isMyTurn;
  const hasVoted = !!myPlayerId && state?.votes?.[myPlayerId] !== undefined;

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const myName = useMemo(
    () => (searchParams.get("name") ?? "").trim(),
    [searchParams]
  );

  // TODO: use later for prompting the current turn player
  // const currentTurnPlayer = useMemo(() => {
  //   if (!state?.currentTurnPlayerId) return null;
  //   return (
  //     state.players.find((p) => p.id === state.currentTurnPlayerId) ?? null
  //   );
  // }, [state]);

  const currentItem = useMemo(() => {
    if (!state?.currentItem || !tierSet) return null;
    return tierSet.items.find((it) => it.id === state.currentItem) ?? null;
  }, [state?.currentItem, tierSet]);

  const handleExit = useCallback(() => {
    console.error(err);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, err]);

  const handleConfirmExit = useCallback(() => {
    setIsConfirmExitOpen(false);
    handleExit();
  }, [handleExit]);

  const handlePlaceIntoTier = async (tierId: TierId) => {
    if (!state || state.phase !== "PLACE" || !isMyTurn) return;
    if (isPlacing) return;

    setIsPlacing(true);
    setErr(null);
    try {
      socketClient.emit("game:place", { tierId });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Place failed");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleVote = async (vote: VoteValue) => {
    if (!canVote || hasVoted) return;
    if (isVoting) return;

    setIsVoting(true);
    setErr(null);
    try {
      socketClient.emit("game:vote", { vote });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setIsVoting(false);
    }
  };

  useEffect(function establishPlayerId() {
    const offJoined = roomSocket.onRoomJoined(({ playerId }) => {
      socketClient.setMyPlayerId(playerId);
      setMyPlayerId(playerId);
    });
    return offJoined;
  }, []);

  useEffect(
    function establishRoomConnection() {
      if (!roomCode || roomCode.length !== CODE_LENGTH || !myName) return;

      socketClient.connect();
      roomSocket.joinRoom({ code: roomCode, role: "player", name: myName });

      const offState = roomSocket.onRoomState((s) => {
        setState(s);
        setErr(null);
      });

      const offError = roomSocket.onRoomError((msg) => setErr(msg));

      const offClosed = roomSocket.onRoomClosed(() => {
        socketClient.disconnect();
        navigate(ROUTES.LANDING, { replace: true });
      });

      return () => {
        offState();
        offError();
        offClosed();
      };
    },
    [roomCode, myName, navigate]
  );

  useEffect(
    function handleLoadTierSet() {
      const tierSetId = state?.tierSetId ?? null;
      if (!tierSetId) return;

      let cancelled = false;

      roomSocket
        .getTierSet(tierSetId)
        .then((ts) => {
          if (!cancelled) setTierSet(ts);
        })
        .catch((e) => {
          if (!cancelled)
            setErr(e instanceof Error ? e.message : "Failed to load tier set");
        });

      return () => {
        cancelled = true;
      };
    },
    [state?.tierSetId]
  );

  useEffect(
    function handleCloseLobby() {
      if (!state) return;
      if (state.phase !== "LOBBY") return;

      const q = new URLSearchParams({ name: myName }).toString();
      navigate(`${ROUTES.PLAYER_LOBBY}/${roomCode}?${q}`, { replace: true });
    },
    [state?.phase, navigate, roomCode, myName, state]
  );

  if (!state) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <TWFLogo className={styles.logo} />
          <div className={styles.headerText}>
            <MainTextTypography variant="h5" muted letterSpacing="wide">
              CONTROLLER
            </MainTextTypography>
            <MainTextTypography variant="body" muted>
              ROOM {roomCode || "—"}
            </MainTextTypography>
          </div>
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
    <div className={styles.root}>
      <header className={styles.header}>
        <TWFLogo className={styles.logo} />
        <div className={styles.headerText}>
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            ROOM {state.code} • {myName || "PLAYER"}
          </MainTextTypography>
        </div>

        <AccentButton
          variant="secondary"
          className={styles.exitButton}
          onClick={() => setIsConfirmExitOpen(true)}
        >
          Exit
        </AccentButton>
      </header>

      <main className={styles.main}>
        <GameStatusCard label="CURRENT ITEM:">
          {currentItem ? (
            <div className={styles.itemRow}>
              {currentItem.imageSrc ? (
                <img
                  className={styles.itemImage}
                  src={currentItem.imageSrc}
                  alt={currentItem.name}
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <div className={styles.itemImageFallback} aria-hidden="true">
                  <MainTextTypography variant="h4">
                    {currentItem.name.slice(0, 1).toUpperCase()}
                  </MainTextTypography>
                </div>
              )}
              <MainTextTypography variant="h4" className={styles.itemName}>
                {currentItem.name}
              </MainTextTypography>
            </div>
          ) : (
            <MainTextTypography variant="body" muted>
              —
            </MainTextTypography>
          )}
        </GameStatusCard>
      </main>

      <footer className={styles.actionBar}>
        {state.phase === "PLACE" ? (
          <PlaceControls
            disabled={!isMyTurn || isPlacing}
            tiers={tierSet ? tierSet.tiers : []}
            tierOrder={state.tierOrder}
            onPlace={handlePlaceIntoTier}
            currentItem={currentItem}
          />
        ) : state.phase === "VOTE" ? (
          <VoteControls
            disabled={!canVote || hasVoted || isVoting}
            alreadyVoted={hasVoted}
            onVote={handleVote}
            isPlacer={isMyTurn}
          />
        ) : (
          <AwaitingControls />
        )}
      </footer>

      <ConfirmationModal
        open={isConfirmExitOpen}
        title="Exit game?"
        message="You will disconnect from this room."
        confirmText="Exit"
        destructive
        onCancel={() => setIsConfirmExitOpen(false)}
        onConfirm={handleConfirmExit}
      />
    </div>
  );
}
