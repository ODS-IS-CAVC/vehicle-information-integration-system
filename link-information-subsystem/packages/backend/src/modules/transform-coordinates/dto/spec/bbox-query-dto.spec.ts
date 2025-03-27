import { plainToInstance } from "class-transformer";
import { BBoxQueryDTO } from "../bbox-query.dto";
import { validate } from "class-validator";
import { GEODETIC } from "src/shares/lib/proj4";

describe("BBoxQueryDTO", () => {
  const baseQuery = {};

  describe("IsGeometry", () => {
    it("voxel[x, y, z, f]の値が存在する場合、エラーにならないこと", async () => {
      const voxelQuery = { x: 29103, y: 12903, z: 15 };
      const dto = plainToInstance(BBoxQueryDTO, voxelQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("cityが存在する場合、エラーにならないこと", async () => {
      const cityQuery = {
        city: "14107",
      };
      const dto = plainToInstance(BBoxQueryDTO, cityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("meshとcityが存在する場合、エラーになる", async () => {
      const cityAndMeshQuery = {
        city: "14107",
        mesh: 533915,
      };
      const dto = plainToInstance(BBoxQueryDTO, cityAndMeshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it("voxel[x, y, z, f], mesh, cityが存在しない場合、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("IsGeometryOptional", () => {
    it("voxel[x, y, z, f], mesh, cityが存在せずgeodeticがある場合、エラーになること", async () => {
      const geodeticQuery = { geodetic: GEODETIC.EPSG6668 };
      const dto = plainToInstance(BBoxQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("city、geodeticが存在する場合、エラーにならないこと", async () => {
      const geodeticQuery = { geodetic: GEODETIC.EPSG6668, city: "14104" };
      const dto = plainToInstance(BBoxQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("voxel(x, y, z, f)", () => {
    const MOCK_VOXEL_QUERY = { x: 29103, y: 12903, z: 15, f: 0 };

    it("空間ID[x, y, z]が存在しなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, baseQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("空間ID[x, y, z, f]の数値で全て存在する場合、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, MOCK_VOXEL_QUERY);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("空間ID[x, y, z, f]が文字列や整数以外の場合、エラーになること", async () => {
      const voxelQuery = { x: "abc", y: "d", z: "efg", f: "1.5" };

      const dto = plainToInstance(BBoxQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(4);
    });

    it("空間ID指定が[x, y]のみの場合、エラーになること", async () => {
      const voxelQuery = { x: 29103, y: 12903 };

      const dto = plainToInstance(BBoxQueryDTO, voxelQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(2);
    });

    it("空間ID指定が[x]のみの場合、エラーになること", async () => {
      const voxelQuery = { x: 29103 };

      const dto = plainToInstance(BBoxQueryDTO, voxelQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });
  });

  describe("mesh", () => {
    const queryKey = "mesh";

    it("meshがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("meshが4, 6, 8桁以外の数字や文字列の場合はエラーになること", async () => {
      for (const value of [1, 12345, 123456789, "abc", "$xyz"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(BBoxQueryDTO, query);
        const errors = await validate(dto);
        expect(errors.length).toBe(1);
      }
    });

    it("meshが4桁[5339], 6桁[533915], 8桁[53391541]の数値の場合、エラーにならないこと", async () => {
      for (const value of [5339, 533915, 53391541]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(BBoxQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("meshが[3620]の場合、国内最小のmesh[3622]より小さいためエラーになるこ", async () => {
      const meshQuery = { mesh: 3620 };

      const dto = plainToInstance(BBoxQueryDTO, meshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("meshが[68482731]の場合、国内最大のmesh[68482730]より大きいためエラーになるこ", async () => {
      const meshQuery = { mesh: 68482731 };

      const dto = plainToInstance(BBoxQueryDTO, meshQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("city", () => {
    const queryKey = "city";

    it("cityがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("cityが5桁(許容値01101~47801)以外、または数値でない文字列の場合エラーになること", async () => {
      for (const value of ["123", "123456", "a123", "1$"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(BBoxQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });

    it("cityが5桁(許容値01101~47801)の場合、エラーにならないこと", async () => {
      for (const value of ["14107", "13104", "12463"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(BBoxQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("cityが['110']の場合、cityの最小値[01101]より小さいためエラーになること", async () => {
      const cityQuery = { city: "110" };

      const dto = plainToInstance(BBoxQueryDTO, cityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("cityが['48000']の場合、cityの最大値[47801]より大きいためエラーになること", async () => {
      const cityQuery = { city: "48000" };

      const dto = plainToInstance(BBoxQueryDTO, cityQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("geodetic", () => {
    it("geodeticがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(BBoxQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("Geodetic型以外の[EPSG4325]を指定する場合、エラーになること", async () => {
      const geodeticQuery = { geodetic: "EPSG4325" };

      const dto = plainToInstance(BBoxQueryDTO, geodeticQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("geodetic[EPSG4326]を指定した場合、エラーにならないこと", async () => {
      // geodeticのみの場合、エラーになるためcity追加
      const geodeticQuery = { geodetic: GEODETIC.EPSG4326, city: 14104 };

      const dto = plainToInstance(BBoxQueryDTO, geodeticQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
