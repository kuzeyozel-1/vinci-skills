import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { C, FONT, sec } from "./theme";
import { Footage, Line, Scrim } from "./ui";

// Verb + clip: each cut ~1.4 s. Edit the list; pick `from` seconds from a contact sheet.
const CUTS = [
  { word: "Prepare.", src: "v01", from: 2, dur: 1.4 },
  { word: "Build.", src: "v02", from: 5, dur: 1.4 },
  { word: "Deliver.", src: "v03", from: 1, dur: 1.6 },
];
export const TEASER_DURATION = sec(CUTS.reduce((t, c) => t + c.dur, 0));

export const Teaser: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: C.ink }} lang="en">
      {CUTS.map((c) => {
        const from = at; at += sec(c.dur);
        return (
          <Sequence key={c.word} from={from} durationInFrames={sec(c.dur)}>
            <Footage src={c.src} from={c.from} dur={sec(c.dur)} />
            <Scrim />
            <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 96px 300px" }}>
              <Line style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 190, lineHeight: 0.95, color: C.paper, textTransform: "uppercase" }}>{c.word}</Line>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
