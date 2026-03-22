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
import styles from "./LicensingModal.module.scss";

export function LicensingModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;

  return (
    <PrimaryModal
      open={open}
      onClose={onClose}
      title="Licensing"
      subtitle="Open source code and reserved branding"
      maxWidth={640}
      ariaLabel="Licensing information"
      footer={<AccentButton onClick={onClose}>Close</AccentButton>}
    >
      <div className={styles.content}>
        <MainTextTypography variant="body" muted>
          Source code for parts of this project is publicly available under
          AGPL-3.0. "Tiers! With Friends" name and branding are reserved.
        </MainTextTypography>

        <section className={styles.section}>
          <MainTextTypography variant="h5">What that means</MainTextTypography>
          <ul className={styles.list}>
            <li>
              <MainTextTypography variant="body" muted>
                Public source code may be reused under the terms of the AGPL-3.0
                license.
              </MainTextTypography>
            </li>
            <li>
              <MainTextTypography variant="body" muted>
                The project name, logo, and visual branding are not included in
                that software license.
              </MainTextTypography>
            </li>
            <li>
              <MainTextTypography variant="body" muted>
                The software is provided without warranty. See the repository
                LICENSE files for the full license text.
              </MainTextTypography>
            </li>
          </ul>

          <MainTextTypography
            variant="caption"
            muted
            letterSpacing="wide"
            textAlign="right"
          >
            Copyright © 2026 Aaron Raphael Cheng
          </MainTextTypography>
        </section>
      </div>
    </PrimaryModal>
  );
}
