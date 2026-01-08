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

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const name = useMemo(
    () => (searchParams.get("name") ?? "").trim(),
    [searchParams]
  );

  const [state, setState] = useState<RoomPublicState | null>(null);
  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const myPlayerId = socketClient.getMyId();

  const currentTurnPlayer = useMemo(() => {
    if (!state?.currentTurnPlayerId) return null;
    return (
      state.players.find((p) => p.id === state.currentTurnPlayerId) ?? null
    );
  }, [state]);

  const isMyTurn = !!(
    state &&
    myPlayerId &&
    state.currentTurnPlayerId === myPlayerId
  );
  const canVote = !!(
    state &&
    myPlayerId &&
    state.phase === "VOTE" &&
    !isMyTurn
  );
  const hasVoted = !!(
    state &&
    myPlayerId &&
    state.votes?.[myPlayerId] !== undefined
  );

  const currentItem = useMemo(() => {
    if (!state?.currentItem || !tierSet) return null;
    return tierSet.items.find((it) => it.id === state.currentItem) ?? null;
  }, [state?.currentItem, tierSet]);

  const handleExit = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!roomCode || roomCode.length !== CODE_LENGTH || !name) return;

    socketClient.connect();
    roomSocket.joinRoom({ code: roomCode, role: "player", name });

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
  }, [roomCode, name, navigate]);

  useEffect(() => {
    const tierSetId = state?.tierSetId ?? null;
    if (!tierSetId) return;

    roomSocket
      .getTierSet(tierSetId)
      .then(setTierSet)
      .catch((e) =>
        setErr(e instanceof Error ? e.message : "Failed to load tier set")
      );
  }, [state?.tierSetId]);

  // Safety: if host returns to lobby, controller route becomes invalid.
  useEffect(() => {
    if (!state) return;
    if (state.phase === "LOBBY") {
      const q = new URLSearchParams({ name }).toString();
      navigate(`${ROUTES.PLAYER_LOBBY}/${roomCode}?${q}`, { replace: true });
    }
  }, [state?.phase, navigate, roomCode, name, state]);

  const placeIntoTier = async (tierId: TierId) => {
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

  const vote = async (vote: VoteValue) => {
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
            ROOM {state.code} • {name || "PLAYER"}
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
            onPlace={placeIntoTier}
          />
        ) : state.phase === "VOTE" ? (
          <VoteControls
            disabled={!canVote || hasVoted || isVoting}
            alreadyVoted={hasVoted}
            onVote={vote}
            isPlacer={isMyTurn}
          />
        ) : (
          <AwaitingControls />
        )}
      </footer>
    </div>
  );
}
