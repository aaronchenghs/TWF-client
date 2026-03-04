import { useState } from "react";
import {
  BarChart3,
  FolderPlus,
  SlidersHorizontal,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/localStorage";
import styles from "./CreatorMessageButton.module.scss";

const CREATOR_MESSAGE_PLANS: CreatorMessagePlan[] = [
  {
    label: "User-Created Tier Sets",
    icon: FolderPlus,
    body: 'In this demo I have built out some pre-made game sets to play like "Anime" and "Video Games". I\'d like for these to be created, saved, and shared by users in the future. This comes with user accounts!',
  },
  {
    label: "Game Modes",
    icon: SlidersHorizontal,
    body: "Don't like being timed? Want some variety to the game? Game modes and lobby customization will make each session fit your group better.",
  },
  {
    label: "Custom Player Avatars",
    icon: UserRound,
    body: "Players will be able to personalize their identity with custom avatars so each lobby feels more expressive and recognizable.",
  },
  {
    label: "Global Stats",
    icon: BarChart3,
    body: "See how your game set results compare to others who have played the same game set.",
  },
  {
    label: "Superlatives",
    icon: Trophy,
    body: "Players get superlatives awarded to them at the end of the game based on their votes and placements.",
  },
];

type CreatorMessagePlan = {
  label: string;
  icon: LucideIcon;
  body: string;
};

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
        maxWidth={720}
        ariaLabel="Message from creator"
        footer={
          <AccentButton onClick={() => setIsOpen(false)}>Close</AccentButton>
        }
      >
        <div className={styles.content}>
          <MainTextTypography variant="body" muted>
            Thanks for playing my demo of{" "}
            <strong className={styles.bulletLabel}>Tiers! With Friends</strong>.
            This was something I made as a side project to keep myself working
            on something at home.
            <br />
            <br />
            My goal with this was to create a fun experience for at least 1
            group of people, if that has been achieved then I've accomplished my
            goal! If you enjoyed playing and want to see more in the future,
            please let me know. I can be reached at{" "}
            <span className={styles.email}>aaronchenghs@gmail.com</span> or you
            can submit a ticket using the "Report a bug" button in Settings.
            <br />
            <br />I have lots of plans for the future of this game:
          </MainTextTypography>

          <div className={styles.section}>
            <ul className={styles.bulletList}>
              {CREATOR_MESSAGE_PLANS.map((plan) => {
                const Icon = plan.icon;

                return (
                  <li className={styles.bulletItem} key={plan.body}>
                    <span className={styles.bulletIcon} aria-hidden="true">
                      <Icon size={18} strokeWidth={2.2} />
                    </span>

                    <MainTextTypography
                      variant="body"
                      muted
                      className={styles.bulletText}
                    >
                      <strong className={styles.bulletLabel}>
                        {plan.label}:
                      </strong>{" "}
                      {plan.body}
                    </MainTextTypography>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </PrimaryModal>
    </>
  );
}
