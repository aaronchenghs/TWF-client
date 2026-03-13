import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MainTextTypography";
import { roomSocket } from "../../services/sockets/roomSocket";
import { useRef, useState, type KeyboardEvent } from "react";
import { normalizeCode, normalizeName } from "../../lib/stringNormalizers";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";
import { useMobileView } from "../../lib/hooks/useMobileView";
import { WhatIsThisModal } from "../../components/WhatIsThisModal/WhatIsThisModal";
import * as Contracts from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
import {
  getClientId,
  getStartedHostSession,
  saveRoomSession,
} from "../../lib/session";
import { persistPlayerJoinState } from "@/lib/roomClientState";
import { AnimatedDots } from "../../components/AnimatedDots/AnimatedDots";
import { APP_VERSION } from "@/config/env";
const CODE_LENGTH = Contracts.CODE_LENGTH;
const MAX_NAME_LENGTH = Contracts.MAX_NAME_LENGTH;

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useMobileView();
  const [isCreatingLobby, setIsCreatingLobby] = useState<boolean>(false);
  const [isWhatIsThisOpen, setIsWhatIsThisOpen] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreatingLobby(true);
    try {
      const { code } = await roomSocket.createRoom("host");
      saveRoomSession({ code, role: "host" });
      navigate(ROUTES.HOST_LOBBY);
    } catch {
      socketClient.disconnect();
    } finally {
      setIsCreatingLobby(false);
    }
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <h1 className={styles.seoHeading}>Tiers! With Friends</h1>
        <TWFLogo className={styles.logo} aria-hidden="true" />

        <button
          type="button"
          className={styles.howToPlayLink}
          onClick={() => setIsWhatIsThisOpen(true)}
        >
          <MainTextTypography variant="caption" muted letterSpacing="wide">
            WHAT IS THIS?
          </MainTextTypography>
        </button>

        <div className={styles.playActions}>
          {!isMobile && (
            <>
              <AccentButton
                disabled={isCreatingLobby}
                onClick={handleCreateRoom}
                className={styles.createButton}
              >
                {isCreatingLobby ? (
                  <MainTextTypography variant="h3">
                    Creating
                    <AnimatedDots />
                  </MainTextTypography>
                ) : (
                  "Create Lobby"
                )}
              </AccentButton>
              <MainTextTypography variant="h3">or</MainTextTypography>
            </>
          )}

          <JoinRoomPanel />
        </div>
      </div>

      <WhatIsThisModal
        open={isWhatIsThisOpen}
        onClose={() => setIsWhatIsThisOpen(false)}
      />

      <MainTextTypography
        className={styles.versionTag}
        variant="caption"
        letterSpacing="wide"
      >
        © 2026 ARC | v{APP_VERSION}
      </MainTextTypography>
    </div>
  );
}

export function JoinRoomPanel() {
  const navigate = useNavigate();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const normalizedCode = normalizeCode(code);
  const normalizedName = normalizeName(name);

  const isJoinEnabled =
    normalizedCode.length === CODE_LENGTH &&
    normalizedName.length >= 1 &&
    normalizedName.length <= MAX_NAME_LENGTH &&
    !isJoining;

  const handleCodeInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    nameInputRef.current?.focus();
  };

  const handleNameInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleJoinRoom();
  };

  const handleJoinRoom = async () => {
    if (!isJoinEnabled) return;
    setIsJoining(true);
    const hostSession = getStartedHostSession();
    if (hostSession) {
      navigate(ROUTES.GAME_ROOM);
      setIsJoining(false);
      return;
    }

    try {
      const clientId = getClientId();
      await roomSocket.joinRoomOrThrow({
        code: normalizedCode,
        role: "player",
        name: normalizedName,
        clientId,
      });

      persistPlayerJoinState({
        roomCode: normalizedCode,
        name: normalizedName,
      });

      navigate(ROUTES.PLAYER_SESSION);
    } catch {
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
          name="lobby code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleCodeInputEnter}
          enterKeyHint="next"
          placeholder="CODE"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          fullWidth
        />
        <AccentTextInput
          ref={nameInputRef}
          name="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleNameInputEnter}
          enterKeyHint="go"
          placeholder="YOUR NAME"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          fullWidth
        />
        <AccentButton disabled={!isJoinEnabled} onClick={handleJoinRoom}>
          {isJoining ? (
            <MainTextTypography variant="h3">
              Joining
              <AnimatedDots />
            </MainTextTypography>
          ) : (
            "Play"
          )}
        </AccentButton>
      </div>
    </div>
  );
}
