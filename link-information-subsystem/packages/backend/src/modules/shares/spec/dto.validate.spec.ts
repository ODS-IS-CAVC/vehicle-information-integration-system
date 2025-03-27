import {
  IsBBox,
  IsCity,
  IsMesh,
  IsGeometry,
  IsTwoVoxels,
  IsOnlyTimestamp,
  IsStartAndEndTimestamp,
  IsDateString,
  IsGeometryOptional,
  IsValidFromAndValidUntil,
} from "../dto.validate";

describe("IsBBox", () => {
  let bboxValidator: IsBBox;
  const mockWestLon = 138.566501;
  const mockSouthLat = 35.666914;
  const mockEastLon = 138.571709;
  const mockNorthLat = 35.667581;

  beforeEach(() => {
    bboxValidator = new IsBBox();
  });

  it("RequestParameterが『'138.566501,35.666914,138.571709,35.667581'』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = `${mockWestLon},${mockSouthLat},${mockEastLon},${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(true);
  });

  it("RequestParameterが『'-138.566501,-35.666914,-138.571709,-35.667581'』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = `-${mockWestLon},-${mockSouthLat},-${mockEastLon},-${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(true);
  });

  it("RequestParameterが『'180.000001,35.666914,138.571709,35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `180.000001,${mockSouthLat},${mockEastLon},${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'-180.000001,-35.666914,-138.571709,-35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `-180.000001,-${mockSouthLat},-${mockEastLon},-${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'138.566501,90.000001,138.571709,35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `${mockWestLon},90.000001,${mockEastLon},${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'-138.566501,-90.000001,-138.571709,-35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `-${mockWestLon},-90.000001,-${mockEastLon},-${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'138.566501,35.666914,180.000001,35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `${mockWestLon},${mockSouthLat},180.000001,${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'-138.566501,-35.666914,-180.000001,-35.667581'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `-${mockWestLon},-${mockSouthLat},-180.000001,-${mockNorthLat}`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'138.566501,35.666914,138.571709,90.000001'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `${mockWestLon},${mockSouthLat},${mockEastLon},90.000001`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが『'-138.566501,-35.666914,-138.571709,-90.000001'』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = `-${mockWestLon},-${mockSouthLat},-${mockEastLon},-90.000001`;

    // 実行して結果を比較
    const result = bboxValidator.validate(requestParameter);
    expect(result).toBe(false);
  });

  it("RequestParameterが空文字の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result_empty = bboxValidator.validate("");
    expect(result_empty).toBe(true);
  });
});

describe("IsCity", () => {
  let cityValidator: IsCity;

  beforeEach(() => {
    cityValidator = new IsCity();
  });

  it("CityCodeがString型『'01100'』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("01100");
    expect(result).toBe(false);
  });

  it("CityCodeがString型『'01101'』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("01101");
    expect(result).toBe(true);
  });

  it("CityCodeがString型『'47801'』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("47801");
    expect(result).toBe(true);
  });

  it("CityCodeがString型『'47802'』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("47802");
    expect(result).toBe(false);
  });

  it("CityCodeがString型『'1100'』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("1100");
    expect(result).toBe(false);
  });

  it("CityCodeがString型『'ABCDE'』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("ABCDE");
    expect(result).toBe(false);
  });

  it("CityCodeが空文字の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = cityValidator.validate("");
    expect(result).toBe(false);
  });
});

describe("IsMesh", () => {
  let meshValidator: IsMesh;

  beforeEach(() => {
    meshValidator = new IsMesh();
  });

  it("MeshCodeがNumber型『3621』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(3621);
    expect(result).toBe(false);
  });
  it("MeshCodeがNumber型『3622』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(3622);
    expect(result).toBe(true);
  });

  it("MeshCodeがNumber型『10000』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(10000);
    expect(result).toBe(false);
  });

  it("MeshCodeがNumber型『100000』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(100000);
    expect(result).toBe(true);
  });

  it("MeshCodeがNumber型『1000000』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(1000000);
    expect(result).toBe(false);
  });

  it("MeshCodeがNumber型『68482730』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(68482730);
    expect(result).toBe(true);
  });

  it("MeshCodeがNumber型『68482731』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(68482731);
    expect(result).toBe(false);
  });

  it("MeshCodeがString型『'ABCDE'』の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate("ABCDE" as unknown as number);
    expect(result).toBe(false);
  });

  it("MeshCodeが空文字の場合にバリデーションチェックが失敗すること", () => {
    // 実行して結果を比較
    const result = meshValidator.validate(undefined);
    expect(result).toBe(false);
  });
});

describe("isGeometry", () => {
  let geometryValidator: IsGeometry;
  const mockSpaceIdX = 953518531;
  const mockSpaceIdY = 422787405;
  const mockSpaceIdZ = 25;
  const mockBBox = [139.7625, 35.675000000000004, 139.775, 35.68333333333334];
  const mockMeshCode = 53394611;
  const mockCityCode = "27100";

  beforeEach(() => {
    geometryValidator = new IsGeometry();
  });

  it("validationArgumentsのobjectが『{ x: 953518531, y: 422787405, z: 30 }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { x: mockSpaceIdX, y: mockSpaceIdY, z: mockSpaceIdZ },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ y: 422787405, z: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { y: mockSpaceIdY, z: mockSpaceIdZ },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ x: 953518531, z: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { x: mockSpaceIdX, z: mockSpaceIdZ },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ x: 953518531, y: 422787405 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { x: mockSpaceIdX, y: mockSpaceIdY },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ bbox: [139.7625, 35.675000000000004, 139.775, 35.68333333333334] }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { bbox: mockBBox },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ mesh: 53394611 }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { bbox: mockMeshCode },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ city: '27100' }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { bbox: mockCityCode },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ bbox: [139.7625, 35.675000000000004, 139.775, 35.68333333333334], mesh: 53394611, city: '27100' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { bbox: mockBBox, mesh: mockMeshCode, city: mockCityCode },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ x: 953518531, y: 422787405, z: 30, mesh: 53394611, city: '27100' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: { x: mockSpaceIdX, y: mockSpaceIdY, z: mockSpaceIdZ, mesh: mockCityCode, city: mockCityCode },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{}』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {},
      property: "test_property",
    };

    // 実行して結果を比較
    const result = geometryValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
});

describe("IsTwoVoxels", () => {
  let twoVoxelsValidator: IsTwoVoxels;
  const mockStartSpaceIdX = 953518531;
  const mockStartSpaceIdY = 422787405;
  const mockStartSpaceIdZ = 30;
  const mockEndSpaceIdX = 941075056;
  const mockEndSpaceIdY = 426447931;
  const mockEndSpaceIdZ = 30;

  beforeEach(() => {
    twoVoxelsValidator = new IsTwoVoxels();
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startY: 422787405, startZ: 30, endX: 941075056, endY: 426447931, endZ: 30 }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startY: mockStartSpaceIdY,
        startZ: mockStartSpaceIdZ,
        endX: mockEndSpaceIdX,
        endY: mockEndSpaceIdY,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ startY: 422787405, startZ: 30, endX: 941075056, endY: 426447931, endZ: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startY: mockStartSpaceIdY,
        startZ: mockStartSpaceIdZ,
        endX: mockEndSpaceIdX,
        endY: mockEndSpaceIdY,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startZ: 30, endX: 941075056, endY: 426447931, endZ: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startZ: mockStartSpaceIdZ,
        endX: mockEndSpaceIdX,
        endY: mockEndSpaceIdY,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startY: 422787405, endX: 941075056, endY: 426447931, endZ: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startY: mockStartSpaceIdY,
        endX: mockEndSpaceIdX,
        endY: mockEndSpaceIdY,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startY: 422787405, startZ: 30, endY: 426447931, endZ: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startY: mockStartSpaceIdY,
        startZ: mockStartSpaceIdZ,
        endY: mockEndSpaceIdY,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startY: 422787405, startZ: 30, endX: 941075056, endZ: 30 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startY: mockStartSpaceIdY,
        startZ: mockStartSpaceIdZ,
        endX: mockEndSpaceIdX,
        endZ: mockEndSpaceIdZ,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startX: 953518531, startY: 422787405, startZ: 30, endX: 941075056, endY: 426447931 }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startX: mockStartSpaceIdX,
        startY: mockStartSpaceIdY,
        startZ: mockStartSpaceIdZ,
        endX: mockEndSpaceIdX,
        endY: mockEndSpaceIdY,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{}』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {},
      property: "test_property",
    };

    // 実行して結果を比較
    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("2地点の空間IDがなくroadNameのみ存在する場合、エラーになること", () => {
    const requestParameter = {
      value: "石垣",
      constraints: undefined,
      targetName: "LineStringsQueryDTO",
      object: { roadName: "石垣" },
      property: "roadName",
    };

    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("2地点の空間IDがなくgeodeticのみ存在する場合、エラーになること", () => {
    const requestParameter = {
      value: "EPSG4326",
      constraints: undefined,
      targetName: "LineStringsQueryDTO",
      object: { roadName: "EPSG4326" },
      property: "geodetic",
    };

    const result = twoVoxelsValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
});

describe("IsOnlyTimestamp", () => {
  let onlyTimestampValidator: IsOnlyTimestamp;
  // ISOStringを想定
  const mockTimestamp = "2024-11-01T08:22:33Z";
  const mockStartTimestamp = "2024-10-31T23:48:11Z";
  const mockEndTimestamp = "2024-11-02T15:49:55Z";

  beforeEach(() => {
    onlyTimestampValidator = new IsOnlyTimestamp();
  });

  it("validationArgumentsのobjectが『{ timestamp: '2024-11-01T08:22:33Z' }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        timestamp: mockTimestamp,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = onlyTimestampValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ timestamp: '2024-11-01T08:22:33Z', startTimestamp: '2024-10-31T23:48:11Z', endTimestamp: '2024-11-02T15:49:55Z' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        timestamp: mockTimestamp,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = onlyTimestampValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
});

describe("IsStartAndEndTimestamp", () => {
  let startAndEndTimestampValidator: IsStartAndEndTimestamp;
  const mockTimestamp1 = "2024-10-31T23:48:11Z";
  const mockTimestamp2 = "2024-11-02T15:49:55Z";

  beforeEach(() => {
    startAndEndTimestampValidator = new IsStartAndEndTimestamp();
  });

  it("validationArgumentsのobjectが『{ startTimestamp: '2024-10-31T23:48:11Z', endTimestamp: '2024-11-02T15:49:55Z' }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startTimestamp: mockTimestamp1,
        endTimestamp: mockTimestamp2,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = startAndEndTimestampValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });

  it("validationArgumentsのobjectが『{ startTimestamp: '2024-11-02T15:49:55Z', endTimestamp: '2024-10-31T23:48:11Z' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startTimestamp: mockTimestamp2,
        endTimestamp: mockTimestamp1,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = startAndEndTimestampValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("validationArgumentsのobjectが『{ startTimestamp: '2024-10-31T23:48:11Z', endTimestamp: '2024-10-31T23:48:11Z' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        startTimestamp: mockTimestamp1,
        endTimestamp: mockTimestamp1,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = startAndEndTimestampValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
});

describe("IsDateString", () => {
  let dateStringValidator: IsDateString;

  beforeEach(() => {
    dateStringValidator = new IsDateString();
  });

  it("Dateが『'2024-11-01'』の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = dateStringValidator.validate("2024-11-01");
    expect(result).toBe(true);
  });

  it("Dateが空文字の場合にバリデーションチェックが成功すること", () => {
    // 実行して結果を比較
    const result = dateStringValidator.validate("");
    expect(result).toBe(true);
  });
});

describe("IsValidFromAndValidUntil", () => {
  let validFromAndValidUntilValidator: IsValidFromAndValidUntil;

  const mockValidFrom = "2099-01-01T23:48:11Z";
  const mockValidUntil = "2099-02-01T15:49:55Z";
  const mockOldValidFrom = "2000-01-01T23:48:11Z";

  beforeEach(() => {
    validFromAndValidUntilValidator = new IsValidFromAndValidUntil();
  });

  it("validationArgumentsのobjectが『{ validFrom: '2099-01-01T23:48:11Z', validUntil: '2099-02-01T15:49:55Z' }』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        validFrom: mockValidFrom,
        validUntil: mockValidUntil,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = validFromAndValidUntilValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });
  it("validationArgumentsのobjectが『{ validFrom: '2099-02-01T15:49:55Z', validUntil: '2099-01-01T23:48:11Z' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        validFrom: mockValidUntil,
        validUntil: mockValidFrom,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = validFromAndValidUntilValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
  it("validationArgumentsのobjectが『{ validFrom: '2000-01-01T23:48:11Z', validUntil: '2099-02-01T15:49:55Z' }』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        validFrom: mockOldValidFrom,
        validUntil: mockValidUntil,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = validFromAndValidUntilValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
  it("validationArgumentsのobjectが『{ validFrom: '2099-01-01T23:48:11Z'}』の場合にバリデーションチェックが成功すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        validFrom: mockValidFrom,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = validFromAndValidUntilValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });
  it("validationArgumentsのobjectが『{ validFrom: '2000-01-01T23:48:11Z'}』の場合にバリデーションチェックが失敗すること", () => {
    // モックデータの設定
    const requestParameter = {
      value: "test_value",
      constraints: ["test_constraints1", "test_constraints2"],
      targetName: "test_name",
      object: {
        validFrom: mockOldValidFrom,
      },
      property: "test_property",
    };

    // 実行して結果を比較
    const result = validFromAndValidUntilValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });
});

describe("IsGeometryOptional", () => {
  let geometryOptionalValidator: IsGeometryOptional;

  beforeEach(() => {
    geometryOptionalValidator = new IsGeometryOptional();
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、zoomLevelの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      value: "15",
      constraints: undefined,
      targetName: "VoxelsQueryDTO",
      object: { zoomLevel: 15 },
      property: "",
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、geodeticの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      value: "EPSG4326",
      constraints: undefined,
      targetName: "BBoxQueryDTO",
      object: { geodetic: "EPSG4326" },
      property: "geodetic",
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、roadNameの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      value: "石垣",
      constraints: undefined,
      targetName: "VoxelsQueryDTO",
      object: { roadName: "石垣" },
      property: "roadName",
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、regの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      targetName: "HdLaneCenterGeoJSONGetQueryDTO",
      property: "reg",
      object: { reg: "ZONE30" },
      value: "ZONE30",
      constraints: undefined,
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、timestampの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      targetName: "HdLaneCenterGeoJSONGetQueryDTO",
      property: "timestamp",
      object: { timestamp: "2024-01-23T11:22:33Z" },
      value: "2024-01-23T11:22:33Z",
      constraints: undefined,
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、startTimestampの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      targetName: "RoadGeoJSONWithTimestampGetQueryDTO",
      property: "startTimestamp",
      object: {
        startTimestamp: "2024-01-23T15:00:00Z",
      },
      value: "2024-01-23T15:00:00Z",
      constraints: undefined,
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("voxel(x,y,z), bbox, voxel, mesh, cityの指定がなく、endTimestampの指定がある場合バリデーションが失敗すること。", () => {
    const requestParameter = {
      targetName: "RoadGeoJSONWithTimestampGetQueryDTO",
      property: "endTimestamp",
      object: {
        endTimestamp: "2024-01-22T15:00:00Z",
      },
      value: "2024-01-22T15:00:00Z",
      constraints: undefined,
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(false);
  });

  it("cityとroadNameの指定がある場合バリデーションが成功すること。", () => {
    const requestParameter = {
      value: "石垣",
      constraints: undefined,
      targetName: "VoxelsQueryDTO",
      object: { roadName: "石垣", city: "14104" },
      property: "roadName",
    };

    const result = geometryOptionalValidator.validate("", requestParameter);
    expect(result).toBe(true);
  });
});
