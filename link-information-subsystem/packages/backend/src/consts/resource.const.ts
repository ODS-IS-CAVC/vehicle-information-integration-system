/** 共有資源カテゴリ名 */
export const Category = {
  evacuation: "evacuation",
  mobilityhub: "mobilityhub",
} as const;

export type Category = (typeof Category)[keyof typeof Category];

/** モビリティハブ予約ID */
export const ReservationId = "A0JYEyM3-21453354856";

/** 削除APIレスポンス型 */
export type DeleteResponse = {
  result: string;
};
