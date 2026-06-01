import clsx from "clsx";
import { lazy, startTransition, Suspense, useEffect, useState } from "react";
import { type RoomPublicState, type TierSetSummary } from "@twf/contracts";
import type { Guid } from "@/lib/guid";
import { roomSocket } from "@/services/sockets/roomSocket";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { ToolTipWrapper } from "@/components/ToolTip/ToolTip";
import { useMobileView } from "@/lib/hooks/useMobileView";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { getStartDisabledReason } from "@/lib/hostLobbyUtils";
import { useDeferredReady } from "@/lib/hooks/useDeferredReady";
import styles from "./GameSettingsPanel.module.scss";
import { AnimatedDots } from "@/components/AnimatedDots/AnimatedDots";

type GameSettingsPanelProps = {
  className?: string;
  canLoadTierSets: boolean;
  selectedTierSetId: Guid | null;
  playerCount: number;
  players: RoomPublicState["players"];
  isStartCountdownOpen: boolean;
  onOpenGameSettings: () => void;
  onStartGame: () => void;
};

const { gameSettings: GameSettingsIcon, startGame: StartGameIcon } = APP_ICONS;
const TierSetSelection = lazy(() =>
  import("../TierSetSelection/TierSetSelection").then((module) => ({
    default: module.TierSetSelection,
  })),
);
const TIER_SET_SELECTION_DELAY_MS = 120;

export function GameSettingsPanel({
  className,
  canLoadTierSets,
  selectedTierSetId,
  playerCount,
  players,
  isStartCountdownOpen,
  onOpenGameSettings,
  onStartGame,
}: GameSettingsPanelProps) {
  const isMobile = useMobileView();
  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [isTierSetsLoading, setIsTierSetsLoading] = useState<boolean>(true);
  const isTierSetSelectionReady = useDeferredReady(TIER_SET_SELECTION_DELAY_MS);

  const isStartEnabled =
    !!selectedTierSetId &&
    playerCount >= 2 &&
    players.every((player) => player.name.trim().length > 0);

  const startDisabledReason = getStartDisabledReason({
    selectedTierSetId,
    playerCount,
    players,
  });

  const buttonIconProps = ICON_PROPS.quickActions;
  const buttonLabelVariant = isMobile ? "h2" : "h3";

  useEffect(
    function loadTierSets() {
      if (!canLoadTierSets) {
        const frameId = window.requestAnimationFrame(() => {
          startTransition(() => {
            setTierSets([]);
            setIsTierSetsLoading(false);
          });
        });

        return () => {
          window.cancelAnimationFrame(frameId);
        };
      }

      if (!isTierSetSelectionReady) {
        return;
      }

      let cancelled = false;

      roomSocket
        .listTierSets()
        .then((listed) => {
          if (cancelled) return;
          startTransition(() => {
            setTierSets(listed);
            setIsTierSetsLoading(false);
          });
        })
        .catch(() => {
          if (cancelled) return;
          startTransition(() => {
            setTierSets([]);
            setIsTierSetsLoading(false);
          });
        });

      return () => {
        cancelled = true;
      };
    },
    [canLoadTierSets, isTierSetSelectionReady],
  );

  return (
    <section className={clsx(styles.root, className)}>
      <div className={styles.panelHeader}>
        <MainTextTypography variant="h1" textAlign="center">
          Game
        </MainTextTypography>
      </div>

      <div className={styles.body}>
        <Suspense
          fallback={
            <TierSetSelectionFallback className={styles.tierSetSelection} />
          }
        >
          <TierSetSelection
            className={styles.tierSetSelection}
            tierSets={tierSets}
            selectedTierSetId={selectedTierSetId}
            isLoading={isTierSetsLoading}
          />
        </Suspense>

        <div className={styles.actionRow}>
          <AccentButton
            variant="secondary"
            disabled={isStartCountdownOpen}
            onClick={onOpenGameSettings}
            className={styles.actionButton}
          >
            <span className={styles.buttonContent}>
              <GameSettingsIcon {...buttonIconProps} aria-hidden="true" />
              <MainTextTypography variant={buttonLabelVariant}>
                Customize
              </MainTextTypography>
            </span>
          </AccentButton>

          <ToolTipWrapper
            content={startDisabledReason}
            error
            placement="top"
            block
            disabled={!startDisabledReason}
          >
            <AccentButton
              variant="primary"
              disabled={!isStartEnabled || isStartCountdownOpen}
              onClick={onStartGame}
              className={styles.actionButton}
            >
              <span className={styles.buttonContent}>
                <StartGameIcon {...buttonIconProps} aria-hidden="true" />
                <MainTextTypography variant={buttonLabelVariant}>
                  Start Game
                </MainTextTypography>
              </span>
            </AccentButton>
          </ToolTipWrapper>
        </div>
      </div>
    </section>
  );
}

function TierSetSelectionFallback({ className }: { className?: string }) {
  return (
    <section className={clsx(styles.tierSetSelectionFallback, className)}>
      <MainTextTypography variant="body" muted textAlign="center">
        Loading tier lists <AnimatedDots />
      </MainTextTypography>
    </section>
  );
}
