rootProject.name = "vehicle-information-integration-system"

// 空間ID生成ライブラリ
include("spatial-index-creator")

// 時空間ID生成ライブラリ（気象情報）
include("time-spatial-index-creator-weather")
// 時空間ID生成ライブラリ（車両情報）
include("time-spatial-index-creator-vehicle")
// 時空間ID生成ライブラリ（物標情報）
include("time-spatial-index-creator-target")

// 情報収集AP（気象情報）
include("weather-information-collector")
// 情報収集AP（車両情報）
include("vehicle-information-collector")
// 情報収集AP（物標情報）
include("target-information-collector")

// 仮想データレイクAPIクライアント
include("vdl-api-client")
