import clsx from "clsx";
import { startTransition, useEffect, useState } from "react";
import { type TierSetSummary } from "@twf/contracts";
import type { Guid } from "@/lib/guid";
import { roomSocket } from "@/services/sockets/roomSocket";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { AccentButton } from "@/components/AccentButton/AccentButton";
import { ToolTipWrapper } from "@/components/ToolTip/ToolTip";
import { useMobileView } from "@/lib/hooks/useMobileView";
import { APP_ICONS, ICON_PROPS } from "@/lib/constants/icons";
import { getStartDisabledReason } from "@/lib/hostLobbyUtils";
import { TierSetSelection } from "../TierSetSelection/TierSetSelection";
import styles from "./HostLobbyPanel.module.scss";

type HostLobbyPanelProps = {
  className?: string;
  canLoadTierSets: boolean;
  selectedTierSetId: Guid | null;
  playerCount: number;
  isStartCountdownOpen: boolean;
  onOpenGameSettings: () => void;
  onStartGame: () => void;
};

const { gameSettings: GameSettingsIcon, startGame: StartGameIcon } = APP_ICONS;

export function HostLobbyPanel({
  className,
  canLoadTierSets,
  selectedTierSetId,
  playerCount,
  isStartCountdownOpen,
  onOpenGameSettings,
  onStartGame,
}: HostLobbyPanelProps) {
  const isMobile = useMobileView();
  const [tierSets, setTierSets] = useState<TierSetSummary[]>([]);
  const [isTierSetsLoading, setIsTierSetsLoading] = useState(true);

  const isStartEnabled = !!selectedTierSetId && playerCount >= 2;
  const startDisabledReason = getStartDisabledReason({
    selectedTierSetId,
    playerCount,
  });
  const buttonIconProps = ICON_PROPS.quickActions;
  const buttonLabelVariant = isMobile ? "h2" : "h3";

  useEffect(
    function loadTierSets() {
      if (!canLoadTierSets) {
        setTierSets([]);
        setIsTierSetsLoading(false);
        return;
      }

      let cancelled = false;
      setIsTierSetsLoading(true);

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
    [canLoadTierSets],
  );

  return (
    <section className={clsx(styles.root, className)}>
      <div className={styles.panelHeader}>
        <MainTextTypography variant="h1" textAlign="center">
          Host Lobby
        </MainTextTypography>
      </div>

      <div className={styles.body}>
        <TierSetSelection
          className={styles.tierSetSelection}
          tierSets={tierSets}
          selectedTierSetId={selectedTierSetId}
          isLoading={isTierSetsLoading}
        />

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
