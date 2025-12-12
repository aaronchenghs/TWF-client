import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const nav = useNavigate();
  const [code, setCode] = useState("");

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h1>Tiers With Friends</h1>

      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}
      >
        <button onClick={() => nav("/display")}>Create Room (Display)</button>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Join Room</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD"
          style={{ padding: 10, width: 120, textTransform: "uppercase" }}
        />
        <button onClick={() => nav(`/controller/${code.trim().toUpperCase()}`)}>
          Join
        </button>
      </div>
    </div>
  );
}
