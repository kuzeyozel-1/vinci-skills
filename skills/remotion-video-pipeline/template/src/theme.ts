import { Easing } from "remotion";
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
export const C = { accent: "#F2A900", ink: "#0B0B0B", paper: "#FFFFFF" };
export const FONT = { display: "Oswald, Impact, sans-serif", body: "Helvetica, Arial, sans-serif" };
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
