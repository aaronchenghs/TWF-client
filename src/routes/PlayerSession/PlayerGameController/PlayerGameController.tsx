import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "../../../assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerGameController.module.scss";
import { AwaitingControls } from "./Controls/AwaitingControls";
import { PlaceControls } from "./Controls/PlaceControls";
import { VoteControls } from "./Controls/VoteControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../components/AccentButton/AccentButton";
import { ConfirmationModal } from "../../../components/ConfirmationModal/ConfirmationModal";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import { roomSocket } from "../../../services/sockets/roomSocket";
import { socketClient } from "../../../services/sockets/socketClient";
import { GameStatusCard } from "../../GameRoom/GameStatusCard/GameStatusCard";
import { ROUTES } from "../../routes";
import { getPlayerId } from "../../../lib/session";
import { SHOW_CURRENT_ITEM_PHASES } from "../../../lib/tierItems";

type RoomPublicState = Contracts.RoomPublicState;
type TierSetDefinition = Contracts.TierSetDefinition;
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

  const myName = useMemo(() => {
    if (!myPlayerId) return "PLAYER";
    return state.players.find((p) => p.id === myPlayerId)?.name ?? "PLAYER";
  }, [state.players, myPlayerId]);

  const isMyTurn = !!myPlayerId && state.currentTurnPlayerId === myPlayerId;
  const canVote = !!myPlayerId && state.phase === "VOTE" && !isMyTurn;
  const hasVoted = !!myPlayerId && state.votes?.[myPlayerId] !== undefined;

  const currentItem = useMemo(() => {
    if (!state.currentItem || !tierSet) return null;
    return tierSet.items.find((it) => it.id === state.currentItem) ?? null;
  }, [state.currentItem, tierSet]);

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
      <header className={styles.header}>
        <TWFLogo className={styles.logo} />
        <div className={styles.headerText}>
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            LOBBY {state.code} • {myName || "PLAYER"}
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
          {SHOW_CURRENT_ITEM_PHASES.has(state.phase) || isMyTurn ? (
            currentItem ? (
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
                      {currentItem.name}
                    </MainTextTypography>
                  </div>
                )}

                <MainTextTypography variant="h4" className={styles.itemName}>
                  {currentItem.name}
                </MainTextTypography>
              </div>
            ) : (
              <MainTextTypography textAlign="center" variant="body" muted>
                —
              </MainTextTypography>
            )
          ) : (
            <MainTextTypography textAlign="center" variant="h4" muted>
              ???
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
