import { useMemo } from "react";
import styles from "./RevealOverlay.module.scss";
import { OverlayDialog } from "../../../components/OverlayDialog/OverlayDialog";
import { MainTextTypography } from "../../../components/MainTextTypography/MaintTextTypography";
import type * as Contracts from "@twf/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { LoadableImage } from "../../../components/LoadableImage/LoadableImage";

type RoomPublicState = Contracts.RoomPublicState;

type Props = {
  open: boolean;
  state: RoomPublicState | null;
};

const REVEAL_MS = 3000;
const ENTER_MS = 700;

export function RevealOverlay({ open, state }: Props) {
  const itemId = state?.currentItem ?? undefined;

  const meta = itemId ? state?.itemMetaById?.[itemId] : undefined;
  const name = meta?.name ?? itemId ?? "—";
  const imageSrc = meta?.imageSrc;

  const HOLD_MS = Math.max(0, REVEAL_MS - ENTER_MS);
  const enterS = ENTER_MS / 1000;
  const holdS = HOLD_MS / 1000;

  const totalAnimateS = enterS + holdS;
  const enterFrac = totalAnimateS > 0 ? enterS / totalAnimateS : 1;

  const nameInitials = useMemo(() => name.slice(0, 1).toUpperCase(), [name]);

  return (
    <OverlayDialog open={open} ariaLabel="Reveal item">
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key={itemId ?? "none"}
            initial={{ x: "-125vw", opacity: 0 }}
            animate={{
              x: ["-125vw", 0, 0],
              opacity: [0, 1, 1],
              transition: {
                duration: totalAnimateS,
                times: [0, enterFrac, 1],
                ease: [0.16, 1, 0.3, 1],
              },
            }}
          >
            <LoadableImage
              src={imageSrc}
              alt={name}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={styles.revealImage}
              fallback={
                <div className={styles.fallback} aria-hidden="true">
                  <MainTextTypography variant="h2">
                    {nameInitials}
                  </MainTextTypography>
                </div>
              }
            />
            <div className={styles.text}>
              <MainTextTypography variant="h5" muted className={styles.label}>
                {!state?.lastResolution ? `FIRST ITEM:` : `NEXT ITEM:`}
              </MainTextTypography>
              <MainTextTypography variant="h3" className={styles.name}>
                {name}
              </MainTextTypography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayDialog>
  );
}
