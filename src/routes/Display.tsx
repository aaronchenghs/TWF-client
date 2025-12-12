import { useParams } from "react-router-dom";

export default function Display() {
  const { code } = useParams();

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <h1>Display</h1>
      <div style={{ opacity: 0.8 }}>Room: {code ?? "(not created yet)"}</div>

      <div
        style={{
          marginTop: 18,
          padding: 12,
          border: "1px solid #2b2f3a",
          borderRadius: 10,
        }}
      >
        Tier list UI goes here.
      </div>
    </div>
  );
}
