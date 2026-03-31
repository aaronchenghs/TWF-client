/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GameRoom.module.scss";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import { ROUTES } from "@/routes/routes";
import type { RoomPublicState } from "@twf/contracts";
import { TierBoard } from "./TierBoard/TierBoard";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { IS_DEBUG_ENABLED } from "@/config/env";
import { ItemPlacementReveal } from "./Overlays/ItemPlacementReveal/ItemPlacementReveal";
import { PlayerTurnReveal } from "./Overlays/PlayerTurnReveal/PlayerTurnReveal";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { getClientId, saveRoomSession } from "@/lib/session";
import {
  clearHostRoomState,
  markHostRoomStarted,
  readHostRoomCode,
} from "@/lib/roomClientState";
import { useRoomCodeDisplayValue } from "@/lib/roomCode";
import { GameSidePanel } from "./GameSidePanel/GameSidePanel";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import { useFinishedPhaseConfetti } from "@/lib/hooks/useFinishedPhaseConfetti";
import { readSavedHostLobbyShowItemNames } from "@/lib/gameSettings";

export default function GameRoom() {
  const navigate = useNavigate();
  useScreenWakeLock({ enabled: true });
  const { roomCode, isRoomCodeValid, displayRoomCode } =
    useRoomCodeDisplayValue(readHostRoomCode());

  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isRematchSubmitting, setIsRematchSubmitting] = useState(false);
  const [showItemNames] = useState(() => readSavedHostLobbyShowItemNames());
  const [state, setState] = useState<RoomPublicState | null>(() =>
    roomSocket.getLastRoomState(roomCode),
  );
  useFinishedPhaseConfetti(state?.phase ?? null, ROUTES.GAME_ROOM);

  const handleExit = useCallback(() => {
    clearHostRoomState(roomCode);
    roomSocket.closeRoom();
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleBackToLobby = useCallback(() => {
    roomSocket.backToLobby();
  }, []);

  const handleRoomClosed = useCallback(() => {
    clearHostRoomState(roomCode);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomState = useCallback((nextState: RoomPublicState) => {
    setState(nextState);
    if (nextState.phase !== "FINISHED") setIsRematchSubmitting(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (!state || state.phase !== "FINISHED") return;
    setIsRematchSubmitting(true);
    roomSocket.playAgain();
  }, [state]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: handleRoomState,
    onClosed: handleRoomClosed,
  });

  useEffect(
    function persistStartedHostEvidence() {
      if (!state) return;
      if (!roomCode) return;
      if (state.phase === "LOBBY") return;
      markHostRoomStarted(roomCode);
    },
    [state, roomCode],
  );

  useEffect(
    function redirectHostToLobbyAfterRematchRestart() {
      if (!state) return;
      if (state.phase !== "LOBBY") return;
      if (!roomCode) return;
      navigate(ROUTES.HOST_LOBBY, { replace: true });
    },
    [navigate, roomCode, state],
  );

  useEffect(
    function ensureHostGameConnection() {
      if (!roomCode || !isRoomCodeValid) {
        handleRoomClosed();
        return;
      }

      const clientId = getClientId();
      let cancelled = false;

      roomSocket
        .joinRoomOrThrow({ code: roomCode, role: "host", clientId })
        .then(({ state: joinedState }) => {
          if (cancelled) return;
          saveRoomSession({ code: roomCode, role: "host" });
          markHostRoomStarted(roomCode);
          setState(joinedState);
        })
        .catch(() => {
          if (cancelled) return;
          handleRoomClosed();
        });

      return () => {
        cancelled = true;
      };
    },
    [roomCode, isRoomCodeValid, handleRoomClosed],
  );

  if (!state) return <GameRoomConnecting displayRoomCode={displayRoomCode} />;

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        <TierBoard state={state} showItemNames={showItemNames} />
        <GameSidePanel
          state={state}
          roomCode={roomCode}
          onExitClick={() => setIsConfirmExitOpen(true)}
          onPlayAgain={handlePlayAgain}
          isRematchSubmitting={isRematchSubmitting}
        />
      </main>

      {/** --- #region OVERLAYS and MODALS --- */}
      <PlayerTurnReveal state={state} />
      <ItemPlacementReveal state={state} />
      <ConfirmationModal
        open={isConfirmExitOpen}
        title="Leave Game?"
        message="You can either close the room for everyone, or reset the game to the lobby and pick a new tier set."
        maxWidth={720}
        secondaryAction={{
          text: "Back to Lobby",
          onAction: () => {
            setIsConfirmExitOpen(false);
            handleBackToLobby();
          },
        }}
        confirmAction={{
          text: "Exit",
          onAction: () => {
            setIsConfirmExitOpen(false);
            handleExit();
          },
        }}
        destructive
        onCancel={() => setIsConfirmExitOpen(false)}
      />
      <GameRoomDebugControls isPaused={state.debug?.paused ?? false} />
      {/** --- #endregion OVERLAYS and MODALS --- */}
    </div>
  );
}

function GameRoomConnecting({ displayRoomCode }: { displayRoomCode: string }) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <MainTextTypography variant="h2">Game</MainTextTypography>
        <MainTextTypography variant="h5" muted>
          ROOM {displayRoomCode}
        </MainTextTypography>
      </header>

      <div className={styles.center}>
        <MainTextTypography variant="body" muted>
          Connecting
          <AnimatedDots />
        </MainTextTypography>
      </div>
    </div>
  );
}

function GameRoomDebugControls({ isPaused }: { isPaused: boolean }) {
  if (!IS_DEBUG_ENABLED) return null;
  return (
    <div className={styles.devControls}>
      <span>DEV CONTROLS:</span>
      <button type="button" onClick={roomSocket.debugTogglePause}>
        {isPaused ? "Resume" : "Pause"}
      </button>
      <div className={styles.prevNextButtonsGroup}>
        <button type="button" onClick={() => roomSocket.debugPrev()}>
          Prev
        </button>
        <button type="button" onClick={() => roomSocket.debugNext()}>
          Next
        </button>
      </div>
    </div>
  );
}
