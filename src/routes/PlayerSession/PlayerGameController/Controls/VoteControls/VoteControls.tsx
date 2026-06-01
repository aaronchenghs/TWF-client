import clsx from "clsx";
import baseStyles from "../Controls.module.scss";
import styles from "./VoteControls.module.scss";
import { AwaitingControls } from "../AwaitingControls/AwaitingControls";
import type { RoomPublicState } from "@twf/contracts";
import { AccentButton } from "../../../../../components/AccentButton/AccentButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import pluralize from "pluralize";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { useActionLocks } from "@/lib/hooks/useActionLocks";
import {
  type ActionLockKey,
  type UnlockCooldownKey,
  type VoteValue,
  VOTE_OPTIONS,
  getVoteToneButtonClassName,
  getVoteToneClassName,
} from "@/lib/voting";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { socketClient } from "@/services/sockets/socketClient";
import { useMobileView } from "@/lib/hooks/useMobileView";

const ACTION_LOCK_TIMEOUT_MS = 6000;
const DISCUSSION_LOCK_MS = 10000;
const UNLOCK_VOTE_DELAY_MS = 1500;

type VoteControlsProps = {
  state: RoomPublicState;
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
  const isMobile = useMobileView();
  const [voteUnlockAt, setVoteUnlockAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [lastSentVote, setLastSentVote] = useState<VoteValue | null>(null);
  const [lastSentVoteWindowKey, setLastSentVoteWindowKey] = useState<
    string | null
  >(null);

  const lastVoteWindowKeyRef = useRef<string | null>(null);
  const lockedVoteWindowKeyRef = useRef<string | null>(null);
  const selectedVoteRef = useRef<VoteValue | null>(myVote);
  const pendingVoteRequestRef = useRef<{
    windowKey: string | null;
    vote: VoteValue;
  } | null>(null);

  const phase = state.phase;
  const turnIndex = state.turnIndex;
  const currentItemId = state.currentItem ?? null;
  const voteEndsAt = state.timers.voteEndsAt;

  const activeVoteWindowKey =
    phase === "VOTE" ? `${turnIndex}:${currentItemId ?? "none"}` : null;

  const lastSentVoteForActiveWindow =
    activeVoteWindowKey !== null &&
    activeVoteWindowKey === lastSentVoteWindowKey
      ? lastSentVote
      : null;

  const selectedVote = lastSentVoteForActiveWindow ?? myVote;

  const discussionMsLeft =
    phase === "VOTE" && voteUnlockAt !== null
      ? Math.max(0, voteUnlockAt - now)
      : 0;

  const discussionSecondsLeft = Math.ceil(discussionMsLeft / 1000);

  const isDiscussionLocked =
    canVote && !hasConfirmedVote && discussionSecondsLeft > 0;

  const voteButtonIconProps = ICON_PROPS.vote.controls;
  const buttonLabelVariant = isMobile ? "h2" : "h3";
  const VoteActionIcon = hasConfirmedVote ? APP_ICONS.unlock : APP_ICONS.lock;

  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      confirm: phase === "VOTE" && canVote && !hasConfirmedVote,
      unlock: phase === "VOTE" && canVote && hasConfirmedVote,
    }),
    [phase, canVote, hasConfirmedVote],
  );

  const hasSelectableVote =
    selectedVote !== null &&
    VOTE_OPTIONS.some((opt) => opt.value === selectedVote);

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });
  const unlockCooldownLocks = useActionLocks<UnlockCooldownKey>(
    { unlockCooldown: phase === "VOTE" && hasConfirmedVote },
    { timeoutMs: UNLOCK_VOTE_DELAY_MS },
  );

  const isConfirming = actionLocks.isLocked("confirm");
  const isUnlocking = actionLocks.isLocked("unlock");
  const isUnlockVoteDelayed = unlockCooldownLocks.isLocked("unlockCooldown");

  const isVoteDisabled =
    !canVote || hasConfirmedVote || isConfirming || isUnlocking;

  const isLockInVoteDisabled =
    !canVote ||
    hasConfirmedVote ||
    isConfirming ||
    isUnlocking ||
    isDiscussionLocked ||
    !hasSelectableVote;

  const isUnlockVoteDisabled =
    !canVote || !hasConfirmedVote || isUnlocking || isUnlockVoteDelayed;

  const handleVote = useCallback(
    (vote: VoteValue) => {
      if (selectedVoteRef.current === vote) return;
      if (isDiscussionLocked) return;
      if (!canVote || hasConfirmedVote || isConfirming) return;
      if (!socketClient.isConnected()) return;

      const pendingVoteRequest = pendingVoteRequestRef.current;
      if (
        pendingVoteRequest !== null &&
        pendingVoteRequest.windowKey === activeVoteWindowKey &&
        pendingVoteRequest.vote === vote
      ) {
        return;
      }

      selectedVoteRef.current = vote;
      pendingVoteRequestRef.current = {
        windowKey: activeVoteWindowKey,
        vote,
      };
      setLastSentVoteWindowKey(activeVoteWindowKey);
      setLastSentVote(vote);
      try {
        socketClient.emit("game:vote", { vote });
      } catch {
        pendingVoteRequestRef.current = null;
      }
    },
    [
      activeVoteWindowKey,
      canVote,
      hasConfirmedVote,
      isConfirming,
      isDiscussionLocked,
    ],
  );

  const handleVoteButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, vote: VoteValue) => {
      if (selectedVoteRef.current === vote) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handleVote(vote);
    },
    [handleVote],
  );

  const handleLockInVote = useCallback(() => {
    if (!socketClient.isConnected()) return;

    actionLocks.lock("confirm");
    try {
      socketClient.emit("game:voteConfirm");
    } catch {
      actionLocks.unlock("confirm");
    }
  }, [actionLocks]);

  const handleUnlockVote = useCallback(() => {
    if (!socketClient.isConnected()) return;

    actionLocks.lock("unlock");
    try {
      socketClient.emit("game:voteUnlock");
    } catch {
      actionLocks.unlock("unlock");
    }
  }, [actionLocks]);

  useEffect(
    function syncSelectedVoteRef() {
      selectedVoteRef.current = selectedVote;
    },
    [selectedVote],
  );

  useEffect(
    function initializeVoteDiscussionLockWindow() {
      if (phase !== "VOTE") {
        lastVoteWindowKeyRef.current = null;
        lockedVoteWindowKeyRef.current = null;
        pendingVoteRequestRef.current = null;
        queueMicrotask(() => {
          setVoteUnlockAt(null);
        });
        return;
      }

      const voteWindowKey = activeVoteWindowKey;
      if (lastVoteWindowKeyRef.current === voteWindowKey) return;
      lastVoteWindowKeyRef.current = voteWindowKey;

      const localUnlockAt = Date.now() + DISCUSSION_LOCK_MS;
      queueMicrotask(() => {
        setVoteUnlockAt(
          typeof voteEndsAt === "number"
            ? Math.min(localUnlockAt, voteEndsAt)
            : localUnlockAt,
        );
        setNow(Date.now());
      });
    },
    [phase, activeVoteWindowKey, voteEndsAt],
  );

  useEffect(
    function initializeUnlockVoteDelayWindow() {
      if (
        phase !== "VOTE" ||
        activeVoteWindowKey === null ||
        !hasConfirmedVote
      ) {
        lockedVoteWindowKeyRef.current = null;
        return;
      }

      if (lockedVoteWindowKeyRef.current === activeVoteWindowKey) return;
      lockedVoteWindowKeyRef.current = activeVoteWindowKey;
      unlockCooldownLocks.lock("unlockCooldown");
    },
    [phase, activeVoteWindowKey, hasConfirmedVote, unlockCooldownLocks],
  );

  useEffect(
    function clearPendingVoteRequestWhenVoteWindowChangesOrSyncs() {
      if (activeVoteWindowKey === null) {
        pendingVoteRequestRef.current = null;
        return;
      }

      const pendingVoteRequest = pendingVoteRequestRef.current;
      if (!pendingVoteRequest) return;

      if (pendingVoteRequest.windowKey !== activeVoteWindowKey) {
        pendingVoteRequestRef.current = null;
        return;
      }

      if (myVote !== null && pendingVoteRequest.vote === myVote)
        pendingVoteRequestRef.current = null;
    },
    [activeVoteWindowKey, myVote],
  );

  useEffect(
    function tickVoteTimers() {
      if (phase !== "VOTE") return;

      const deadlines = [voteUnlockAt].filter(
        (deadline): deadline is number => deadline !== null,
      );
      if (deadlines.length === 0) return;

      const nextDeadline = Math.max(...deadlines);
      if (nextDeadline <= Date.now()) return;

      const id = window.setInterval(() => {
        const nextNow = Date.now();
        setNow(nextNow);
        if (nextNow >= nextDeadline) window.clearInterval(id);
      }, 250);
      return () => window.clearInterval(id);
    },
    [phase, voteUnlockAt],
  );

  const voteActionLabel = hasConfirmedVote
    ? isUnlocking
      ? "Unlocking..."
      : "Unlock Vote"
    : isConfirming
      ? "Locking In..."
      : "Lock In Vote";

  const handleVoteAction = hasConfirmedVote
    ? handleUnlockVote
    : handleLockInVote;
  const isVoteActionDisabled = hasConfirmedVote
    ? isUnlockVoteDisabled
    : isLockInVoteDisabled;

  if (isPlacer) return <AwaitingControls />;

  return (
    <div className={clsx(baseStyles.controls, styles.voteControls)}>
      <div className={styles.voteBody}>
        {isDiscussionLocked && (
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
              {`Voting unlocks in `}
              {pluralize("second", discussionSecondsLeft, true)}.
            </MainTextTypography>
          </div>
        )}

        <div
          className={styles.grid3}
          role="group"
          aria-label="Vote placement adjustment"
        >
          {VOTE_OPTIONS.map((opt) => {
            const isSelected = selectedVote === opt.value;
            return (
              <AccentButton
                key={opt.label}
                variant={isSelected ? "primary" : "secondary"}
                selected={isSelected}
                className={clsx(
                  styles.bigButton,
                  styles[getVoteToneButtonClassName(opt.value)],
                )}
                disabled={isVoteDisabled || isDiscussionLocked}
                onClick={(event) => handleVoteButtonClick(event, opt.value)}
                aria-label={opt.ariaLabel}
                aria-pressed={isSelected}
              >
                <span className={clsx(styles.voteButtonContent)}>
                  <opt.Icon
                    className={clsx(
                      styles.voteButtonIcon,
                      !isSelected && styles[getVoteToneClassName(opt.value)],
                    )}
                    {...voteButtonIconProps}
                    aria-hidden
                  />
                  <MainTextTypography
                    variant={buttonLabelVariant}
                    className={clsx(
                      !isSelected && styles[getVoteToneClassName(opt.value)],
                    )}
                  >
                    {opt.label}
                  </MainTextTypography>
                </span>
              </AccentButton>
            );
          })}
        </div>
      </div>

      <div className={styles.confirmRow}>
        <AccentButton
          variant={hasConfirmedVote ? "secondary" : "primary"}
          className={styles.confirmButton}
          disabled={isVoteActionDisabled}
          onClick={handleVoteAction}
        >
          <span className={styles.voteButtonContent}>
            <VoteActionIcon
              className={styles.voteButtonIcon}
              {...voteButtonIconProps}
              aria-hidden
            />
            <MainTextTypography variant={buttonLabelVariant}>
              {voteActionLabel}
            </MainTextTypography>
          </span>
        </AccentButton>
      </div>
    </div>
  );
}

export default VoteControls;
