import { useState } from "react";

// Warm gradient mesh + kolam-style dot grid + drifting spice particles.
// Rendered once per screen (Home, Daily Intake Sheet) behind all content.
// Note: the CSS keyframe `ambientFloat` used by this component is declared
// inline in each screen's <style> block (see App.jsx and Sheet.jsx).

const AMBIENT_EMOJI = ["🌶️", "🌿", "🍃", "✨", "🫚"];

function makeAmbientParticles(n = 10) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    e: AMBIENT_EMOJI[i % AMBIENT_EMOJI.length],
    sz: 14 + Math.floor(Math.random() * 14),
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: 26 + Math.random() * 22,
    delay: Math.random() * 10,
    drift: (Math.random() - 0.5) * 40,
    rot: Math.random() * 360,
    drot: (Math.random() - 0.5) * 90,
  }));
}

export default function AmbientBackground() {
  const [particles] = useState(() => makeAmbientParticles(10));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Base warm mesh gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 900px 700px at 8% 0%, rgba(253,224,71,.35), transparent 60%)," +
            "radial-gradient(ellipse 800px 700px at 100% 10%, rgba(234,88,12,.16), transparent 55%)," +
            "radial-gradient(ellipse 700px 800px at 100% 100%, rgba(5,150,105,.10), transparent 55%)," +
            "radial-gradient(ellipse 900px 700px at 0% 100%, rgba(190,24,93,.08), transparent 55%)," +
            "linear-gradient(160deg,#fffbf0 0%,#fef3c7 45%,#fde68a 100%)",
        }}
      ></div>

      {/* Large soft blurred colour blobs for depth */}
      <div
        style={{
          position: "absolute", top: "-8%", left: "-6%", width: 340, height: 340, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(234,88,12,.22),transparent 70%)", filter: "blur(6px)",
        }}
      ></div>
      <div
        style={{
          position: "absolute", bottom: "-10%", right: "-8%", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(5,150,105,.14),transparent 70%)", filter: "blur(6px)",
        }}
      ></div>
      <div
        style={{
          position: "absolute", top: "35%", right: "-10%", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(219,39,119,.10),transparent 70%)", filter: "blur(6px)",
        }}
      ></div>

      {/* Kolam-inspired dot grid texture */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle,rgba(180,90,20,.10) 1.4px,transparent 1.4px)",
          backgroundSize: "26px 26px", opacity: 0.5,
        }}
      ></div>

      {/* Slow-drifting spice particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute", left: p.x + "%", top: p.y + "%", fontSize: p.sz, opacity: 0.1,
            "--r0": p.rot + "deg", "--r1": (p.rot + p.drot) + "deg", "--dr": p.drift + "px",
            animation: "ambientFloat " + p.dur + "s " + p.delay + "s ease-in-out infinite",
          }}
        >
          {p.e}
        </div>
      ))}
    </div>
  );
}
