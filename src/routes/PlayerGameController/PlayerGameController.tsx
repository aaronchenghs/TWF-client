import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import type {
  RoomPublicState,
  TierSetDefinition,
  TierId,
  VoteValue,
} from "@twf/contracts";
import { ROUTES } from "../routes";
import { normalizeCode } from "../../lib/codeUtils";
import { CODE_LENGTH } from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
import { roomSocket } from "../../services/sockets/roomSocket";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerGameController.module.scss";
import { AwaitingControls } from "./Controls/AwaitingControls";
import { PlaceControls } from "./Controls/PlaceControls";
import { VoteControls } from "./Controls/VoteControls";
import { phaseLabel, phaseSubtext } from "../../lib/phaseLabels";

export default function PlayerGameController() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<RoomPublicState | null>(null);
  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(
    socketClient.getMyPlayerId()
  );
  const [err, setErr] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const myName = useMemo(
    () => (searchParams.get("name") ?? "").trim(),
    [searchParams]
  );

  const currentTurnPlayer = useMemo(() => {
    if (!state?.currentTurnPlayerId) return null;
    return (
      state.players.find((p) => p.id === state.currentTurnPlayerId) ?? null
    );
  }, [state]);

  const isMyTurn = !!myPlayerId && state?.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state?.phase === "VOTE" && !isMyTurn;
  const hasVoted = !!myPlayerId && state?.votes?.[myPlayerId] !== undefined;

  const currentItem = useMemo(() => {
    if (!state?.currentItem || !tierSet) return null;
    return tierSet.items.find((it) => it.id === state.currentItem) ?? null;
  }, [state?.currentItem, tierSet]);

  const handleExit = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

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
          onClick={handleExit}
        >
          Exit
        </AccentButton>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.cardTopRow}>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              PHASE
            </MainTextTypography>
            <MainTextTypography
              variant="label"
              className={clsx(err && styles.errorText)}
              muted={!err}
              letterSpacing="wide"
            >
              {err ?? "LIVE"}
            </MainTextTypography>
          </div>

          <MainTextTypography variant="h3" className={styles.phaseTitle}>
            {phaseLabel(state.phase)}
          </MainTextTypography>

          <MainTextTypography variant="body" muted>
            {phaseSubtext(state, currentTurnPlayer, isMyTurn)}
          </MainTextTypography>
        </section>

        <section className={styles.card}>
          <MainTextTypography variant="label" muted letterSpacing="wide">
            CURRENT ITEM
          </MainTextTypography>

          {currentItem ? (
            <div className={styles.itemRow}>
              <img
                className={styles.itemImage}
                src={currentItem.imageSrc}
                alt={currentItem.name}
              />
              <MainTextTypography variant="h4" className={styles.itemName}>
                {currentItem.name}
              </MainTextTypography>
            </div>
          ) : (
            <MainTextTypography variant="body" muted>
              —
            </MainTextTypography>
          )}
        </section>
      </main>

      <footer className={styles.actionBar}>
        {state.phase === "PLACE" ? (
          <PlaceControls
            disabled={!isMyTurn || isPlacing}
            tiers={tierSet ? tierSet.tiers : []}
            tierOrder={state.tierOrder}
            onPlace={handlePlaceIntoTier}
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
    </div>
  );
}
