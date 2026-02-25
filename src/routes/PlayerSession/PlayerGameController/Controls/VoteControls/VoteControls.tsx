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
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { resolvePlacedTierId } from "@/lib/tierItems";
import { socketClient } from "@/services/sockets/socketClient";

type VoteValue = Contracts.VoteValue;

type ActionLockKey = "confirm";

const ACTION_LOCK_TIMEOUT_MS = 6000;
const DISCUSSION_LOCK_MS = 10000;

const VOTE_OPTIONS = [
  {
    label: "Bump Up",
    value: -1 as const,
    Icon: APP_ICONS.vote.up,
    ariaLabel: "Vote bump up one tier",
  },
  {
    label: "Agree",
    value: 0 as const,
    Icon: APP_ICONS.vote.agree,
    ariaLabel: "Vote agree",
  },
  {
    label: "Bump Down",
    value: 1 as const,
    Icon: APP_ICONS.vote.down,
    ariaLabel: "Vote bump down one tier",
  },
] satisfies Array<{
  label: string;
  value: VoteValue;
  Icon: typeof APP_ICONS.vote.up;
  ariaLabel: string;
}>;

function getVoteToneClassName(vote: VoteValue): string {
  if (vote < 0) return styles.toneUp;
  if (vote > 0) return styles.toneDown;
  return styles.toneAgree;
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
  const selectedVoteRef = useRef<VoteValue | null>(myVote);
  const pendingVoteRequestRef = useRef<{
    windowKey: string | null;
    vote: VoteValue;
  } | null>(null);

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

  const canBumpUp = placedTierIndex > 0;

  const canBumpDown =
    placedTierIndex >= 0 ? placedTierIndex < orderedTierIds.length - 1 : true;

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

  const shouldRemainLockedByKey = useMemo<Record<ActionLockKey, boolean>>(
    () => ({
      confirm: phase === "VOTE" && canVote && !hasConfirmedVote,
    }),
    [phase, canVote, hasConfirmedVote],
  );

  const voteOptions = useMemo(
    () =>
      VOTE_OPTIONS.filter((opt) => {
        if (opt.value < 0) return canBumpUp;
        if (opt.value > 0) return canBumpDown;
        return true;
      }),
    [canBumpUp, canBumpDown],
  );

  const hasSelectableVote =
    selectedVote !== null &&
    voteOptions.some((opt) => opt.value === selectedVote);

  const actionLocks = useActionLocks(shouldRemainLockedByKey, {
    timeoutMs: ACTION_LOCK_TIMEOUT_MS,
  });

  const isConfirming = actionLocks.isLocked("confirm");

  const disabledVote = !canVote || hasConfirmedVote || isConfirming;

  const disabledConfirm =
    !canVote ||
    hasConfirmedVote ||
    isConfirming ||
    isDiscussionLocked ||
    !hasSelectableVote;

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
    function syncSelectedVoteRef() {
      selectedVoteRef.current = selectedVote;
    },
    [selectedVote],
  );

  useEffect(
    function initializeVoteDiscussionLockWindow() {
      if (phase !== "VOTE") {
        lastVoteWindowKeyRef.current = null;
        pendingVoteRequestRef.current = null;
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

      if (myVote !== null && pendingVoteRequest.vote === myVote) {
        pendingVoteRequestRef.current = null;
      }
    },
    [activeVoteWindowKey, myVote],
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
          {voteOptions.map((opt) => {
            const isSelected = selectedVote === opt.value;
            return (
              <AccentButton
                key={opt.label}
                variant={isSelected ? "primary" : "secondary"}
                className={styles.bigButton}
                disabled={disabledVote || isDiscussionLocked}
                onClick={(event) => handleVoteButtonClick(event, opt.value)}
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
