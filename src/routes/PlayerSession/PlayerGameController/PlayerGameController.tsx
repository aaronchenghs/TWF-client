import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayerGameController.module.scss";
import * as Contracts from "@twf/contracts";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { roomSocket } from "@/services/sockets/roomSocket";
import { socketClient } from "@/services/sockets/socketClient";
import { ROUTES } from "@/routes/routes";
import { SHOW_CURRENT_ITEM_PHASES } from "@/lib/tierItems";
import { CurrentItemDisplay } from "@/components/CurrentItemDisplay/CurrentItemDisplay";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { useTurnTabAttention } from "@/lib/hooks/useTurnTabAttention";
import { useAutoScroll } from "@/lib/hooks/useAutoScroll";
import { clearPlayerRoomState, readPlayerRuntime } from "@/lib/roomClientState";
import { Controls } from "./Controls/Controls";
import { PlayerTopBar } from "./TopBar/PlayerTopBar";
import { GameStatusCard } from "@/routes/GameRoom/GameSidePanel/GameStatusCard/GameStatusCard";

type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
type TierItem = Contracts.TierItem;

export default function PlayerGameController({
  state,
}: {
  state: RoomPublicState;
}) {
  const navigate = useNavigate();
  useAutoScroll();

  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const { playerId: myPlayerId } = readPlayerRuntime(state.code);

  const myPlayer = useMemo(
    () => state.players.find((player) => player.id === myPlayerId) ?? null,
    [state.players, myPlayerId],
  );

  const isMyTurn = !!myPlayerId && state.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state.phase === "VOTE" && !isMyTurn;
  const myVote = myPlayerId ? (state.votes?.[myPlayerId] ?? null) : null;
  const hasConfirmedVote =
    !!myPlayerId && !!state.voteConfirmedByPlayerId?.[myPlayerId];

  const currentTurnPlayer = useMemo(
    () =>
      state.currentTurnPlayerId
        ? (state.players.find(
            (player) => player.id === state.currentTurnPlayerId,
          ) ?? null)
        : null,
    [state.players, state.currentTurnPlayerId],
  );

  const hiddenItemText =
    state.phase === "PLACE" && !isMyTurn ? (
      <span className={styles.hiddenPlacementText}>
        <MainTextTypography variant="h2" tone="player">
          {currentTurnPlayer?.name ?? "Someone"}
        </MainTextTypography>
        <MainTextTypography variant="h2" muted>
          is placing
        </MainTextTypography>
      </span>
    ) : undefined;

  useTurnTabAttention({ isMyTurn });

  const currentItem: TierItem | null =
    state.currentItem && tierSet
      ? (tierSet.items.find((it) => it.id === state.currentItem) ?? null)
      : null;

  const handleExit = useCallback(() => {
    clearPlayerRoomState(state.code);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, state.code]);

  const handleConfirmExit = useCallback(() => {
    setIsConfirmExitOpen(false);
    window.requestAnimationFrame(handleExit);
  }, [handleExit]);

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
        <PlayerTopBar
          phase={state.phase}
          isMyTurn={isMyTurn}
          hasConfirmedVote={hasConfirmedVote}
          player={myPlayer}
          onExit={() => setIsConfirmExitOpen(true)}
        />

        <GameStatusCard className={styles.itemCard}>
          <CurrentItemDisplay
            item={currentItem}
            isVisible={SHOW_CURRENT_ITEM_PHASES.has(state.phase) || isMyTurn}
            containerClassName={styles.itemRow}
            textAlign="center"
            hiddenText={hiddenItemText}
          />
        </GameStatusCard>
      </main>

      <Controls
        state={state}
        tierSet={tierSet}
        currentItem={currentItem}
        isMyTurn={isMyTurn}
        canVote={canVote}
        myVote={myVote}
        hasConfirmedVote={hasConfirmedVote}
      />

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
