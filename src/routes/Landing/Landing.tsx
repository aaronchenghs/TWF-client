import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { roomSocket } from "../../services/sockets/roomSocket";
import { useMemo, useState } from "react";
import { normalizeCode } from "../../lib/codeUtils";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";
import { useMobileView } from "../../lib/hooks/useMobileView";
import { HowToPlayModal } from "../../components/HowToPlayModal/HowToPlayModal";
import * as Contracts from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
const CODE_LENGTH = Contracts.CODE_LENGTH;
const MAX_NAME_LENGTH = Contracts.MAX_NAME_LENGTH;

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useMobileView();
  const [isCreatingLobby, setIsCreatingLobby] = useState<boolean>(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreatingLobby(true);
    try {
      const { code } = await roomSocket.createRoom("host");
      navigate(`${ROUTES.HOST_LOBBY}/${code}`);
    } finally {
      setIsCreatingLobby(false);
    }
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <TWFLogo className={styles.logo} />

        <button
          type="button"
          className={styles.howToPlayLink}
          onClick={() => setIsHowToOpen(true)}
        >
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            HOW TO PLAY
          </MainTextTypography>
        </button>

        <div className={styles.playActions}>
          {!isMobile && (
            <>
              <AccentButton
                disabled={isCreatingLobby}
                onClick={handleCreateRoom}
              >
                {isCreatingLobby ? "Creating..." : "Create Lobby"}
              </AccentButton>
              <MainTextTypography variant="h2">or</MainTextTypography>
            </>
          )}

          <JoinRoomPanel />
        </div>
      </div>

      <HowToPlayModal
        key={isHowToOpen ? "howto-open" : "howto-closed"}
        open={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}

export function JoinRoomPanel() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
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

    try {
      await roomSocket.joinRoomOrThrow({
        code: normalizedCode,
        role: "player",
        name: normalizedName,
      });

      const qString = new URLSearchParams({ name: normalizedName }).toString();
      navigate(`${ROUTES.PLAYER_SESSION}/${normalizedCode}?${qString}`);
    } catch (e) {
      console.error(e);
      socketClient.disconnect();
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
          Play
        </AccentButton>
      </div>
    </div>
  );
}
