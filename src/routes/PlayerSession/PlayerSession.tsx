import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ROUTES } from "../routes";
import { normalizeCode } from "../../lib/codeUtils";
import { socketClient } from "../../services/sockets/socketClient";
import { roomSocket } from "../../services/sockets/roomSocket";
import * as Contracts from "@twf/contracts";
import PlayerLobby from "./PlayerLobby/PlayerLobby";
import PlayerGameController from "./PlayerGameController/PlayerGameController";

type RoomPublicState = Contracts.RoomPublicState;
const CODE_LENGTH = Contracts.CODE_LENGTH;

export default function PlayerSession() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<RoomPublicState | null>(null);

  const roomCode = useMemo(() => normalizeCode(code ?? ""), [code]);
  const myName = useMemo(
    () => (searchParams.get("name") ?? "").trim(),
    [searchParams],
  );

  const returnToLanding = useCallback(() => {
    socketClient.disconnect();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  useEffect(
    function handleState() {
      if (!roomCode || roomCode.length !== CODE_LENGTH || !myName) {
        returnToLanding();
        return;
      }
      let cancelled = false;

      (async () => {
        try {
          const initial = await roomSocket.joinRoomOrThrow({
            code: roomCode,
            role: "player",
            name: myName,
          });
          if (!cancelled) setState(initial);
        } catch {
          if (!cancelled) returnToLanding();
        }
      })();

      const offState = roomSocket.onRoomState((s) => setState(s));
      const offClosed = roomSocket.onRoomClosed(() => returnToLanding());

      return () => {
        cancelled = true;
        offState();
        offClosed();
      };
    },
    [roomCode, myName, returnToLanding],
  );

  if (!state) return <div>Connecting…</div>;

  return state.phase === "LOBBY" ? (
    <PlayerLobby />
  ) : (
    <PlayerGameController state={state} />
  );
}
