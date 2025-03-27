package com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.tier4;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.VehicleInformation;
import com.nttdata.vehicleinfo.collection.timespatialindexcreator.vehicle.test.VehiclesResponseParserTestHelper;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class VehiclesResponseParserTest {

  /** JST */
  private final ZoneId JST = ZoneId.of("Asia/Tokyo");

  /** UTC */
  private final ZoneId UTC = ZoneId.of("UTC");

  @Test
  void constructor_NG() {
    // nullの場合はIllegalArgumentExceptionが発生すること
    assertThrows(IllegalArgumentException.class, () -> new VehiclesResponseParser(null, UTC, UTC));
    // 存在しないファイルの場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class,
        () -> new VehiclesResponseParser(Path.of("NOT_EXISTS"), UTC, UTC));
    // ファイルではない場合はIllegalArgumentExceptionが発生すること
    assertThrows(
        IllegalArgumentException.class, () -> new VehiclesResponseParser(Path.of(""), UTC, UTC));
  }

  @Test
  void toVehicleInformationList() {
    // vehicles_zero.jsonは0件であること
    VehiclesResponseParser resZero = VehiclesResponseParserTestHelper.getZero(UTC, UTC);
    List<VehicleInformation> listZero = resZero.toVehicleInformationList();
    assertEquals(0, listZero.size());

    // vehicles_20241119_000000.jsonは1件であること
    VehiclesResponseParser res20241119 =
        VehiclesResponseParserTestHelper.get20241119000000(UTC, UTC);
    List<VehicleInformation> list20241119 = res20241119.toVehicleInformationList();
    assertEquals(1, list20241119.size());

    // vehicles_20241119_000000.jsonの値が正しく変換されていること
    /*
        {
      "dataModelType": "test1",
      "attribute": [
        {
          "vehicleId": "78aa302c-1600-44b3-a331-e4659c0b28a1",
          "vehicleName": "vehicle1",
          "status": "driving",
          "location": {
            "lat": 35.6242681254456,
            "lng": 139.74258640456,
            "height": 0.01258640981
          },
          "updatedAt": "2014-10-10T04:50:40.000001+00:00"
        }
      ]
    }
    */
    VehicleInformation info20241119 = list20241119.getFirst();
    assertEquals(UTC, info20241119.zoneId());
    assertEquals("test1", info20241119.dataModelType());
    assertEquals("78aa302c-1600-44b3-a331-e4659c0b28a1", info20241119.id());
    assertEquals(Optional.of("78aa302c-1600-44b3-a331-e4659c0b28a1"), info20241119.vehicleId());
    assertEquals(Optional.of("vehicle1"), info20241119.vehicleName());
    assertEquals(Optional.of("driving"), info20241119.status());
    assertEquals(35.6242681254456, info20241119.latitude(), 0.0);
    assertEquals(139.74258640456, info20241119.longitude(), 0.0);
    assertEquals(0.01258640981, info20241119.altitude(), 0.0);
    assertEquals(Optional.of("2014-10-10T04:50:40.000001+00:00"), info20241119.updatedAt());
    // 空間IDの期待値はウラノスGEX 4次元時空間情報基盤用 共通ライブラリ(Python版)にて算出
    // SpatialId.shape.point.f_get_spatial_ids_on_points([SpatialId.common.object.point.Point(139.74258640456, 35.6242681254456, 0.01258640981)], 25, 4326)
    // ['25/0/29802169/13219531']
    assertEquals("25/0/29802169/13219531", info20241119.spatialId());
    assertEquals(
        ZonedDateTime.parse(
                "2014-10-10T04:50:40.000001+00:00", DateTimeFormatter.ISO_OFFSET_DATE_TIME)
            .withZoneSameInstant(UTC)
            .toEpochSecond(),
        info20241119.time());

    // vehicles_20241120_090000.jsonは2件であること
    VehiclesResponseParser res20241120090000 =
        VehiclesResponseParserTestHelper.get20241120090000(UTC, UTC);
    List<VehicleInformation> list20241120090000 = res20241120090000.toVehicleInformationList();
    assertEquals(2, list20241120090000.size());
  }

  @Test
  void toVehicleInformationList_required() {
    // updatedAtの解析に失敗するためvehicles_required.jsonは1件であること
    VehiclesResponseParser resRequired = VehiclesResponseParserTestHelper.getRequired(UTC, UTC);
    List<VehicleInformation> listRequired = resRequired.toVehicleInformationList();
    assertEquals(1, listRequired.size());

    // vehicleIdが存在しない場合はidに"-"が設定されること
    assertEquals("-", listRequired.getFirst().id());
  }

  @Test
  void toVehicleInformationList_illegal_location_spatial_id() {
    // 空間IDの変換に失敗するためvehicles_illegal_location_spatial_id.jsonは0件であること
    VehiclesResponseParser resIllegalSpatialId =
        VehiclesResponseParserTestHelper.getIllegalLocationSpatialId(UTC, UTC);
    List<VehicleInformation> listIllegalSpatialId = resIllegalSpatialId.toVehicleInformationList();
    assertEquals(0, listIllegalSpatialId.size());
  }

  @Test
  void toVehicleInformationList_illegal_location_axispot() {
    // 空間IDの変換は成功するためvehicles_illegal_location_axispot.jsonは1件であること
    VehiclesResponseParser resIllegalAxispot =
        VehiclesResponseParserTestHelper.getIllegalLocationAxispot(UTC, UTC);
    List<VehicleInformation> listIllegalAxispot = resIllegalAxispot.toVehicleInformationList();
    assertEquals(1, listIllegalAxispot.size());
  }

  @Test
  void initJson() throws URISyntaxException, IOException {
    // 20241119000000で初期化した後に20241120090000でinitJson()を呼び出すと上書きされること
    VehiclesResponseParser res = VehiclesResponseParserTestHelper.get20241119000000(UTC, UTC);
    Path inputFilePath =
        Paths.get(
            getClass()
                .getClassLoader()
                .getResource("data/tier4-digitalzensoapi/vehicles/vehicles_20241120090000.json")
                .toURI());
    res.initJson(inputFilePath);
    String expectedInputJson = Files.readString(inputFilePath, StandardCharsets.UTF_8);
    Map expectedInputMap = new ObjectMapper().readValue(expectedInputJson, Map.class);
    assertEquals(expectedInputJson, res.getInputJson());
    assertEquals(expectedInputMap, res.getInputMap());

    // IllegalArgumentExceptionが発生すること
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> {
              res.initJson(Paths.get("invalid_dir/invalid_file.txt"));
            });
    assertEquals("jsonファイルの解析失敗: invalid_dir/invalid_file.txt", exception.getMessage());
  }
}
