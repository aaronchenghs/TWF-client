import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import * as Contracts from "@twf/contracts";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { copyTextToClipboard } from "@/lib/clipboard";
import { ROUTES } from "@/routes/routes";
import styles from "./ShareResultsButton.module.scss";

type RoomPublicState = Contracts.RoomPublicState;
type TierId = Contracts.TierId;
type TierItemId = Contracts.TierItemId;

type ShareResultsButtonProps = {
  state: RoomPublicState;
};

type ShareState = "idle" | "shared" | "copied" | "failed";

const FEEDBACK_RESET_MS = 1500;
const MAX_VISIBLE_TIERS = 5;
const MAX_ITEMS_PER_TIER = 4;

export function ShareResultsButton({ state }: ShareResultsButtonProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const shareUrl = useMemo(() => getLandingShareUrl(), []);
  const sharePayload = useMemo(
    () => buildResultsSharePayload(state, shareUrl),
    [state, shareUrl],
  );

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(
      () => setShareState("idle"),
      FEEDBACK_RESET_MS,
    );
  }, []);

  const handleShare = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share(sharePayload);
          setShareState("shared");
          scheduleReset();
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
        }
      }

      const copied = await copyTextToClipboard(sharePayload.fallbackText);
      if (!copied) {
        setShareState("failed");
        scheduleReset();
        return;
      }
      setShareState("copied");
      scheduleReset();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, scheduleReset, sharePayload]);

  useEffect(function cleanupShareTimer() {
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  return (
    <AccentButton
      variant="secondary"
      onClick={handleShare}
      disabled={isSubmitting}
      title="Share your final Tiers! With Friends results"
    >
      <span className={styles.buttonContent}>
        <Share2 className={styles.buttonIcon} size={18} strokeWidth={2.2} />
        {getButtonLabel(isSubmitting, shareState)}
      </span>
    </AccentButton>
  );
}

function getButtonLabel(isSubmitting: boolean, shareState: ShareState) {
  if (isSubmitting) return "Sharing...";
  if (shareState === "shared") return "Shared";
  if (shareState === "copied") return "Link Copied";
  if (shareState === "failed") return "Copy Failed";
  return "Share Results";
}

function getLandingShareUrl() {
  if (typeof window === "undefined") return ROUTES.LANDING;
  return new URL(ROUTES.LANDING, window.location.origin).toString();
}

function buildResultsSharePayload(state: RoomPublicState, shareUrl: string) {
  const summary = buildResultsSummary(state);

  const intro = `We just finished a round of Tiers! With Friends, a browser party game where you build hilarious tier lists together.`;
  const boardSummary = summary ? `Final board:\n${summary}` : "";
  const callToAction = "Play your own round:";

  const text = [intro, boardSummary, callToAction].filter(Boolean).join("\n\n");
  const fallbackText = [text, shareUrl].join("\n\n");

  return {
    title: "Tiers! With Friends",
    text,
    url: shareUrl,
    fallbackText,
  };
}

function buildResultsSummary(state: RoomPublicState) {
  const tiers = (state.tiers ?? ({} as Record<TierId, TierItemId[]>)) as Record<
    TierId,
    TierItemId[]
  >;
  const tierOrder =
    state.tierOrder.length > 0
      ? state.tierOrder
      : (Object.keys(tiers) as TierId[]);

  const nonEmptyTierIds = tierOrder.filter(
    (tierId) => (tiers[tierId] ?? []).length > 0,
  );
  const visibleTierIds = nonEmptyTierIds.slice(0, MAX_VISIBLE_TIERS);

  const lines = visibleTierIds.map((tierId) => {
    const tierName = state.tierMetaById?.[tierId]?.name ?? tierId;
    const itemIds = tiers[tierId] ?? [];
    const itemNames = itemIds.map(
      (itemId) => state.itemMetaById?.[itemId]?.name ?? itemId,
    );
    const visibleItems = itemNames.slice(0, MAX_ITEMS_PER_TIER).join(", ");
    const overflowCount = itemNames.length - MAX_ITEMS_PER_TIER;
    const overflowSuffix = overflowCount > 0 ? ` +${overflowCount} more` : "";

    return `${tierName}: ${visibleItems}${overflowSuffix}`;
  });

  const hiddenTierCount = nonEmptyTierIds.length - visibleTierIds.length;
  if (hiddenTierCount > 0)
    lines.push(
      `+${hiddenTierCount} more tier${hiddenTierCount === 1 ? "" : "s"}`,
    );

  return lines.join("\n");
}
