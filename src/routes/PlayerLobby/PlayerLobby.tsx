import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import { normalizeCode } from "../../lib/codeUtils";
import { CODE_LENGTH } from "@twf/contracts";

export default function PlayerLobby() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const roomCode = normalizeCode(code ?? "");
  const name = (searchParams.get("name") ?? "").trim();

  useEffect(() => {
    if (!roomCode || roomCode.length !== CODE_LENGTH) return;
    if (!name) return;

    socketClient.connect();
    roomSocket.joinRoom({ code: roomCode, role: "player", name });

    return () => socketClient.disconnect();
  }, [roomCode, name]);

  return null;
}
