export const CaJPFormat = {
  kanjiDate: { dateStyle: "long", timeZone: "UTC" }, // 令和6年10月15日
  numericDate: { dateStyle: "short", timeZone: "UTC" }, // R6/10/15
} as const;

export type CaJpFormat = (typeof CaJPFormat)[keyof typeof CaJPFormat];
