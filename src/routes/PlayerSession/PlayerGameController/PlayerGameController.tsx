/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayerGameController.module.scss";
import type {
  RoomPublicState,
  TierSetDefinition,
  TierItem,
} from "@twf/contracts";
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
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import { useFinishedPhaseConfetti } from "@/lib/hooks/useFinishedPhaseConfetti";

export default function PlayerGameController({
  state,
}: {
  state: RoomPublicState;
}) {
  const navigate = useNavigate();
  useAutoScroll();
  useScreenWakeLock({ enabled: true });
  useFinishedPhaseConfetti(state.phase, ROUTES.PLAYER_SESSION);

  const [tierSet, setTierSet] = useState<TierSetDefinition | null>(null);

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState<boolean>(false);
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
    roomSocket.leaveRoom();
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
        confirmAction={{ text: "Exit", onAction: handleConfirmExit }}
        destructive
        onCancel={() => setIsConfirmExitOpen(false)}
      />
    </div>
  );
}
