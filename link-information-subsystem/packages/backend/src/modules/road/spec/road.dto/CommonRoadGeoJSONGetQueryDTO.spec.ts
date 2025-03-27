import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CommonRoadGeoJSONGetQueryDTO } from "../../dto/road.dto";

describe("RoadGeoJSONGetQueryDTO", () => {
  const baseQuery = {};

  describe("IsGeometry", () => {
    it("バウンディングボックスが存在する場合、エラーにならないこと。", async () => {
      const bboxQuery = {
        bbox: "139.662591974, 35.510053294, 139.660402379, 35.506635841",
      };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, bboxQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("voxelが存在する場合、エラーにならないこと。", async () => {
      const voxelQuery = { x: 29103, y: 12903, z: 15, f: 0 };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, voxelQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("行政区画コードが存在する場合、エラーにならないこと。", async () => {
      const bboxQuery = {
        city: "14107",
      };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, bboxQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("メッシュコードが存在する場合、エラーにならないこと。", async () => {
      const query = { mesh: 533915 };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("バウンディングボックスおよびタイムスタンプが存在する場合、エラーにならないこと。", async () => {
      const bboxQuery = {
        bbox: "139.662591974, 35.510053294, 139.660402379, 35.506635841",
        timestamp: "2024-11-01T08:22:33Z",
      };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, bboxQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("バウンディングボックスおよび道路名称が存在する場合、エラーにならないこと。", async () => {
      const bboxQuery = {
        bbox: "139.662591974, 35.510053294, 139.660402379, 35.506635841",
        roadName: "札樽道",
      };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, bboxQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("IsGeometryOptional", () => {
    it("roadNameのみ存在する場合、エラーになること", async () => {
      const roadNameQuery = { roadName: "東名高速" };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, roadNameQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("timestampのみ存在する場合、エラーになること", async () => {
      const timestampQuery = { timestamp: "2024-01-23T11:22:33Z" };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, timestampQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("city、roadNameが存在する場合、エラーにならないこと", async () => {
      const roadNameAndCityQuery = { roadName: "東名高速", city: "14104" };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, roadNameAndCityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("bbox", () => {
    const queryKey = "bbox";

    it("バウンディングボックスが存在しない場合、エラーにならないこと。", async () => {
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("バウンディングボックスの形式の場合、エラーにならないこと。", async () => {
      const query = { ...baseQuery };
      query[queryKey] = "139.662591974, 35.510053294, 139.660402379, 35.506635841";

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("バウンディングボックスの形式ではない場合、エラーになること。", async () => {
      const query = { ...baseQuery };
      query[queryKey] = "35.510053294, 139.662591974, 35.506635841, 139.660402379";

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });
  });

  describe("city", () => {
    const queryKey = "city";

    it("行政区画コードが存在しない場合、エラーにならないこと。", async () => {
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("cityが5桁(許容値01101~47801)以外、または数値でない文字列の場合エラーになること", async () => {
      for (const value of ["123", "123456", "a123", "1$"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });

    it("行政区画コードが5桁(許容値01101~47801)の場合、エラーにならないこと。", async () => {
      for (const value of ["14107", "13104", "12463"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("行政区画コードが['110']の場合、最小値[01101]より小さいためエラーになること。", async () => {
      const cityQuery = { city: "110" };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, cityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("行政区画コードが['48000']の場合、最大値である[47801]より大きいためエラーになること。", async () => {
      const cityQuery = { city: "48000" };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, cityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("mesh", () => {
    const queryKey = "mesh";

    it("メッシュコードが存在しない場合、エラーにならないこと", async () => {
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, baseQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("メッシュコードが4, 6, 8桁以外の数字や文字列の場合、エラーになること", async () => {
      for (const value of [1, 12345, 123456789, "abc", "$xyz"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });

    it("メッシュコードが4, 6, 8桁の数値の場合、エラーにならないこと", async () => {
      for (const value of [5339, 533915, 53391541]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("メッシュコードが[3620]の場合、国内最小のmesh[3622]より小さいためエラーになること。", async () => {
      const meshQuery = { mesh: 3620 };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, meshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("メッシュコードが[68482731]の場合、国内最大のmesh[68482730]より大きいためエラーになること。", async () => {
      const meshQuery = { mesh: 68482731 };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, meshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("メッシュコードが[68482731]の場合、国内最大のメッシュコード[68482730]より大きいためエラーになること。", async () => {
      const meshQuery = { mesh: 68482731 };

      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, meshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("timestamp", () => {
    const queryKey = "timestamp";

    it("タイムスタンプがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("タイムスタンプが文字列の場合、エラーにならないこと", async () => {
      for (const value of ["2024-11-01T08:22:33Z"]) {
        // timestampのみの場合エラーになるため、city追加
        const query = { ...baseQuery, city: "14104" };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("タイムスタンプがISO 8601の表現ではない場合、エラーになること", async () => {
      // 時間部分に無効な区切り文字
      const timestampQuery = { timestamp: "2024-11-01T08-22-33Z" };
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, timestampQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("roadName", () => {
    const queryKey = "roadName";
    it("roadNameがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("roadNameが文字列の場合、エラーとならないこと", async () => {
      for (const value of ["国道", "通り", "新名神"]) {
        // roadNameのみの場合エラーになるため、cityを設定。
        const query = { ...baseQuery, city: "14104" };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("roadNameが文字列以外の場合、エラーになること", async () => {
      for (const value of [12348, new Date()]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });
  });
});
