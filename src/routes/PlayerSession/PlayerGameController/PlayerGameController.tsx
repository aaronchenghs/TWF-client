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
    return "Waiting";
  })();

  const isWaiting = statusLabel === "Waiting";

  const handleExit = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const handleConfirmExit = useCallback(() => {
    setIsConfirmExitOpen(false);
    handleExit();
  }, [handleExit]);

  const handlePlaceIntoTier = async (tierId: TierId) => {
    if (state.phase !== "PLACE" || !isMyTurn) return;
    if (isPlacing) return;

    setIsPlacing(true);
    socketClient.emit("game:place", { tierId });
    setIsPlacing(false);
  };

  const handleVote = async (vote: VoteValue) => {
    if (!canVote || hasVoted || isVoting) return;

    setIsVoting(true);
    socketClient.emit("game:vote", { vote });
    setIsVoting(false);
  };

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

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.statusBar}>
            <MainTextTypography
              variant="label"
              letterSpacing="wide"
              className={clsx(
                styles.statusPill,
                statusLabel === "Place" && styles.statusPlace,
                statusLabel === "Vote" && styles.statusVote,
                statusLabel === "Waiting" && styles.statusWait,
              )}
            >
              {statusLabel}
              {isWaiting ? (
                <AnimatedDots className={styles.statusDots} />
              ) : null}
            </MainTextTypography>
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
