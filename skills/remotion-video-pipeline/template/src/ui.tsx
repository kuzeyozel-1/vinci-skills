import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, EXPO, sec } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Trimmed, slowly zooming clip from public/proxy/<src>.mp4. `from` is a start second. */
export const Footage: React.FC<{ src: string; from: number; dur: number; zoom?: [number, number]; dim?: number }> = ({ src, from, dur, zoom = [1.04, 1.12], dim = 0 }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.ink }}>
      <OffthreadVideo src={staticFile(`proxy/${src}.mp4`)} startFrom={sec(from)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />}
    </AbsoluteFill>
  );
};

/** Gradient behind text so it stays legible on any footage. */
export const Scrim: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,0) 55%)` }} />
);

/** Text that rises into place. */
export const Line: React.FC<{ delay?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ delay = 0, style, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [delay, delay + 14], [0, 1], { ...clamp, easing: EXPO });
  return <div style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)`, ...style }}>{children}</div>;
};
