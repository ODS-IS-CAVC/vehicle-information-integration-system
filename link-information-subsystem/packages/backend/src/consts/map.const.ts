export const MAP_SOURCE = {
  /** HD車線中心線 */
  HD_LANE_CENTER: "hd-lane-center",
  /** HD区画線 */
  HD_LANE_LINE: "hd-lane-line",
  /** HD道路縁 */
  HD_ROAD_EDGE: "hd-road-edge",
  /** HD交差点 */
  HD_INTERSECTION: "hd-intersection",
  /** HD路面標識 */
  HD_PAVEMENT_MARKING: "hd-pavement-marking",
  /** HD道路標識 */
  HD_SIGN: "hd-signs",
  /** SD道路リンク */
  SD_ROAD_LINK: "sd-road-link",
  /** SD道路ノード */
  SD_ROAD_NODE: "sd-road-node",
  /** 交通渋滞・規制情報 */
  TRAFFIC: "traffic",
  /** 工事行事予定情報 */
  CONSTRUCTION_EVENT: "construction-event",
  /** 入口出口閉鎖情報 */
  ENTRY_EXIT: "entry-exit",
  /** 旅行時間情報 */
  TRIP_TIME: "trip-time",
  /** 冬季閉鎖情報 */
  WINTER_CLOSURE: "winter-closure",
  /** 気象リスク：水膜厚 */
  WATER_FILM_THICKNESS: "water_film_thickness",
  /** 気象リスク：風速・風向 */
  WIND: "wind",
} as const;

/** 交通規制情報 */
export const roadRegulationTypes = ["NOPASS", "NOTURN", "ONEWAY", "SPEED", "ZONE30"] as const;
export type RoadRegulationType = (typeof roadRegulationTypes)[number];

/** 絞り込み対象の交通規制情報 */
export const Reg = {
  speed: "SPEED",
  nopass: "NOPASS",
  oneway: "ONEWAY",
  noturn: "NOTURN",
  zone30: "ZONE30",
} as const;

export type Reg = (typeof Reg)[keyof typeof Reg];

/** 本線区分 */
export const LANE_CATEGORY = {
  MAIN: "main",
  ENTRY: "entry",
  EXIT: "exit",
  JUNCTION: "junction",
} as const;

/** 障害処理状況 */
export const HANDLING_STATUS = {
  INVESTIGATING: "investigating",
  RESCUING: "rescuing",
  HANDLING: "handling",
  TOWING: "towing",
  MANEUVERING: "maneuvering",
  CLEANING: "cleaning",
  DEOILING: "deoiling",
  INSPECTING: "inspecting",
  DEREGULATING: "deregulating",
  OTHER: "other",
  NO_INFO: "noinfo",
  NO_DATA: "nodata",
} as const;

/** 予測 */
export const PREDICTION = {
  NO_CHANGE: "nochange",
  EXTEND: "extend",
  SHRINK: "shrink",
  NO_INFO: "noinfo",
  NO_DATA: "nodata",
} as const;
