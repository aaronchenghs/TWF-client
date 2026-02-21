import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import styles from "./PlayerGameController.module.scss";
import { AwaitingControls } from "./Controls/AwaitingControls";
import { PlaceControls } from "./Controls/PlaceControls";
import { VoteControls } from "./Controls/VoteControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { roomSocket } from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";
import { GameStatusCard } from "@/routes/GameRoom/GameStatusCard/GameStatusCard";
import { ROUTES } from "@/routes/routes";
import { getPlayerId } from "@/lib/session";
import { SHOW_CURRENT_ITEM_PHASES } from "@/lib/tierItems";
import { CurrentItemDisplay } from "@/components/CurrentItemDisplay/CurrentItemDisplay";
import { Pill } from "@/components/Pill/Pill";
import { VoteResultsReveal } from "@/routes/GameRoom/Overlays/VoteResultsReveal/VoteResultsReveal";
import { useActionLocks } from "@/lib/hooks/useActionLocks";
import { useTurnTabAttention } from "@/lib/hooks/useTurnTabAttention";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAutoScroll } from "@/lib/hooks/useAutoScroll";

type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierItem = Contracts.TierItem;
type TierId = Contracts.TierId;
type VoteValue = Contracts.VoteValue;

const ACTION_LOCK_TIMEOUT_MS = 6000;
const DISCUSSION_LOCK_MS = 10000;
type ActionLockKey = "place" | "vote";

export default function PlayerGameController({
  state,
}: {
  state: RoomPublicState;
}) {
  const navigate = useNavigate();

  useAutoScroll();

  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);

  const [isPlayAgainSubmitting, setIsPlayAgainSubmitting] = useState(false);
  const [isWaitingForHostRematch, setIsWaitingForHostRematch] = useState(false);
  const [hasHostStartedRematch, setHasHostStartedRematch] = useState(false);

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [voteUnlockAt, setVoteUnlockAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const lastVoteWindowKeyRef = useRef<string | null>(null);

  const myPlayerId = getPlayerId(state.code);
  const myPlayer = useMemo(
    () => state.players.find((player) => player.id === myPlayerId) ?? null,
    [state.players, myPlayerId],
  );

  const isMyTurn = !!myPlayerId && state.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state.phase === "VOTE" && !isMyTurn;
  const hasVoted = !!myPlayerId && state.votes?.[myPlayerId] !== undefined;

  useTurnTabAttention({ isMyTurn });

  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      place: state.phase === "PLACE" && isMyTurn,
      vote: state.phase === "VOTE" && canVote && !hasVoted,
    }),
    [state.phase, isMyTurn, canVote, hasVoted],
  );

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });

  const isPlacing = actionLocks.isLocked("place");
  const isVoting = actionLocks.isLocked("vote");
  const discussionMsLeft =
    state.phase === "VOTE" && voteUnlockAt !== null
      ? Math.max(0, voteUnlockAt - now)
      : 0;
  const discussionSecondsLeft = Math.ceil(discussionMsLeft / 1000);
  const isVoteDiscussionLocked =
    canVote && !hasVoted && discussionSecondsLeft > 0;

  const currentItem: TierItem | null =
    state.currentItem && tierSet
      ? (tierSet.items.find((it) => it.id === state.currentItem) ?? null)
      : null;

  const statusLabel = (() => {
    if (state.phase === "PLACE") return isMyTurn ? "Place" : "Waiting";
    if (state.phase === "VOTE")
      return !isMyTurn && !hasVoted ? "Vote" : "Waiting";
    if (state.phase === "FINISHED") return "Finished";
    return "Waiting";
  })();

  const isWaiting = statusLabel === "Waiting";

  const handlePlaceIntoTier = (tierId: TierId) => {
    if (state.phase !== "PLACE" || !isMyTurn) return;
    if (isPlacing) return;
    if (!socketClient.isConnected()) return;

    actionLocks.lock("place");
    try {
      socketClient.emit("game:place", { tierId });
    } catch {
      actionLocks.unlock("place");
    }
  };

  const handleVote = (vote: VoteValue) => {
    if (isVoteDiscussionLocked) return;
    if (!canVote || hasVoted || isVoting) return;
    if (!socketClient.isConnected()) return;

    actionLocks.lock("vote");
    try {
      socketClient.emit("game:vote", { vote });
    } catch {
      actionLocks.unlock("vote");
    }
  };

  const handleExit = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const handleConfirmExit = useCallback(() => {
    setIsConfirmExitOpen(false);
    window.requestAnimationFrame(handleExit);
  }, [handleExit]);

  const handlePlayAgain = useCallback(() => {
    if (state.phase !== "FINISHED") return;
    if (isPlayAgainSubmitting || isWaitingForHostRematch) return;
    setIsPlayAgainSubmitting(true);
    roomSocket.playAgain();
  }, [state.phase, isPlayAgainSubmitting, isWaitingForHostRematch]);

  useEffect(
    function initializeVoteDiscussionLockWindow() {
      if (state.phase !== "VOTE") {
        lastVoteWindowKeyRef.current = null;
        setVoteUnlockAt(null);
        return;
      }

      const voteWindowKey = `${state.turnIndex}:${state.currentItem ?? "none"}`;
      if (lastVoteWindowKeyRef.current === voteWindowKey) return;
      lastVoteWindowKeyRef.current = voteWindowKey;

      const localUnlockAt = Date.now() + DISCUSSION_LOCK_MS;
      const voteEndsAt = state.timers.voteEndsAt;
      setVoteUnlockAt(
        typeof voteEndsAt === "number"
          ? Math.min(localUnlockAt, voteEndsAt)
          : localUnlockAt,
      );
      setNow(Date.now());
    },
    [state.phase, state.turnIndex, state.currentItem, state.timers.voteEndsAt],
  );

  useEffect(
    function tickVoteDiscussionTimer() {
      if (state.phase !== "VOTE") return;
      if (voteUnlockAt === null) return;
      if (voteUnlockAt <= Date.now()) return;

      const id = window.setInterval(() => {
        const nextNow = Date.now();
        setNow(nextNow);
        if (nextNow >= voteUnlockAt) window.clearInterval(id);
      }, 250);
      return () => window.clearInterval(id);
    },
    [state.phase, voteUnlockAt],
  );

  useEffect(
    function handleIdentity() {
      if (myPlayerId) socketClient.setMyPlayerId(myPlayerId);
    },
    [myPlayerId],
  );

  useEffect(
    function handleTierSetInfo() {
      const tierSetId = state.tierSetId ?? null;
      if (!tierSetId) return;

      let cancelled = false;

      roomSocket.getTierSet(tierSetId).then((ts) => {
        if (!cancelled) setTierSet(ts);
      });

      return () => {
        cancelled = true;
      };
    },
    [state.tierSetId],
  );

  useEffect(
    function subscribeToRematchSignalsWhileFinished() {
      if (state.phase !== "FINISHED") return;

      const offQueued = roomSocket.onPlayAgainQueued(() => {
        setIsPlayAgainSubmitting(false);
        setIsWaitingForHostRematch(true);
        setHasHostStartedRematch(false);
      });

      const offStarted = roomSocket.onPlayAgainStarted(() => {
        setIsPlayAgainSubmitting(false);
        setIsWaitingForHostRematch(false);
        setHasHostStartedRematch(true);
      });

      return () => {
        offQueued();
        offStarted();
      };
    },
    [state.phase],
  );

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.identity}>
            <PlayerAvatar avatar={myPlayer?.avatar} size={34} />
          </div>

          <div className={styles.statusBar}>
            <Pill
              size="lg"
              className={clsx(
                styles.statusPill,
                statusLabel === "Place" && styles.statusPlace,
                statusLabel === "Vote" && styles.statusVote,
                statusLabel === "Waiting" && styles.statusWait,
              )}
            >
              <MainTextTypography variant="label" className={styles.statusText}>
                {statusLabel}
                {isWaiting ? (
                  <AnimatedDots className={styles.statusDots} />
                ) : null}
              </MainTextTypography>
            </Pill>
          </div>

          <AccentButton
            variant="secondary"
            size="small"
            className={styles.exitButton}
            onClick={() => setIsConfirmExitOpen(true)}
          >
            Exit
          </AccentButton>
        </div>

        <GameStatusCard className={styles.itemCard}>
          <CurrentItemDisplay
            item={
              currentItem
                ? { name: currentItem.name, imageSrc: currentItem.imageSrc }
                : null
            }
            isVisible={SHOW_CURRENT_ITEM_PHASES.has(state.phase) || isMyTurn}
            rowClassName={styles.itemRow}
            imageClassName={styles.itemImage}
            fallbackClassName={styles.itemImageFallback}
            nameClassName={styles.itemName}
            textAlign="center"
          />
        </GameStatusCard>
      </main>

      <footer className={styles.actionBar}>
        {state.phase === "PLACE" ? (
          <PlaceControls
            disabled={!isMyTurn || isPlacing}
            tiers={tierSet ? tierSet.tiers : []}
            tierOrder={state.tierOrder}
            onConfirmPlacement={handlePlaceIntoTier}
            currentItem={currentItem}
          />
        ) : state.phase === "VOTE" ? (
          <VoteControls
            disabled={
              !canVote || hasVoted || isVoting || isVoteDiscussionLocked
            }
            alreadyVoted={hasVoted}
            onVote={handleVote}
            isPlacer={isMyTurn}
            discussionSecondsLeft={discussionSecondsLeft}
          />
        ) : state.phase === "FINISHED" ? (
          <div className={styles.finishedActions}>
            <MainTextTypography
              variant="body"
              muted
              textAlign="center"
              className={styles.finishedMessage}
            >
              {hasHostStartedRematch
                ? "Host started a new lobby. Join when ready."
                : isWaitingForHostRematch
                  ? "Waiting for host to play again."
                  : "Ready for another round?"}
            </MainTextTypography>
            <AccentButton
              onClick={handlePlayAgain}
              disabled={isPlayAgainSubmitting || isWaitingForHostRematch}
            >
              {hasHostStartedRematch
                ? isPlayAgainSubmitting
                  ? "Joining..."
                  : "Play Again"
                : isWaitingForHostRematch
                  ? "Waiting for host..."
                  : isPlayAgainSubmitting
                    ? "Sending..."
                    : "Play Again"}
            </AccentButton>
          </div>
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

      <VoteResultsReveal state={state} />
    </div>
  );
}
