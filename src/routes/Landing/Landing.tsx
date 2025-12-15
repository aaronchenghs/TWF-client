import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <TWFLogo className={styles.logo} />

        <div className={styles.playActions}>
          <AccentButton onClick={() => navigate(ROUTES.HOST_LOBBY)}>
            Create Room
          </AccentButton>

          <MainTextTypography variant="h2">or</MainTextTypography>

          <div className={styles.joinContainer}>
            <div className={styles.joinRow}>
              <AccentTextInput
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ABCD"
                maxLength={4}
              />
              <AccentButton
                onClick={() =>
                  navigate(`${ROUTES.ROOM}/${code.trim().toUpperCase()}`)
                }
              >
                Join Room
              </AccentButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
