import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { normalizeCode, normalizeName } from "@/lib/codeUtils";
import { socketClient } from "@/services/sockets/socketClient";
import { roomSocket } from "@/services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";
import PlayerLobby from "./PlayerLobby/PlayerLobby";
import PlayerGameController from "./PlayerGameController/PlayerGameController";
import {
  clearPlayerId,
  clearRoomSession,
  getStartedHostSession,
  getClientId,
  getPlayerId,
  getRoomSession,
  savePlayerId,
  saveRoomSession,
} from "@/lib/session";
import { useRoomSubscriptions } from "@/lib/hooks/useRoomSubscriptions";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
import { useAppDispatch } from "@/store/store";
import { useUnexpectedExitRejoinNotice } from "@/lib/hooks/useUnexpectedExitRejoinNotice";

type RoomPublicState = Contracts.RoomPublicState;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerSession() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<RoomPublicState | null>(null);
  const dispatch = useAppDispatch();

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;
  const isPlayerUnexpectedExitEligible =
    !!state && state.phase !== "LOBBY" && state.phase !== "FINISHED";

  const returnToLanding = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const handleRoomClosed = useCallback(() => {
    dispatch(
      pushSnackbar({
        severity: "warn",
        title: "Lobby closed",
        message: "The host ended the session.",
      }),
    );
    returnToLanding();
  }, [dispatch, returnToLanding]);

  const handleKicked = useCallback(() => {
    dispatch(
      pushSnackbar({
        severity: "warn",
        title: "Kicked",
        message: "The host removed you from the lobby.",
      }),
    );
    clearRoomSession(roomCode);
    clearPlayerId(roomCode);
    returnToLanding();
  }, [dispatch, roomCode, returnToLanding]);

  useRoomSubscriptions({
    roomCode: isRoomCodeValid ? roomCode : null,
    onState: setState,
    onClosed: handleRoomClosed,
    onKicked: handleKicked,
  });

  useUnexpectedExitRejoinNotice({
    kind: "player",
    roomCode,
    isEligible: isPlayerUnexpectedExitEligible,
  });

  useEffect(
    function handleStateAndConnection() {
      const hostSession = getStartedHostSession();
      if (hostSession) {
        navigate(`${ROUTES.GAME_ROOM}/${hostSession.code}`, { replace: true });
        return;
      }

      if (!roomCode || !isRoomCodeValid) {
        returnToLanding();
        return;
      }
      const nameFromUrl = normalizeName(searchParams.get("name"));
      const clientId = getClientId();
      const session = getRoomSession(roomCode);
      const effectiveName = nameFromUrl || session?.name || "";

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

          const existingPlayerId = getPlayerId(roomCode);
          if (playerId) savePlayerId(roomCode, playerId);

          const finalPlayerId = playerId ?? existingPlayerId ?? null;
          const canonicalName =
            (finalPlayerId
              ? initialState.players.find(
                  (player) => player.id === finalPlayerId,
                )?.name
              : null) ?? effectiveName;

          saveRoomSession({
            code: roomCode,
            role: "player",
            name: canonicalName,
          });

          if (!cancelled) setState(initialState);
        } catch {
          clearRoomSession(roomCode);
          clearPlayerId(roomCode);
          if (!cancelled) returnToLanding();
        }
      }

      joinAndHydrateSession();

      return () => {
        cancelled = true;
      };
    },
    [navigate, roomCode, isRoomCodeValid, searchParams, returnToLanding],
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
