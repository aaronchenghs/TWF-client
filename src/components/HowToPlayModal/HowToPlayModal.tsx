import { useState } from "react";
import clsx from "clsx";
import styles from "./HowToPlayModal.module.scss";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { AccentButton } from "../AccentButton/AccentButton";
import Step1Img from "../../assets/public/InstructionStep1.svg";
import Step2Img from "../../assets/public/InstructionStep2.svg";
import Step3Img from "../../assets/public/InstructionStep3.svg";
import Step4Img from "../../assets/public/InstructionStep4.svg";
import Step5Img from "../../assets/public/InstructionStep5.svg";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import { LoadableImage } from "../LoadableImage/LoadableImage";

type HowToPlayStep = {
  title: string;
  body: string;
  imageSrc: string;
  alt: string;
};

export function HowToPlayModal(props: {
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}) {
  const { open, onClose, initialIndex = 0 } = props;
  const [index, setIndex] = useState<number>(() => {
    if (!HOW_TO_STEPS.length) return 0;
    return Math.min(Math.max(initialIndex, 0), HOW_TO_STEPS.length - 1);
  });

  const step = HOW_TO_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === HOW_TO_STEPS.length - 1;

  return (
    <PrimaryModal
      open={open}
      onClose={onClose}
      title="How to Play"
      subtitle={`STEP ${index + 1} OF ${HOW_TO_STEPS.length}`}
      maxWidth={920}
      ariaLabel="How to play"
      closeOnBackdrop
      closeOnEscape
      showCloseButton
      contentClassName={styles.howToContentWrapper}
      footer={
        <div className={styles.footerRow}>
          <AccentButton
            variant="primary"
            disabled={isFirst}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            {`< Back`}
          </AccentButton>

          <div className={styles.footerRight}>
            {!isLast ? (
              <AccentButton
                variant="primary"
                onClick={() =>
                  setIndex((i) => Math.min(HOW_TO_STEPS.length - 1, i + 1))
                }
              >
                {`Next >`}
              </AccentButton>
            ) : (
              <AccentButton variant="primary" onClick={onClose}>
                Got it
              </AccentButton>
            )}
          </div>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.imageFrame}>
          <LoadableImage
            className={styles.image}
            src={step.imageSrc}
            alt={step.alt}
            loading="eager"
            draggable={false}
          />
        </div>

        <div className={styles.text}>
          <MainTextTypography variant="title" weight="medium">
            {step.title}
          </MainTextTypography>

          <MainTextTypography variant="body" muted>
            {step.body}
          </MainTextTypography>

          <div className={styles.dots} aria-label="Steps">
            {HOW_TO_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={clsx(styles.dot, i === index && styles.dotActive)}
                onClick={() => setIndex(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </PrimaryModal>
  );
}

const HOW_TO_STEPS: HowToPlayStep[] = [
  {
    title: "Best Setup",
    body: "For the best experience, have one person host on a big screen or screen-share (like Discord), while everyone joins the room code from their own phone or device. The host can play too by joining on their phone or in a second tab.",
    imageSrc: Step1Img,
    alt: "Best setup",
  },
  {
    title: "The first placer is picked and an item is revealed to them",
    body: "The current player sees the item and has to place it into a tier before time runs out.",
    imageSrc: Step2Img,
    alt: "Placer",
  },
  {
    title: "The placement is revealed, discussion begins",
    body: "The placement of the item is revealed to everyone. Discuss where it should go and place a vote to promote, demote, or abstain.",
    imageSrc: Step3Img,
    alt: "Discuss",
  },
  {
    title: "Votes counted, decision made",
    body: "Votes are rallied and item's final placement is decided. The next placer is picked.",
    imageSrc: Step4Img,
    alt: "Drift",
  },
  {
    title: "Finish",
    body: "Once all items have been placed, the final tier list is revealed!",
    imageSrc: Step5Img,
    alt: "Resolution",
  },
];
