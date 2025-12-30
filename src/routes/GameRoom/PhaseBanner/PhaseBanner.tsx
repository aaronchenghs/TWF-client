import styles from "./PhaseBanner.module.scss";
import clsx from "clsx";
import type { RoomPublicState } from "@twf/contracts";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import type { PhaseClock } from "../../../lib/hooks/usePhaseClock";

export function PhaseBanner({
  state,
  clock,
  error,
}: {
  state: RoomPublicState;
  clock: PhaseClock;
  error: string | null;
}) {
  const title = phaseTitle(state.phase);

  return (
    <div className={clsx(styles.root, error && styles.error)}>
      <div className={styles.left}>
        <MainTextTypography variant="label" muted letterSpacing="wide">
          PHASE
        </MainTextTypography>
        <MainTextTypography variant="h2">{title}</MainTextTypography>
      </div>

      <div className={styles.right}>
        {clock.secondsLeft != null ? (
          <>
            <MainTextTypography variant="label" muted letterSpacing="wide">
              TIME
            </MainTextTypography>
            <MainTextTypography variant="h2">
              {clock.secondsLeft}s
            </MainTextTypography>
          </>
        ) : (
          <MainTextTypography variant="body" muted>
            —
          </MainTextTypography>
        )}
      </div>
    </div>
  );
}

function phaseTitle(phase: RoomPublicState["phase"]): string {
  switch (phase) {
    case "LOBBY":
      return "Lobby";
    case "STARTING":
      return "Starting";
    case "REVEAL":
      return "Reveal";
    case "PLACE":
      return "Place";
    case "VOTE":
      return "Vote";
    case "RESULTS":
      return "Results";
    case "DRIFT":
      return "Drift";
    case "RESOLVE":
      return "Resolve";
    case "FINISHED":
      return "Finished";
    default:
      return String(phase);
  }
}
