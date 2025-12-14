import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TWF_Logo from "../../assets/public/TWF_Transparent.svg";
import styles from "./Landing.module.scss";
import { ROUTES } from "../routes";

export default function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <div className={styles.landingPage}>
      <div className={styles.container}>
        <img src={TWF_Logo} alt="Tiers With Friends" className={styles.logo} />

        <div className={styles.actions}>
          <button onClick={() => navigate(ROUTES.DISPLAY)}>
            Create Room (Display)
          </button>
        </div>

        <div className={styles.join}>
          <h2>Join Room</h2>
          <div className={styles.joinRow}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABCD"
            />
            <button
              onClick={() =>
                navigate(`${ROUTES.CONTROLLER}/${code.trim().toUpperCase()}`)
              }
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
