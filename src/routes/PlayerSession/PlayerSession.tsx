import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { normalizeCode, normalizeName } from "@/lib/stringNormalizers";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import { CODE_LENGTH, type RoomPublicState } from "@twf/contracts";
import PlayerLobby from "./PlayerLobby/PlayerLobby";
import PlayerGameController from "./PlayerGameController/PlayerGameController";
import { getStartedHostSession, getClientId } from "@/lib/session";
import {
  clearPlayerRoomState,
  persistPlayerJoinState,
  readActivePlayerSession,
  readPlayerRuntime,
} from "@/lib/roomClientState";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { useAppDispatch } from "@/store/store";
import { TAB_TITLES } from "@/lib/constants/tabTitles";
import { setDocumentTitleIfNeeded } from "@/lib/documentTitle";
import { getErrorMessage } from "@/lib/errors";

export default function PlayerSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<RoomPublicState | null>(null);
  const activePlayerSession = readActivePlayerSession();

  const roomCodeFromUrl = normalizeCode(searchParams.get("code") ?? "");
  const storedRoomCode = normalizeCode(activePlayerSession?.code ?? "");
  const roomCode = roomCodeFromUrl || storedRoomCode;
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const persistedName =
    storedRoomCode === roomCode ? normalizeName(activePlayerSession?.name) : "";

  const returnToLanding = useCallback(() => {
    clearPlayerRoomState(roomCode);
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate, roomCode]);

  const handleRoomClosed = useCallback(() => {
    dispatch(
      pushSnackbar({
        severity: "warn",
        title: "Lobby closed",
        message: getErrorMessage("ROOM_CLOSED"),
      }),
    );
    returnToLanding();
  }, [dispatch, returnToLanding]);

  const handleKicked = useCallback(() => {
    dispatch(
      pushSnackbar({
        severity: "warn",
        title: "Kicked",
        message: getErrorMessage("PLAYER_KICKED"),
      }),
    );
    clearPlayerRoomState(roomCode);
    returnToLanding();
  }, [dispatch, roomCode, returnToLanding]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: setState,
    onClosed: handleRoomClosed,
    onKicked: handleKicked,
  });

  useEffect(
    function syncPlayerSessionTitle() {
      const nextTitle =
        state?.phase !== "LOBBY"
          ? TAB_TITLES.PLAYER_IN_GAME
          : TAB_TITLES.PLAYER_LOBBY;

      setDocumentTitleIfNeeded(nextTitle);
    },
    [state?.phase],
  );

  useEffect(
    function handleStateAndConnection() {
      const hostSession = getStartedHostSession();
      if (hostSession) {
        navigate(ROUTES.GAME_ROOM, { replace: true });
        return;
      }

      if (!roomCode || !isRoomCodeValid) {
        returnToLanding();
        return;
      }
      const clientId = getClientId();

      let cancelled = false;

      async function joinAndHydrateSession() {
        try {
          const result = await roomSocket.joinRoomOrThrow({
            code: roomCode,
            role: "player",
            name: persistedName,
            clientId,
          });

          const { state: initialState, playerId } = result;
          const { playerId: existingPlayerId } = readPlayerRuntime(roomCode);

          const finalPlayerId = playerId ?? existingPlayerId ?? null;
          const canonicalName =
            (finalPlayerId
              ? initialState.players.find(
                  (player) => player.id === finalPlayerId,
                )?.name
              : null) ?? persistedName;
          const normalizedCanonicalName = normalizeName(canonicalName);
          if (finalPlayerId) socketClient.setMyPlayerId(finalPlayerId);

          persistPlayerJoinState({
            roomCode,
            name: normalizedCanonicalName,
            playerId: finalPlayerId,
          });

          if (!cancelled) setState(initialState);
        } catch {
          clearPlayerRoomState(roomCode);
          if (!cancelled) returnToLanding();
        }
      }

      joinAndHydrateSession();

      return () => {
        cancelled = true;
      };
    },
    [isRoomCodeValid, navigate, persistedName, returnToLanding, roomCode],
  );

  useEffect(
    function persistLatestResolvedPlayerName() {
      if (!state) return;

      const { playerId } = readPlayerRuntime(roomCode);
      if (!playerId) return;

      const currentPlayer = state.players.find(
        (player) => player.id === playerId,
      );
      if (!currentPlayer) return;

      persistPlayerJoinState({
        roomCode,
        name: normalizeName(currentPlayer.name),
        playerId,
      });
    },
    [roomCode, state],
  );

  if (!state)
    return (
      <div>
        Connecting
        <AnimatedDots />
      </div>
    );

  return state.phase === "LOBBY" ? (
    <PlayerLobby state={state} />
  ) : (
    <PlayerGameController state={state} />
  );
}
