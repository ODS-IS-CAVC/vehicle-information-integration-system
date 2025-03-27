from fastapi import APIRouter, HTTPException, status, Query, Body
from pydantic import BaseModel, Field, model_validator
from typing import Any, Annotated
from utils import mylogger
import datetime
import math

import SpatialId.common.object.point as transform
import SpatialId.common.object.enum as  enum
import SpatialId.shape.point as ids

router = APIRouter()
logger = mylogger.get_my_logger(__name__)
CRS = 4326  # 系番号取得用の変換元測地系

# 入力値の設定
input_config = {}
input_config["lat"] = {
   "field_name": "latitude", # 表示名
   "required": True, # 必須項目
   "type": "float", # データ型
   "min_range": -85.0511287797, # 最小値
   "max_range": 85.0511287797, # 最大値
}
input_config["lon"] = {
   "field_name": "longitude",
   "required": True,
   "type": "float",
   "min_range": -180,
   "max_range": 180,
}
sort_list =["default", "within", "latest"]

# パラメータエラー レスポンス値
error_message = {
   "ng_required": "Required parameter not found",
   "exception": "Exception error",
   "ng_sort": f"Invalid sort. Sort is one of {sort_list}",
   "ng_datetimes_len": "Start_datetime and end_datetime lengths do not match"
}


# 空間ID/時空間IDの生成
class Latlon2spatialidResponse(BaseModel):
   spatialid: list[str]


@router.get("/latlon2spatialid", response_model=Latlon2spatialidResponse, tags=['spatialid'])
async def get_latlon_spatialid(
   lat: float = Query(..., ge=input_config["lat"]["min_range"], le=input_config["lat"]["max_range"]),
   lon: float = Query(..., ge=-180, le=180),
   alt: float = Query(...),
   h_zoom: int = Query(..., ge=0, le=25),
   v_zoom: int = Query(..., ge=0, le=25),
   crs: int | None = Query(CRS), # Optional, default=4326
   timeid_flg: int | None = Query(0, ge=0, le=1), # Optional
   interval: int | None = Query(0), # Optional
   start_datetime: datetime.datetime | None = None, # Optional
   end_datetime: datetime.datetime | None = None, # Optional
   sort: str | None = Query("default") # Optional
) -> Any:
   logger.info("Start")
   error_msg = []
   id_list = []

   try:
      point = [transform.Point(lon, lat, alt)]
      # 空間IDを取得
      spatialid = ids.get_spatial_ids_on_points(point, h_zoom, v_zoom, crs)[0]
      id_list.append(spatialid)
      logger.info(f"Sucsess, spatialid_response:{spatialid}")
   except Exception as e:
      if "VALUE_CONVERT_ERROR" in str(e) or "OTHER_ERROR"in str(e):
         error_msg.append({"name": "exception", "message": error_message["exception"]})
         throw_request_error(error_msg)
      else:
         throw_request_error(str(e))

   # 時間IDを末尾に追加
   if timeid_flg == 1:
      id_list = []
      # 範囲の終了時刻がある場合、指定された範囲の時間IDを取得
      if end_datetime:
         timeid_list = get_timeid_range(interval, start_datetime, end_datetime, sort)
         for i, timeid in enumerate(timeid_list):
            id_list.append(spatialid + timeid)
      # 範囲の終了時刻が無ければ、空間IDに対して開始時刻の時間IDを付与
      else:
         timeid = get_timeid(interval, start_datetime)
         id_list.append(spatialid + timeid)

   return {
      "spatialid" : id_list
   }


# 空間ID/時空間IDの生成(時間IDの連続取得)
class MultiLatlon2spatialidResponse(BaseModel):
   spatialid: list[list[str]]


class MultiLatolon2spatialidRequest(BaseModel):
   lat: float = Field(ge=input_config["lat"]["min_range"], le=input_config["lat"]["max_range"])
   lon: float = Field(ge=-180, le=180)
   alt: float
   h_zoom: int = Field(ge=0, le=25)
   v_zoom: int = Field(ge=0, le=25)
   crs: int | None = Field(default=CRS) # Optional
   timeid_flg: int | None = Field(0, ge=0, le=1) # Optional
   sequence: bool | None = Field(default=False) # Optional
   limit: int | None = Field(6, ge=0, le=60) # Optional
   interval: int | None = Field(0) # Optional
   start_datetime: list[datetime.datetime] | None = Field([]) # Optional
   end_datetime: list[datetime.datetime] | None = Field([]) # Optional
   sort: str | None = Field("default") # Optional

   @model_validator(mode="after")
   def validate_coordinate(self):
      logger.debug(f"Validate {self}")
      return self


@router.post("/multi_latlon2spatialid", response_model=MultiLatlon2spatialidResponse, tags=['spatialid'])
async def get_multi_latlon_spatialid(items: Annotated[MultiLatolon2spatialidRequest, Body()]) -> Any:
   logger.info(f"Start, request_body{items}")
   error_msg = []
   id_list = []

   try:
      point = [transform.Point(items.lon, items.lat, items.alt)]
      # 空間IDを取得
      spatialid = ids.get_spatial_ids_on_points(point, items.h_zoom, items.v_zoom, items.crs)[0]
      logger.info(f"Sucsess, spatialid_response:{spatialid}")
      id_list.append([spatialid])
   except Exception as e:
      if "VALUE_CONVERT_ERROR" in str(e) or "OTHER_ERROR"in str(e):
         error_msg.append({"name": "exception", "message": error_message["exception"]})
         throw_request_error(error_msg)
      else:
         throw_request_error(str(e))

   # 時間IDを末尾に追加
   if items.timeid_flg == 1:
      id_list = []
      # 終了時刻があれば、範囲指定で取得する(連続データの取得はしない)
      if len(items.end_datetime):
         # 開始時刻と終了時刻の数が合わない場合
         if not len(items.start_datetime) == len(items.end_datetime):
            error_msg.append({"name": "datetime", "message": error_message["ng_datetimes_len"]})
            throw_request_error(error_msg)
         # 入力された時間のペア数分実行する
         for i, end_datetime in enumerate(items.end_datetime):
            start_datetime = items.start_datetime[i]
            timeid_list = get_timeid_range(items.interval, start_datetime, end_datetime, items.sort)
            id_list.append([])
            for timeid in timeid_list:
               id_list[i].append(spatialid + timeid)
      else:
         if not len(items.start_datetime):
            error_msg.append({"name": "start_datetime", "message": error_message["ng_required"]})
            throw_request_error(error_msg)

         # 指定された数だけ連続した時間IDを付与
         if items.sequence:
            id_list.append([])
            for i in range(items.limit):
               timeid = get_timeid(items.interval, items.start_datetime[0], i)
               id_list[0].append(spatialid + timeid)
         # ユーザー指定日時の時間IDを取得
         else:
            id_list.append([])
            for date in items.start_datetime:
               timeid = get_timeid(items.interval, date)
               id_list[0].append(spatialid + timeid)
   return {
      "spatialid" : id_list
   }


# 空間ID/時空間IDから座標を取得
class Spatialid2latlonResponse(BaseModel):
   coordinates: list[dict]


@router.get("/spatialid2latlon", response_model=Spatialid2latlonResponse, tags=['spatialid'])
async def get_coord_by_spatialid(
      id: str = Query(...),
      flg: int = Query(..., ge=0, le=1),
      crs: int | None = Query(CRS)
   ) -> Any:
   logger.info("Start")
   error_msg = []
   datetime_flg = False
   spatialid = id
   latlon_list = []

   # 時空間IDの場合
   if "_" in id:
      datetime_flg = True
      datetime_list = get_datetime(id)
      spatialid = datetime_list["spatialid"]

   try:
      # VERTEX:頂点座標/ CENTER:中心座標
      option = enum.Point_Option.VERTEX if flg == 0 else enum.Point_Option.CENTER
      latlon = ids.get_point_on_spatial_id(spatialid, option, crs)
      logger.info(f"Sucsess, spatialid_response:{latlon}")

      # Pointオブジェクトを辞書型に成形
      latlon_list = [{"lon": point.lon, "lat": point.lat, "alt": point.alt} for point in latlon]
      if datetime_flg:
         latlon_list.append({
            "interval": datetime_list["interval"],
            "start_datetime": datetime_list["start_datetime"],
            "end_datetime": datetime_list["end_datetime"],
         })

      return {
         "coordinates" : latlon_list
      }
   except Exception as e:
      if "VALUE_CONVERT_ERROR" in str(e) or "OTHER_ERROR"in str(e):
         error_msg.append({"name": "exception", "message": error_message["exception"]})
         throw_request_error(error_msg)
      else:
         throw_request_error(str(e))


# 空間ID/時空間IDから座標を取得
class MultiSpatialid2latlonResponse(BaseModel):
   coordinates: list[list[dict]]


class MultiSpatialid2latlonRequest(BaseModel):
   id: list[str]
   flg: int = Field(..., ge=0, le=1)
   crs: int | None = Field(default=CRS) # Optional

   @model_validator(mode="after")
   def validate_ids(self):
      logger.debug(f"Validate {self}")
      error_msg = []
      if len(self.id) == 0:
         error_msg.append({"name": "id", "message": error_message["ng_required"]})
         throw_request_error(error_msg)
      else:
         return self


@router.post("/multi_spatialid2latlon", response_model=MultiSpatialid2latlonResponse, tags=['spatialid'])
async def get_multi_spatialid_latlon(items: Annotated[MultiSpatialid2latlonRequest, Body()]) -> Any:
   logger.info(f"Start, request_body{items}")
   error_msg = []
   latlon_list = []

   # 各spatialidを変換
   for id in items.id:
      datetime_flg = False
      spatialid = id
      # 時空間IDの場合
      if "_" in id:
         datetime_flg = True
         datetime_list = get_datetime(id)
         spatialid = datetime_list["spatialid"]

      try:
         # VERTEX:頂点座標/ CENTER:中心座標
         option = enum.Point_Option.VERTEX if items.flg == 0 else enum.Point_Option.CENTER
         latlon_response = ids.get_point_on_spatial_id(spatialid, option, items.crs)
         logger.info(f"Sucsess, spatialid_response:{latlon_response}")

         # Pointオブジェクトを辞書型に成形
         latlon = [{"lon": point.lon, "lat": point.lat, "alt": point.alt} for point in latlon_response]
         if datetime_flg:
            latlon.append({
               "interval": datetime_list["interval"],
               "start_datetime": datetime_list["start_datetime"],
               "end_datetime": datetime_list["end_datetime"],
            })
         latlon_list.append(latlon)

      except Exception as e:
         if "VALUE_CONVERT_ERROR" in str(e) or "OTHER_ERROR"in str(e):
            error_msg.append({"name": "exception", "message": error_message["exception"]})
            throw_request_error(error_msg)
         else:
            throw_request_error(str(e))

   return {
      "coordinates" : latlon_list
   }


# 時空間IDを生成
def get_timeid(interval, datetime, limit=0):
   error_msg = []
   if not interval:
      error_msg.append({"name": "interval", "message": error_message["ng_required"]})
   if not datetime:
      error_msg.append({"name": "start_datetime", "message": error_message["ng_required"]})

   if not error_msg:
      # 対象日時のタイムスタンプ（UNIX時間）を取得
      target_timestamp = int(datetime.timestamp())
      # 時間インデックスを取得（切り捨て）
      interval_index = math.floor(target_timestamp / interval) + limit
      timeid = f"_{interval}/{interval_index}"

      return timeid
   else:
      throw_request_error(error_msg)


# 時空間IDを生成(範囲指定)
def get_timeid_range(interval, start_datetime, end_datetime, sort):
   error_msg = []
   timeid_list = []

   if not interval:
      error_msg.append({"name": "interval", "message": error_message["ng_required"]})
   if not start_datetime:
      error_msg.append({"name": "start_datetime", "message": error_message["ng_required"]})
   if not sort in sort_list and end_datetime:
      error_msg.append({"name": "sort", "message": error_message["ng_sort"]})

   if not error_msg:
      # 秒以下(ミリ秒)を切り捨て
      s_datetime = start_datetime.replace(microsecond=0)
      e_datetime = end_datetime.replace(microsecond=0)

      # 範囲に重なるすべての時間IDを生成
      if sort == "default":
         # 実数でない場合小数点以下を切り捨てる
         s_index = math.floor(s_datetime.timestamp() / interval)
         e_index = math.floor(e_datetime.timestamp() / interval)
         # インデックスの値から、範囲内に含まれている時間IDの開始時刻・終了時刻を取得
         start = datetime.datetime.fromtimestamp(interval * s_index)
         end = datetime.datetime.fromtimestamp(interval * e_index)

         while start <= end:
            # 対象日時のタイムスタンプ（UNIX時間）を取得
            target_timestamp = int(start.timestamp())
            # 時間インデックスを取得（切り捨て）
            interval_index = math.floor(target_timestamp / interval)
            timeid_list.append(f"_{interval}/{interval_index}")
            start += datetime.timedelta(seconds=interval)

      # 範囲内に収まる時間IDを生成
      elif sort == "within":
         # 実数でない場合 開始時刻のインデックス:切り上げ / 終了時刻のインデックス:切り捨て
         s_index = math.ceil(s_datetime.timestamp() / interval)
         e_index = math.floor(e_datetime.timestamp() / interval)
         # インデックスの値から、範囲内に含まれている時間IDの開始時刻・終了時刻を取得
         start = datetime.datetime.fromtimestamp(interval * s_index)
         end = datetime.datetime.fromtimestamp(interval * e_index)

         # 範囲内に含まれている時間IDの開始時刻・終了時刻の時間IDを取得
         while start < end:
            # 対象日時のタイムスタンプ（UNIX時間）を取得
            target_timestamp = int(start.timestamp())
            # 時間インデックスを取得（切り捨て）
            interval_index = math.floor(target_timestamp / interval)
            timeid_list.append(f"_{interval}/{interval_index}")
            start += datetime.timedelta(seconds=interval)

      # 範囲に重なる時間IDの最新値を取得（入力された終了時刻の時間IDを取得）
      elif sort == "latest":
         # 対象日時のタイムスタンプ（UNIX時間）を取得
         target_timestamp = int(e_datetime.timestamp())
         # 時間インデックスを取得（切り捨て）
         interval_index = math.floor(target_timestamp / interval)
         timeid_list.append(f"_{interval}/{interval_index}")

      return timeid_list
   else:
      throw_request_error(error_msg)


# 時空間IDから日時を取得
def get_datetime(id):
   try:
      index = id.index("_")
      spatialid = id[:index]
      timeid = id[index+1:]
      timeid_list = [int(value) for value in timeid.split("/")]
      # YYYY-MM-DD HH:MM:SS 形式にフォーマット
      s_datetime = datetime.datetime.fromtimestamp(timeid_list[0] * timeid_list[1]).strftime("%Y-%m-%d %H:%M:%S")
      e_datetime = datetime.datetime.fromtimestamp(timeid_list[0] * timeid_list[1] + timeid_list[0]).strftime("%Y-%m-%d %H:%M:%S")

      return {
         "spatialid": spatialid,
         "interval": timeid_list[0],
         "start_datetime": s_datetime,
         "end_datetime": e_datetime
      }
   except Exception as e:
      throw_request_error(str(e))


# 400エラーを返す
def throw_request_error(msg):
   logger.error(f"Failed, error:{msg}")
   raise HTTPException(
      status_code = status.HTTP_400_BAD_REQUEST,
      detail = {
         "title": "request parameters was wrong",
         "invalid-params": msg,
      },
   )