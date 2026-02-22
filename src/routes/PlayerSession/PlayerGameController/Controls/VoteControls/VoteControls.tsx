import clsx from "clsx";
import baseStyles from "../Controls.module.scss";
import styles from "./VoteControls.module.scss";
import { AwaitingControls } from "../AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import pluralize from "pluralize";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useActionLocks } from "@/lib/hooks/useActionLocks";
import { useEffect, useMemo, useRef, useState } from "react";
import { socketClient } from "@/services/sockets/socketClient";

type VoteValue = Contracts.VoteValue;
const {
  up: VoteUpIcon,
  agree: VoteAgreeIcon,
  down: VoteDownIcon,
} = APP_ICONS.vote;
type ActionLockKey = "vote";
const ACTION_LOCK_TIMEOUT_MS = 6000;
const DISCUSSION_LOCK_MS = 10000;

export function VoteControls(props: {
  phase: Contracts.RoomPublicState["phase"];
  canVote: boolean;
  hasVoted: boolean;
  isPlacer: boolean;
  turnIndex: number;
  currentItemId: string | null;
  voteEndsAt: number | null | undefined;
}) {
  const { phase, canVote, hasVoted, isPlacer, turnIndex, currentItemId, voteEndsAt } =
    props;

  const [voteUnlockAt, setVoteUnlockAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const lastVoteWindowKeyRef = useRef<string | null>(null);

  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      vote: phase === "VOTE" && canVote && !hasVoted,
    }),
    [phase, canVote, hasVoted],
  );

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });
  const isVoting = actionLocks.isLocked("vote");

  useEffect(
    function initializeVoteDiscussionLockWindow() {
      if (phase !== "VOTE") {
        lastVoteWindowKeyRef.current = null;
        setVoteUnlockAt(null);
        return;
      }

      const voteWindowKey = `${turnIndex}:${currentItemId ?? "none"}`;
      if (lastVoteWindowKeyRef.current === voteWindowKey) return;
      lastVoteWindowKeyRef.current = voteWindowKey;

      const localUnlockAt = Date.now() + DISCUSSION_LOCK_MS;
      setVoteUnlockAt(
        typeof voteEndsAt === "number"
          ? Math.min(localUnlockAt, voteEndsAt)
          : localUnlockAt,
      );
      setNow(Date.now());
    },
    [phase, turnIndex, currentItemId, voteEndsAt],
  );

  useEffect(
    function tickVoteDiscussionTimer() {
      if (phase !== "VOTE") return;
      if (voteUnlockAt === null) return;
      if (voteUnlockAt <= Date.now()) return;

      const id = window.setInterval(() => {
        const nextNow = Date.now();
        setNow(nextNow);
        if (nextNow >= voteUnlockAt) window.clearInterval(id);
      }, 250);
      return () => window.clearInterval(id);
    },
    [phase, voteUnlockAt],
  );

  const discussionMsLeft =
    phase === "VOTE" && voteUnlockAt !== null
      ? Math.max(0, voteUnlockAt - now)
      : 0;
  const discussionSecondsLeft = Math.ceil(discussionMsLeft / 1000);
  const isDiscussionLocked =
    canVote && !hasVoted && discussionSecondsLeft > 0;
  const voteButtonIconProps = ICON_PROPS.vote.controls;

  const handleVote = (vote: VoteValue) => {
    if (isDiscussionLocked) return;
    if (!canVote || hasVoted || isVoting) return;
    if (!socketClient.isConnected()) return;

    actionLocks.lock("vote");
    try {
      socketClient.emit("game:vote", { vote });
    } catch {
      actionLocks.unlock("vote");
    }
  };

  const disabled = !canVote || hasVoted || isVoting || isDiscussionLocked;

  if (isPlacer || hasVoted) return <AwaitingControls />;
  return (
    <div className={clsx(baseStyles.controls, styles.voteControls)}>
      {isDiscussionLocked ? (
        <div
          className={styles.discussionNotice}
          role="status"
          aria-live="polite"
        >
          <MainTextTypography
            variant="label"
            className={styles.discussionTitle}
            textAlign="center"
            letterSpacing="wide"
          >
            Discuss first
          </MainTextTypography>
          <MainTextTypography variant="body" textAlign="center">
            Voting unlocks in {pluralize("second", discussionSecondsLeft, true)}
            .
          </MainTextTypography>
        </div>
      ) : null}

      <div className={styles.grid3}>
        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => handleVote(-1)}
          aria-label="Vote drift up"
        >
          <span className={styles.voteButtonContent}>
            <VoteUpIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Drift Up
          </span>
        </AccentButton>

        <AccentButton
          variant="primary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => handleVote(0)}
          aria-label="Vote agree"
        >
          <span className={styles.voteButtonContent}>
            <VoteAgreeIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Agree
          </span>
        </AccentButton>

        <AccentButton
          variant="secondary"
          className={styles.bigButton}
          disabled={disabled}
          onClick={() => handleVote(1)}
          aria-label="Vote drift down"
        >
          <span className={styles.voteButtonContent}>
            <VoteDownIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            Drift Down
          </span>
        </AccentButton>
      </div>
    </div>
  );
}
