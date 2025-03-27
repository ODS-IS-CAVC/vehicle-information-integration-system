export const ENDPOINT = {
  /** 車線中心線・交通規制情報 */
  HD_LANE_CENTER: "hdlanecenter",
  /** 区画線 */
  HD_LANE_LINE: "hdlaneline",
  /** 道路縁 */
  HD_ROAD_EDGE: "hdroadedge",
  /** 交差点 */
  HD_INTERSECTION: "hdintersection",
  /** 路面標識 */
  HD_PAVEMENT_MARKING: "hdpavementmarking",
  /** 道路標識 */
  HD_SIGN: "hdsign",
  /** 交通渋滞・規制情報 */
  TRAFFIC: "traffic",
  /** 旅行時間情報 */
  TRIP_TIME: "triptime",
  /** 工事行事予定情報 */
  CONSTRUCTION_EVENT: "constructionevent",
  /** 冬季閉鎖情報 */
  WINTER_CLOSURE: "winterclosure",
  /** 入口出口閉鎖情報 */
  ENTRY_EXIT: "entryexit",
  /** 共有資源状態 */
  SHARE_RESOURCES: "resources",
} as const;
