import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { roomSocket } from "../../services/sockets/roomSocket";
import { useMemo, useState } from "react";
import { normalizeCode } from "../../lib/codeUtils";
import { CODE_LENGTH, MAX_NAME_LENGTH } from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";

export default function Landing() {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const { code } = await roomSocket.createRoom("host");
    navigate(`${ROUTES.HOST_LOBBY}/${code}`);
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <TWFLogo className={styles.logo} />
        <div className={styles.playActions}>
          <AccentButton onClick={handleCreateRoom}>Create Lobby</AccentButton>
          <MainTextTypography variant="h2">or</MainTextTypography>
          <JoinRoomPanel />
        </div>
      </div>
    </div>
  );
}

export function JoinRoomPanel() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const normalizedCode = useMemo(() => normalizeCode(code), [code]);
  const normalizedName = useMemo(() => name.trim(), [name]);

  const canJoin =
    normalizedCode.length === CODE_LENGTH &&
    normalizedName.length >= 1 &&
    normalizedName.length <= MAX_NAME_LENGTH &&
    !isJoining;

  const handleJoinRoom = async () => {
    if (!canJoin) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      await roomSocket.joinRoomOrThrow({
        code: normalizedCode,
        role: "player",
        name: normalizedName,
      });
      const qString = new URLSearchParams({ name: normalizedName }).toString();
      navigate(`${ROUTES.ROOM}/${normalizedCode}?${qString}`);
    } catch (e) {
      socketClient.disconnect();
      setJoinError(e instanceof Error ? e.message : "Join failed");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.joinCard}>
      <MainTextTypography variant="h4">Join a Lobby</MainTextTypography>
      <div className={styles.joinRow}>
        <AccentTextInput
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE"
          maxLength={CODE_LENGTH}
          fullWidth
        />
        <AccentTextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="YOUR NAME"
          maxLength={MAX_NAME_LENGTH}
          fullWidth
        />
        <AccentButton disabled={!canJoin} onClick={handleJoinRoom}>
          {isJoining ? "Joining..." : "Play"}
        </AccentButton>
      </div>
      {/* TODO: create a proper error snackbar */}
      {joinError ? (
        <MainTextTypography className={styles.joinError} variant="body">
          {joinError}
        </MainTextTypography>
      ) : null}
    </div>
  );
}
