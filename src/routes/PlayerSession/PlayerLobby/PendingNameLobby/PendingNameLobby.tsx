import { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import { MAX_NAME_LENGTH } from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentTextInput } from "@/components/AccentTextInput/AccentTextInput";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { APP_ICONS } from "@/lib/constants/icons";
import { clearPlayerRoomState } from "@/lib/roomClientState";
import { ROUTES } from "@/routes/routes";
import { roomSocket } from "@/services/sockets/roomSocket";
import { normalizeName } from "@/lib/stringNormalizers";
import styles from "./PendingNameLobby.module.scss";

const { playerName: PlayerNameIcon, send: SendIcon } = APP_ICONS;

type PendingNameLobbyProps = {
  roomCode: string;
  initialName?: string | null;
};

export function PendingNameLobby({
  roomCode,
  initialName,
}: PendingNameLobbyProps) {
  const navigate = useNavigate();
  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);
  const [pendingName, setPendingName] = useState(() =>
    normalizeName(initialName),
  );
  const [isSubmittingName, setIsSubmittingName] = useState(false);

  const normalizedPendingName = normalizeName(pendingName);
  const isSubmitEnabled =
    normalizedPendingName.length >= 1 &&
    normalizedPendingName.length <= MAX_NAME_LENGTH &&
    !isSubmittingName;

  const handleConfirmQuit = () => {
    setIsConfirmQuitOpen(false);
    window.requestAnimationFrame(() => {
      clearPlayerRoomState(roomCode);
      roomSocket.leaveRoom();
      navigate(ROUTES.LANDING, { replace: true });
    });
  };

  const handlePendingNameSubmit = async () => {
    if (!isSubmitEnabled) return;
    setIsSubmittingName(true);

    try {
      await roomSocket.setPlayerNameOrThrow(normalizedPendingName, roomCode);
    } catch {
      setIsSubmittingName(false);
    }
  };

  const handlePendingNameInputEnter = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handlePendingNameSubmit();
  };

  useEffect(
    function syncPendingNameDraft() {
      const nextName = normalizeName(initialName);
      if (nextName) setPendingName(nextName);
    },
    [initialName],
  );

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} aria-hidden="true" />

      <section className={styles.namePrompt}>
        <MainTextTypography variant="h3" textAlign="center">
          Enter your name to join the game
        </MainTextTypography>

        <div className={styles.nameForm}>
          <AccentTextInput
            name="username"
            value={pendingName}
            onChange={(event) => setPendingName(event.target.value)}
            onKeyDown={handlePendingNameInputEnter}
            icon={PlayerNameIcon}
            enterKeyHint="go"
            placeholder="YOUR NAME"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            fullWidth
          />

          <AccentButton
            className={styles.nameSubmitButton}
            disabled={!isSubmitEnabled}
            onClick={handlePendingNameSubmit}
          >
            {isSubmittingName ? (
              <MainTextTypography variant="h3">
                Saving
                <AnimatedDots />
              </MainTextTypography>
            ) : (
              <span className={styles.buttonContent}>
                <SendIcon size={18} strokeWidth={2.6} aria-hidden="true" />
                <MainTextTypography variant="h2">Submit</MainTextTypography>
              </span>
            )}
          </AccentButton>
        </div>
      </section>

      <div className={styles.actions}>
        <AccentButton
          variant="secondary"
          className={styles.leaveButton}
          onClick={() => setIsConfirmQuitOpen(true)}
        >
          QUIT
        </AccentButton>
      </div>

      <ConfirmationModal
        open={isConfirmQuitOpen}
        title="Leave lobby?"
        message="This will disconnect you from the lobby."
        confirmAction={{ text: "Quit", onAction: handleConfirmQuit }}
        destructive
        onCancel={() => setIsConfirmQuitOpen(false)}
      />

      <footer className={styles.footer}>
        <MainTextTypography
          variant="caption"
          muted
          letterSpacing="wide"
          className={styles.waitingStatus}
        >
          Waiting for your name
        </MainTextTypography>
      </footer>
    </div>
  );
}
