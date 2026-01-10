import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { roomSocket } from "../../services/sockets/roomSocket";
import { socketClient } from "../../services/sockets/socketClient";
import { normalizeCode } from "../../lib/codeUtils";
import { CODE_LENGTH } from "@twf/contracts";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./PlayerLobby.module.scss";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import clsx from "clsx";
import { ConfirmationModal } from "../../components/ConfirmationModal/ConfirmationModal";
import { ROUTES } from "../routes";

export default function PlayerLobby() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  const [isConfirmQuitOpen, setIsConfirmQuitOpen] = useState(false);

  const roomCode = normalizeCode(code ?? "");
  const name = (searchParams.get("name") ?? "").trim();

  const handleConfirmQuit = () => {
    socketClient.disconnect();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!roomCode || roomCode.length !== CODE_LENGTH || !name) return;
    socketClient.connect();
    roomSocket.joinRoom({ code: roomCode, role: "player", name });

    const offClosed = roomSocket.onRoomClosed(() => {
      socketClient.disconnect();
      navigate("/", { replace: true });
    });

    const offState = roomSocket.onRoomState((state) => {
      if (state.phase !== "LOBBY") {
        const queryString = new URLSearchParams({ name }).toString();
        navigate(
          `${ROUTES.PLAYER_GAME_CONTROLLER}/${roomCode}?${queryString}`,
          {
            replace: true,
          }
        );
      }
    });

    return () => {
      offClosed();
      offState();
    };
  }, [roomCode, name, navigate]);

  return (
    <div className={styles.waiting}>
      <TWFLogo className={styles.logo} />

      <section className={styles.identity}>
        <MainTextTypography variant="body" muted>
          YOU ARE:
        </MainTextTypography>
        <MainTextTypography variant="title" weight="medium">
          {name}
        </MainTextTypography>
      </section>

      <GameInstructions />

      <section className={styles.status}>
        <MainTextTypography variant="body" muted letterSpacing="wide">
          WAITING FOR HOST TO START
        </MainTextTypography>
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

      <footer className={styles.footer}>
        <MainTextTypography variant="caption" muted letterSpacing="wide">
          KEEP THIS TAB OPEN
        </MainTextTypography>
      </footer>

      <ConfirmationModal
        open={isConfirmQuitOpen}
        title="Leave lobby?"
        confirmText="Quit"
        destructive
        onCancel={() => setIsConfirmQuitOpen(false)}
        onConfirm={handleConfirmQuit}
      />
    </div>
  );
}

const GameInstructions = () => {
  const [shouldGlow, setShouldGlow] = useState(true);

  return (
    <section
      className={clsx(
        styles.instructions,
        shouldGlow && styles.instructionsGlow
      )}
    >
      <details
        className={styles.instructionsDetails}
        onToggle={() => setShouldGlow(false)}
      >
        <summary className={styles.instructionsSummary}>
          <div className={styles.instructionsSummaryText}>
            <MainTextTypography variant="body" muted letterSpacing="wide">
              HOW TO PLAY
            </MainTextTypography>
            <MainTextTypography variant="body" weight="medium">
              Game Instructions
            </MainTextTypography>
          </div>

          <span className={styles.chevron} aria-hidden="true" />
        </summary>

        <div className={styles.instructionsBody}>
          <div className={styles.instructionsBlock}>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              WHAT THIS IS
            </MainTextTypography>
            <MainTextTypography variant="body" muted>
              A fast, turn-based tier list game. One person places the item.
              Everyone else votes to keep it or drift it.
            </MainTextTypography>
          </div>

          <div className={styles.instructionsBlock}>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              GAME:
            </MainTextTypography>

            <ol className={styles.steps}>
              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Starting:</strong> The host starts the game. A random
                  player is chosen to go first.
                </MainTextTypography>
              </li>

              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Placement (timed):</strong> The next item to be placed
                  is revealed. Only the player whose turn it is can place the
                  item into a tier, others await this decision.
                </MainTextTypography>
              </li>

              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Discussion & Voting (timed):</strong> Everyone who
                  isn’t the placer votes:
                  <br />
                  • Drift Up (Item should be ranked higher!)
                  <br />
                  • Agree
                  <br />• Drift Down (Item should be ranked lower!)
                </MainTextTypography>
              </li>

              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Resolution:</strong> When all votes are in (or time
                  runs out), the item drifts based on the group and locks in.
                </MainTextTypography>
              </li>

              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Next Turn:</strong> Turn passes to the next player in
                  the circle, then the next item reveals.
                </MainTextTypography>
              </li>

              <li>
                <MainTextTypography variant="body" muted>
                  <strong>Finish:</strong> After the last item, the final tier
                  list is ready to share.
                </MainTextTypography>
              </li>
            </ol>
          </div>

          <div className={styles.instructionsBlock}>
            <ul className={styles.tips}>
              <li>
                <MainTextTypography variant="body" muted>
                  Keep this tab open. Rejoining puts you back in the room.
                </MainTextTypography>
              </li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
};
