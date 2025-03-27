/** 点群データタイプ */
export const PointCloudDataType = {
  potree: "potree",
  laz: "laz",
} as const;

export const ISSUED_URL_STATUS = 11;

export type PointCloudDataType = (typeof PointCloudDataType)[keyof typeof PointCloudDataType];
