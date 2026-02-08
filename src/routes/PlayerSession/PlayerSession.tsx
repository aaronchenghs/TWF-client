import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  markPendingRejoinNotice,
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

type RoomPublicState = Contracts.RoomPublicState;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerSession() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<RoomPublicState | null>(null);
  const dispatch = useAppDispatch();
  const isInGameRef = useRef(false);

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const isRoomCodeValid = roomCode.length === CODE_LENGTH;

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

  useEffect(
    function keepLatestInGameFlag() {
      isInGameRef.current =
        !!state && state.phase !== "LOBBY" && state.phase !== "FINISHED";
    },
    [state],
  );

  useEffect(function markRejoinNoticeOnUnmount() {
    return () => {
      if (!isInGameRef.current) return;
      if (!socketClient.isConnected()) return;
      markPendingRejoinNotice();
    };
  }, []);

  useEffect(function markRejoinNoticeOnPageHide() {
    const handlePageHide = () => {
      if (!isInGameRef.current) return;
      if (!socketClient.isConnected()) return;
      markPendingRejoinNotice();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(
    function handleStateAndConnection() {
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
    [roomCode, isRoomCodeValid, searchParams, returnToLanding],
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
