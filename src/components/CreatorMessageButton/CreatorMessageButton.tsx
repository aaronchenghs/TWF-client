import { useState } from "react";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/localStorage";
import styles from "./CreatorMessageButton.module.scss";

type CreatorMessageSection = {
  title: string;
  body: string;
};

// Shared copy so every finished-state trigger stays in sync.
const CREATOR_MESSAGE_SECTIONS: CreatorMessageSection[] = [
  {
    title: "Short term",
    body: "I am focused on tightening the core loop with smoother transitions, clearer feedback, and better end-of-round polish.",
  },
  {
    title: "Next up",
    body: "I want to keep expanding the content with more tier sets, more variety, and more reasons for each round to feel fresh.",
  },
  {
    title: "Longer term",
    body: "The plan is to keep improving the social side of the game, add strong quality-of-life upgrades, and keep iterating based on how people actually play.",
  },
];

export function CreatorMessageButton() {
  const [isOpen, setIsOpen] = useState(false);
  const hasSeenMessage =
    getLocalStorageValue(LOCAL_STORAGE_KEYS.CREATOR_MESSAGE_SEEN) === true;

  const handleOpen = () => {
    if (!hasSeenMessage)
      setLocalStorageValue(LOCAL_STORAGE_KEYS.CREATOR_MESSAGE_SEEN, true);

    setIsOpen(true);
  };

  return (
    <>
      <AccentButton
        variant={hasSeenMessage ? "secondary" : "special"}
        onClick={handleOpen}
      >
        Message from Creator
      </AccentButton>

      <PrimaryModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Message from Creator"
        subtitle="WHAT'S NEXT"
        maxWidth={720}
        ariaLabel="Message from creator"
        footer={
          <AccentButton onClick={() => setIsOpen(false)}>Close</AccentButton>
        }
      >
        <div className={styles.content}>
          <MainTextTypography variant="body" muted>
            Thanks for playing. Here is the direction I am taking the game as I
            keep building it out.
          </MainTextTypography>

          <div className={styles.sections}>
            {CREATOR_MESSAGE_SECTIONS.map((section) => (
              <div className={styles.section} key={section.title}>
                <MainTextTypography variant="label" letterSpacing="wide">
                  {section.title}
                </MainTextTypography>

                <MainTextTypography variant="body" muted>
                  {section.body}
                </MainTextTypography>
              </div>
            ))}
          </div>
        </div>
      </PrimaryModal>
    </>
  );
}
