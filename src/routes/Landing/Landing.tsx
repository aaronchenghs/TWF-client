import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MainTextTypography";
import { roomSocket } from "../../services/sockets/roomSocket";
import { useState, type KeyboardEvent } from "react";
import {
  normalizeAlphabeticCodeInput,
  normalizeCode,
  normalizeName,
} from "../../lib/stringNormalizers";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";
import { useMobileView } from "../../lib/hooks/useMobileView";
import { WhatIsThisModal } from "../../components/WhatIsThisModal/WhatIsThisModal";
import { CODE_LENGTH } from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
import {
  getClientId,
  getStartedHostSession,
  saveRoomSession,
} from "../../lib/session";
import { AnimatedDots } from "../../components/AnimatedDots/AnimatedDots";
import { APP_ICONS } from "@/lib/constants/icons";
import { DesktopTeaserHeader } from "./DesktopTeaserHeader/DesktopTeaserHeader";
import {
  persistPlayerJoinState,
  readActivePlayerSession,
  readPlayerRuntime,
} from "@/lib/roomClientState";
import { SkipLink } from "@/components/SkipLink/SkipLink";

const { lobbyCode: LobbyCodeIcon } = APP_ICONS;
const JOIN_CODE_HELP_ID = "join-code-help";
const JOIN_LOBBY_ID = "join-lobby";

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useMobileView();
  const [isCreatingLobby, setIsCreatingLobby] = useState<boolean>(false);
  const [isWhatIsThisOpen, setIsWhatIsThisOpen] = useState<boolean>(false);

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
    <main id="main-content" className={styles.landingPage}>
      <SkipLink targetId={JOIN_LOBBY_ID}>Skip to join lobby</SkipLink>

      <nav className={styles.primaryNav} aria-label="Primary">
        <a className={styles.screenReaderNavLink} href={`#${JOIN_LOBBY_ID}`}>
          Join lobby
        </a>
        {!isMobile && <DesktopTeaserHeader />}
      </nav>

      <div className={styles.container}>
        <h1 className={styles.seoHeading}>Tiers! With Friends</h1>
        <TWFLogo
          className={styles.logo}
          role="img"
          aria-label="Tiers With Friends logo"
        />

        <button
          type="button"
          className={styles.howToPlayLink}
          aria-label="What is this?"
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
                aria-label={isCreatingLobby ? "Creating lobby" : "Create Lobby"}
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
    </main>
  );
}

export function JoinRoomPanel() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const normalizedCode = normalizeCode(code);

  const isJoinEnabled = normalizedCode.length === CODE_LENGTH && !isJoining;

  const handleCodeInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
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

    const activePlayerSession = readActivePlayerSession();
    const persistedName =
      normalizeCode(activePlayerSession?.code ?? "") === normalizedCode
        ? normalizeName(activePlayerSession?.name)
        : "";

    try {
      const clientId = getClientId();
      const { state, playerId } = await roomSocket.joinRoomOrThrow({
        code: normalizedCode,
        role: "player",
        name: persistedName,
        clientId,
      });

      const { playerId: existingPlayerId } = readPlayerRuntime(normalizedCode);
      const finalPlayerId = playerId ?? existingPlayerId ?? null;
      const canonicalName =
        (finalPlayerId
          ? state.players.find((player) => player.id === finalPlayerId)?.name
          : null) ?? persistedName;
      const normalizedCanonicalName = normalizeName(canonicalName);

      if (finalPlayerId) socketClient.setMyPlayerId(finalPlayerId);

      persistPlayerJoinState({
        roomCode: normalizedCode,
        name: normalizedCanonicalName,
        playerId: finalPlayerId,
      });

      navigate(
        `${ROUTES.PLAYER_SESSION}?code=${encodeURIComponent(normalizedCode)}`,
      );
    } catch {
      socketClient.disconnect();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div id={JOIN_LOBBY_ID} className={styles.joinCard} tabIndex={-1}>
      <MainTextTypography variant="h4">Join a Lobby</MainTextTypography>
      <MainTextTypography
        variant="p"
        id={JOIN_CODE_HELP_ID}
        className={styles.codeHint}
      >
        Enter the 4-letter lobby code from the host screen. Letters only.
      </MainTextTypography>
      <div className={styles.joinRow}>
        <AccentTextInput
          name="lobby code"
          value={code}
          onChange={(e) =>
            setCode(normalizeAlphabeticCodeInput(e.target.value))
          }
          onKeyDown={handleCodeInputEnter}
          icon={LobbyCodeIcon}
          type="text"
          inputMode="text"
          aria-describedby={JOIN_CODE_HELP_ID}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="CODE"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          fullWidth
        />
        <AccentButton
          disabled={!isJoinEnabled}
          onClick={handleJoinRoom}
          className={styles.joinButton}
        >
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
