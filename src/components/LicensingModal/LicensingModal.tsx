/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { Scale } from "lucide-react";
import { LICENSING_RESOURCE_LINKS } from "@/lib/constants/licensing";
import { AccentButton } from "../AccentButton/AccentButton";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import { ModalHeaderTitle } from "../ModalHeaderTitle/ModalHeaderTitle";
import { PrimaryModal } from "../PrimaryModal/PrimaryModal";
import styles from "./LicensingModal.module.scss";

export function LicensingModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;

  return (
    <PrimaryModal
      open={open}
      onClose={onClose}
      title={<ModalHeaderTitle icon={<Scale />}>Licensing</ModalHeaderTitle>}
      subtitle="AGPL-3.0-or-later and reserved branding"
      maxWidth={660}
      ariaLabel="Licensing information"
      footer={<AccentButton onClick={onClose}>Close</AccentButton>}
    >
      <div className={styles.content}>
        <MainTextTypography variant="body" muted>
          This client is free software licensed under the GNU Affero General
          Public License v3.0 or later (AGPL-3.0-or-later). The{" "}
          <strong>Tiers! With Friends</strong> name, logo, and visual branding
          are reserved and are not granted under that software license.
        </MainTextTypography>

        <section className={styles.section}>
          <MainTextTypography variant="h5">License summary</MainTextTypography>
          <ul className={styles.list}>
            <li>
              <MainTextTypography variant="body" muted>
                You may use, study, modify, and redistribute this software under
                the terms of the AGPL-3.0-or-later.
              </MainTextTypography>
            </li>
            <li>
              <MainTextTypography variant="body" muted>
                This software is provided without warranty.
              </MainTextTypography>
            </li>
            <li>
              <MainTextTypography variant="body" muted>
                The full license text and the project source repositories are
                linked below.
              </MainTextTypography>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <MainTextTypography variant="h5">
            License and source links
          </MainTextTypography>
          <ul className={styles.linkList}>
            {LICENSING_RESOURCE_LINKS.map((resource) => (
              <li key={resource.href}>
                <a
                  className={styles.linkCard}
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MainTextTypography
                    className={styles.linkLabel}
                    variant="body"
                    weight="medium"
                  >
                    {resource.label}
                  </MainTextTypography>
                  <MainTextTypography
                    className={styles.linkDescription}
                    variant="caption"
                  >
                    {resource.description}
                  </MainTextTypography>
                </a>
              </li>
            ))}
          </ul>

          <MainTextTypography variant="caption" muted>
            Links open in a new tab.
          </MainTextTypography>

          <MainTextTypography
            variant="caption"
            muted
            letterSpacing="wide"
            textAlign="right"
          >
            Copyright (C) 2026 Aaron Raphael Cheng
          </MainTextTypography>
        </section>
      </div>
    </PrimaryModal>
  );
}
