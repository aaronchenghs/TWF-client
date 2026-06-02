/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import TWFLogoSrc from "@/assets/public/TWF_Transparent.svg";
import styles from "./WhatIsThisModal.module.scss";

const QUICK_START_STEPS = [
  "The host clicks `Create Lobby` on a larger shared screen",
  "Everyone scans the host QR code or enters the lobby code on their phone, then submits a name from the player lobby",
  "Host picks a tier set to play, then starts the game when everyone is in",
] as const;

const ROUND_FLOW = [
  "Players use their phone as a controller to play the game",
  "When a player's turn starts, they place a secret item before the timer runs out",
  "The group sees the placement, discusses it, then votes to move it up, down, or abstain",
  "After all items are placed, the final tier list is revealed",
] as const;

export function WhatIsThisModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;

  return (
    <PrimaryModal
      open={open}
      onClose={onClose}
      title="What is This?"
      maxWidth={720}
      ariaLabel="What is this"
      footer={<AccentButton onClick={onClose}>Got it</AccentButton>}
    >
      <div className={styles.content}>
        <img
          className={styles.logo}
          src={TWFLogoSrc}
          alt="Tiers With Friends logo"
        />
        <MainTextTypography variant="body" muted textAlign="center">
          Inspired by the likes of <em>JackBox</em> and <em>TierMaker</em>,{" "}
          <strong>Tiers! With Friends</strong> is a browser party game where
          your group builds a tier list together in real time.
        </MainTextTypography>

        <section className={styles.section}>
          <MainTextTypography variant="h5">
            How to start a game
          </MainTextTypography>
          <ol className={styles.stepList}>
            {QUICK_START_STEPS.map((step) => (
              <li key={step}>
                <MainTextTypography variant="body" muted>
                  {step}
                </MainTextTypography>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section}>
          <MainTextTypography variant="h5">Gameplay</MainTextTypography>
          <ul className={styles.bulletList}>
            {ROUND_FLOW.map((item) => (
              <li key={item}>
                <MainTextTypography variant="body" muted>
                  {item}
                </MainTextTypography>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PrimaryModal>
  );
}
