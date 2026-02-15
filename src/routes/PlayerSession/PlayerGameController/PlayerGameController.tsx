import { useCallback, useEffect, useState } from "react";
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

type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierItem = Contracts.TierItem;
type TierId = Contracts.TierId;
type VoteValue = Contracts.VoteValue;

export default function PlayerGameController({
  state,
}: {
  state: RoomPublicState;
}) {
  const navigate = useNavigate();

  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const [isPlayAgainSubmitting, setIsPlayAgainSubmitting] = useState(false);
  const [isWaitingForHostRematch, setIsWaitingForHostRematch] = useState(false);
  const [hasHostStartedRematch, setHasHostStartedRematch] = useState(false);

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  const myPlayerId = getPlayerId(state.code);

  const isMyTurn = !!myPlayerId && state.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state.phase === "VOTE" && !isMyTurn;
  const hasVoted = !!myPlayerId && state.votes?.[myPlayerId] !== undefined;

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

    setIsPlacing(true);
    try {
      socketClient.emit("game:place", { tierId });
    } catch {
      setIsPlacing(false);
    }
  };

  const handleVote = (vote: VoteValue) => {
    if (!canVote || hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      socketClient.emit("game:vote", { vote });
    } catch {
      setIsVoting(false);
    }
  };

  const handleExit = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const handleConfirmExit = useCallback(() => {
    setIsConfirmExitOpen(false);
    handleExit();
  }, [handleExit]);

  const handlePlayAgain = useCallback(() => {
    if (state.phase !== "FINISHED") return;
    if (isPlayAgainSubmitting || isWaitingForHostRematch) return;
    setIsPlayAgainSubmitting(true);
    roomSocket.playAgain();
  }, [state.phase, isPlayAgainSubmitting, isWaitingForHostRematch]);

  useEffect(
    function handleIdentity() {
      if (myPlayerId) socketClient.setMyPlayerId(myPlayerId);
    },
    [myPlayerId],
  );

  useEffect(
    function releasePlaceLockAfterStateAdvances() {
      if (state.phase === "PLACE" && isMyTurn) return;
      setIsPlacing(false);
    },
    [state.phase, isMyTurn],
  );

  useEffect(
    function releaseVoteLockAfterStateAdvances() {
      if (state.phase === "VOTE" && canVote && !hasVoted) return;
      setIsVoting(false);
    },
    [state.phase, canVote, hasVoted],
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

        <GameStatusCard label="ITEM" className={styles.itemCard}>
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
            disabled={!canVote || hasVoted || isVoting}
            alreadyVoted={hasVoted}
            onVote={handleVote}
            isPlacer={isMyTurn}
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
