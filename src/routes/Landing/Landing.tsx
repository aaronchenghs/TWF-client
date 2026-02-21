import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MainTextTypography";
import { roomSocket } from "../../services/sockets/roomSocket";
import { useMemo, useState } from "react";
import { normalizeCode } from "../../lib/codeUtils";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";
import { useMobileView } from "../../lib/hooks/useMobileView";
import { HowToPlayModal } from "../../components/HowToPlayModal/HowToPlayModal";
import * as Contracts from "@twf/contracts";
import { socketClient } from "../../services/sockets/socketClient";
import {
  getClientId,
  getStartedHostSession,
  saveRoomSession,
} from "../../lib/session";
import { AnimatedDots } from "../../components/AnimatedDots/AnimatedDots";
import { APP_VERSION } from "@/config/env";
import { useAppDispatch } from "@/store/store";
import { pushSnackbar } from "@/store/slices/snackBarSlice";
const CODE_LENGTH = Contracts.CODE_LENGTH;
const MAX_NAME_LENGTH = Contracts.MAX_NAME_LENGTH;

export default function Landing() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isMobile = useMobileView();
  const [isCreatingLobby, setIsCreatingLobby] = useState<boolean>(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreatingLobby(true);
    try {
      const { code } = await roomSocket.createRoom("host");
      saveRoomSession({ code, role: "host" });
      navigate(`${ROUTES.HOST_LOBBY}/${code}`);
    } catch (e) {
      dispatch(
        pushSnackbar({
          severity: "error",
          title: "Could not create lobby",
          message: e instanceof Error ? e.message : "Request timed out.",
        }),
      );
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
                {isCreatingLobby ? (
                  <>
                    Creating
                    <AnimatedDots />
                  </>
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

      <HowToPlayModal
        key={isHowToOpen ? "howto-open" : "howto-closed"}
        open={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />

      <MainTextTypography
        className={styles.versionTag}
        variant="caption"
        letterSpacing="wide"
      >
        v{APP_VERSION}
      </MainTextTypography>
    </div>
  );
}

export function JoinRoomPanel() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
    const hostSession = getStartedHostSession();
    if (hostSession) {
      navigate(`${ROUTES.GAME_ROOM}/${hostSession.code}`);
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

      saveRoomSession({
        code: normalizedCode,
        role: "player",
        name: normalizedName,
      });

      navigate(`${ROUTES.PLAYER_SESSION}/${normalizedCode}`);
    } catch (e) {
      console.error(e);
      dispatch(
        pushSnackbar({
          severity: "error",
          title: "Could not join",
          message: e instanceof Error ? e.message : "Request timed out.",
        }),
      );
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
          name="lobbycode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          fullWidth
        />
        <AccentTextInput
          name="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="YOUR NAME"
          autoComplete="off"
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
