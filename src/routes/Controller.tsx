import { useParams } from "react-router-dom";
import { useState } from "react";

export default function Controller() {
  const { code } = useParams();
  const [name, setName] = useState("");

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <h1>Controller</h1>
      <div style={{ opacity: 0.8 }}>Room: {code ?? "(missing code)"}</div>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ padding: 10, width: "100%" }}
          />
        </label>

        <button disabled={!code || !name.trim()}>
          Join (wired to backend later)
        </button>
      </div>
    </div>
  );
}
