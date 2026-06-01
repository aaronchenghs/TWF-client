import { useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "@/assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import { MAX_NAME_LENGTH, type RoomPublicState } from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { AccentTextInput } from "@/components/AccentTextInput/AccentTextInput";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";
import { HowToPlayModal } from "@/components/HowToPlayModal/HowToPlayModal";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";
import { roomSocket } from "@/services/sockets/roomSocket";
import { ROUTES } from "@/routes/routes";
import { getPlayerNameById, hasSubmittedPlayerName } from "@/lib/players";
import { PlayerAvatar } from "@/components/PlayerAvatar/PlayerAvatar";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import { useAutoScroll } from "@/lib/hooks/useAutoScroll";
import { clearPlayerRoomState, readPlayerRuntime } from "@/lib/roomClientState";
import { APP_ICONS } from "@/lib/constants/icons";
import { normalizeName } from "@/lib/stringNormalizers";

const { playerName: PlayerNameIcon, send: SendIcon } = APP_ICONS;

export default function PlayerLobby({ state }: { state: RoomPublicState }) {
  const navigate = useNavigate();
  useAutoScroll();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState<boolean>(false);
  const [isHowToOpen, setIsHowToOpen] = useState<boolean>(false);
  const identityNameRef = useRef<HTMLSpanElement | null>(null);

  const { playerId: myPlayerId } = readPlayerRuntime(state.code);
  const myPlayer = myPlayerId
    ? (state.players.find((player) => player.id === myPlayerId) ?? null)
    : null;

  const [pendingName, setPendingName] = useState<string>(() =>
    normalizeName(myPlayer?.name),
  );
  const [isSubmittingName, setIsSubmittingName] = useState<boolean>(false);

  const myName = myPlayer?.name ?? getPlayerNameById(state.players, myPlayerId);
  const hasSubmittedName = hasSubmittedPlayerName(myPlayer?.name);
  const normalizedPendingName = normalizeName(pendingName);
  const isSubmitEnabled =
    normalizedPendingName.length >= 1 &&
    normalizedPendingName.length <= MAX_NAME_LENGTH &&
    !isSubmittingName;

  useAutoFitText(identityNameRef, {
    minFontSizePx: 20,
    watch: myName,
  });

  const handleConfirmQuit = () => {
    setIsConfirmQuitOpen(false);
    window.requestAnimationFrame(() => {
      clearPlayerRoomState(state.code);
      roomSocket.leaveRoom();
      navigate(ROUTES.LANDING, { replace: true });
    });
  };

  const handlePendingNameSubmit = async () => {
    if (!isSubmitEnabled) return;
    setIsSubmittingName(true);

    try {
      await roomSocket.setPlayerNameOrThrow(normalizedPendingName, state.code);
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

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} aria-hidden="true" />

      <section className={styles.panel}>
        {!hasSubmittedName ? (
          <>
            <div className={styles.pendingIdentity}>
              <PlayerAvatar avatar={myPlayer?.avatar} sway size={64} />
            </div>

            <div className={styles.pendingContent}>
              <MainTextTypography variant="h3" textAlign="center">
                Who are you?
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
                      <SendIcon
                        size={18}
                        strokeWidth={2.6}
                        aria-hidden="true"
                      />
                      <MainTextTypography variant="h2">
                        Submit
                      </MainTextTypography>
                    </span>
                  )}
                </AccentButton>
              </div>
            </div>
          </>
        ) : (
          <>
            <MainTextTypography variant="body" muted>
              YOU ARE:
            </MainTextTypography>
            <div className={styles.identityRow}>
              <PlayerAvatar avatar={myPlayer?.avatar} sway size={52} />
              <MainTextTypography
                variant="h2"
                weight="medium"
                letterSpacing="wide"
                className={styles.identityName}
                ref={identityNameRef}
                tone="player"
              >
                {myName}
              </MainTextTypography>
            </div>
          </>
        )}
      </section>

      {hasSubmittedName ? (
        <section className={styles.instructions}>
          <button
            type="button"
            className={styles.instructionsTrigger}
            onClick={() => setIsHowToOpen(true)}
          >
            <div className={styles.instructionsSummaryText}>
              <MainTextTypography variant="body" muted letterSpacing="wide">
                HOW TO PLAY
              </MainTextTypography>
              <MainTextTypography variant="body" weight="medium">
                Game Instructions
              </MainTextTypography>
            </div>
          </button>
        </section>
      ) : null}

      <div className={styles.actions}>
        <AccentButton
          variant="secondary"
          onClick={() => setIsConfirmQuitOpen(true)}
        >
          QUIT
        </AccentButton>
      </div>

      {hasSubmittedName ? (
        <footer className={styles.footer}>
          <MainTextTypography
            variant="caption"
            muted
            letterSpacing="wide"
            className={styles.waitingStatus}
          >
            Waiting for host
            <AnimatedDots className={styles.waitingDots} />
          </MainTextTypography>
        </footer>
      ) : null}

      <ConfirmationModal
        open={isConfirmQuitOpen}
        title="Leave lobby?"
        message="This will disconnect you from the lobby."
        confirmAction={{ text: "Quit", onAction: handleConfirmQuit }}
        destructive
        onCancel={() => setIsConfirmQuitOpen(false)}
      />

      <HowToPlayModal
        open={isHowToOpen}
        onClose={() => setIsHowToOpen(false)}
      />
    </div>
  );
}
