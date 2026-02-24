import clsx from "clsx";
import baseStyles from "../Controls.module.scss";
import styles from "./VoteControls.module.scss";
import { AwaitingControls } from "../AwaitingControls/AwaitingControls";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "../../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import pluralize from "pluralize";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useActionLocks } from "@/lib/hooks/useActionLocks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolvePlacedTierId } from "@/lib/tierItems";
import { socketClient } from "@/services/sockets/socketClient";

type VoteValue = Contracts.VoteValue;

type ActionLockKey = "vote" | "confirm";

const ACTION_LOCK_TIMEOUT_MS = 6000;
const DISCUSSION_LOCK_MS = 10000;

const VOTE_OPTIONS = [
  {
    label: "Up 2",
    value: -2 as const,
    Icon: APP_ICONS.vote.up,
    ariaLabel: "Vote drift up 2 tiers",
  },
  {
    label: "Up 1",
    value: -1 as const,
    Icon: APP_ICONS.vote.up,
    ariaLabel: "Vote drift up 1 tier",
  },
  {
    label: "Agree",
    value: 0 as const,
    Icon: APP_ICONS.vote.agree,
    ariaLabel: "Vote agree",
  },
  {
    label: "Down 1",
    value: 1 as const,
    Icon: APP_ICONS.vote.down,
    ariaLabel: "Vote drift down 1 tier",
  },
  {
    label: "Down 2",
    value: 2 as const,
    Icon: APP_ICONS.vote.down,
    ariaLabel: "Vote drift down 2 tiers",
  },
] satisfies Array<{
  label: string;
  value: VoteValue;
  Icon: typeof APP_ICONS.vote.up;
  ariaLabel: string;
}>;

function getVoteToneClassName(vote: VoteValue): string {
  if (vote === -2) return styles.toneUp2;
  if (vote === -1) return styles.toneUp1;
  if (vote === 0) return styles.toneAgree;
  if (vote === 1) return styles.toneDown1;
  return styles.toneDown2;
}

type VoteControlsProps = {
  state: Contracts.RoomPublicState;
  canVote: boolean;
  myVote: VoteValue | null;
  hasConfirmedVote: boolean;
  isPlacer: boolean;
};

export function VoteControls({
  state,
  canVote,
  myVote,
  hasConfirmedVote,
  isPlacer,
}: VoteControlsProps) {
  const [voteUnlockAt, setVoteUnlockAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [lastSentVote, setLastSentVote] = useState<VoteValue | null>(null);
  const [lastSentVoteWindowKey, setLastSentVoteWindowKey] = useState<
    string | null
  >(null);

  const lastVoteWindowKeyRef = useRef<string | null>(null);

  const phase = state.phase;
  const turnIndex = state.turnIndex;
  const currentItemId = state.currentItem ?? null;
  const voteEndsAt = state.timers.voteEndsAt;

  const orderedTierIds =
    state.tierOrder.length > 0
      ? state.tierOrder
      : Object.keys(state.tiers ?? {});

  const placedTierId = resolvePlacedTierId(state, currentItemId);

  const placedTierIndex =
    placedTierId !== null ? orderedTierIds.indexOf(placedTierId) : -1;

  const maxDriftUpSteps =
    placedTierIndex >= 0 ? Math.min(2, Math.max(0, placedTierIndex)) : 2;

  const maxDriftDownSteps =
    placedTierIndex >= 0
      ? Math.min(2, Math.max(0, orderedTierIds.length - 1 - placedTierIndex))
      : 2;

  const activeVoteWindowKey =
    phase === "VOTE" ? `${turnIndex}:${currentItemId ?? "none"}` : null;

  const lastSentVoteForActiveWindow =
    activeVoteWindowKey !== null &&
    activeVoteWindowKey === lastSentVoteWindowKey
      ? lastSentVote
      : null;

  const discussionMsLeft =
    phase === "VOTE" && voteUnlockAt !== null
      ? Math.max(0, voteUnlockAt - now)
      : 0;

  const discussionSecondsLeft = Math.ceil(discussionMsLeft / 1000);

  const isDiscussionLocked =
    canVote && !hasConfirmedVote && discussionSecondsLeft > 0;

  const voteButtonIconProps = ICON_PROPS.vote.controls;

  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      vote:
        phase === "VOTE" &&
        canVote &&
        !hasConfirmedVote &&
        lastSentVoteForActiveWindow !== null &&
        myVote !== lastSentVoteForActiveWindow,
      confirm: phase === "VOTE" && canVote && !hasConfirmedVote,
    }),
    [phase, canVote, hasConfirmedVote, myVote, lastSentVoteForActiveWindow],
  );

  const voteOptions = useMemo(
    () =>
      VOTE_OPTIONS.filter((opt) => {
        if (opt.value < 0) return Math.abs(opt.value) <= maxDriftUpSteps;
        if (opt.value > 0) return opt.value <= maxDriftDownSteps;
        return true;
      }),
    [maxDriftUpSteps, maxDriftDownSteps],
  );

  const hasSelectableVote =
    myVote !== null && voteOptions.some((opt) => opt.value === myVote);

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });

  const isVoting = actionLocks.isLocked("vote");

  const isConfirming = actionLocks.isLocked("confirm");

  const disabledVote = !canVote || hasConfirmedVote || isVoting || isConfirming;

  const disabledConfirm =
    !canVote ||
    hasConfirmedVote ||
    isConfirming ||
    isVoting ||
    isDiscussionLocked ||
    !hasSelectableVote;

  const handleVote = (vote: VoteValue) => {
    if (isDiscussionLocked) return;
    if (!canVote || hasConfirmedVote || isVoting || isConfirming) return;
    if (!socketClient.isConnected()) return;

    setLastSentVoteWindowKey(activeVoteWindowKey);
    setLastSentVote(vote);
    actionLocks.lock("vote");
    try {
      socketClient.emit("game:vote", { vote });
    } catch {
      actionLocks.unlock("vote");
    }
  };

  const handleConfirm = useCallback(() => {
    if (!socketClient.isConnected()) return;

    actionLocks.lock("confirm");
    try {
      socketClient.emit("game:voteConfirm");
    } catch {
      actionLocks.unlock("confirm");
    }
  }, [actionLocks]);

  useEffect(
    function initializeVoteDiscussionLockWindow() {
      if (phase !== "VOTE") {
        lastVoteWindowKeyRef.current = null;
        setVoteUnlockAt(null);
        return;
      }

      const voteWindowKey = activeVoteWindowKey;
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
    [phase, activeVoteWindowKey, voteEndsAt],
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

  if (isPlacer || hasConfirmedVote) return <AwaitingControls />;

  return (
    <div className={clsx(baseStyles.controls, styles.voteControls)}>
      <div className={styles.voteBody}>
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
              Voting unlocks in{" "}
              {pluralize("second", discussionSecondsLeft, true)}.
            </MainTextTypography>
          </div>
        ) : null}

        <div
          className={styles.grid3}
          role="group"
          aria-label="Vote drift amount"
        >
          {voteOptions.map((opt) => {
            const isSelected = myVote === opt.value;
            return (
              <AccentButton
                key={opt.label}
                variant={isSelected ? "primary" : "secondary"}
                className={styles.bigButton}
                disabled={disabledVote || isDiscussionLocked}
                onClick={() => handleVote(opt.value)}
                aria-label={opt.ariaLabel}
                aria-pressed={isSelected}
              >
                <span
                  className={clsx(
                    styles.voteButtonContent,
                    getVoteToneClassName(opt.value),
                  )}
                >
                  <opt.Icon
                    className={styles.voteButtonIcon}
                    {...voteButtonIconProps}
                    aria-hidden
                  />
                  {opt.label}
                </span>
              </AccentButton>
            );
          })}
        </div>
      </div>

      <div className={styles.confirmRow}>
        <AccentButton
          variant="primary"
          className={styles.confirmButton}
          disabled={disabledConfirm}
          onClick={handleConfirm}
        >
          CONFIRM
        </AccentButton>
      </div>
    </div>
  );
}

export default VoteControls;
