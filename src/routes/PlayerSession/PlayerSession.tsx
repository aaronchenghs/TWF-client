import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { normalizeCode, normalizeName } from "@/lib/codeUtils";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";
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
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";
import { TAB_TITLES } from "@/lib/tabTitles";
import { getErrorMessage } from "@/lib/errors";

type RoomPublicState = Contracts.RoomPublicState;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<RoomPublicState | null>(null);
  const activePlayerSession = readActivePlayerSession();

  const roomCode = normalizeCode(activePlayerSession?.code ?? "");
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const isPlayerUnexpectedExitEligible =
    !!state && state.phase !== "LOBBY" && state.phase !== "FINISHED";

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

  useUnexpectedExitRejoinNotice({
    kind: "player",
    roomCode,
    isEligible: isPlayerUnexpectedExitEligible,
  });

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

      if (document.title !== nextTitle) document.title = nextTitle;
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
      const nameFromUrl = normalizeName(searchParams.get("name"));
      const clientId = getClientId();
      const effectiveName = nameFromUrl || activePlayerSession?.name || "";

      if (!effectiveName) {
        returnToLanding();
        return;
      }

      let cancelled = false;

      async function joinAndHydrateSession() {
        try {
          const result = await roomSocket.joinRoomOrThrow({
            code: roomCode,
            role: "player",
            name: effectiveName,
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
              : null) ?? effectiveName;

          persistPlayerJoinState({
            roomCode,
            name: canonicalName,
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
    [
      navigate,
      roomCode,
      isRoomCodeValid,
      searchParams,
      returnToLanding,
      activePlayerSession?.name,
    ],
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
