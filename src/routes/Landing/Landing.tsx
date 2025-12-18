import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TWFLogo from "../../assets/public/TWF_Transparent.svg?react";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";
import { AccentButton } from "../../components/AccentButton/AccentButton";
import { MainTextTypography } from "../../components/MainTextTypography/MaintTextTypography";
import { AccentTextInput } from "../../components/AccentTextInput/AccentTextInput";
import { roomSocket } from "../../services/sockets/roomSocket";
import { CODE_LENGTH, MAX_NAME_LENGTH } from "@twf/contracts";

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");

  const normalizedCode = code.trim().toUpperCase();
  const normalizedName = name.trim();

  const isCodeValid = normalizedCode.length === CODE_LENGTH;
  const isNameValid =
    normalizedName.length >= 1 && normalizedName.length <= MAX_NAME_LENGTH;
  const canJoin = isCodeValid && isNameValid;

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <TWFLogo className={styles.logo} />

        <div className={styles.playActions}>
          <AccentButton
            onClick={async () => {
              const { code } = await roomSocket.createRoom("host");
              navigate(`${ROUTES.HOST_LOBBY}/${code}`);
            }}
          >
            Create Room
          </AccentButton>

          <MainTextTypography variant="h2">or</MainTextTypography>

          <div className={styles.joinContainer}>
            <div className={styles.joinRow}>
              <AccentTextInput
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ABCD"
                maxLength={CODE_LENGTH}
              />
              <AccentTextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NAME"
                maxLength={MAX_NAME_LENGTH}
              />
              <AccentButton
                disabled={!canJoin}
                onClick={() => {
                  const qs = new URLSearchParams({
                    name: normalizedName,
                  }).toString();
                  navigate(`${ROUTES.ROOM}/${normalizedCode}?${qs}`);
                }}
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
