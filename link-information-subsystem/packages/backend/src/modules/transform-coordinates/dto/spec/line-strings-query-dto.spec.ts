import { plainToInstance } from "class-transformer";
import { LineStringsQueryDTO } from "../line-string-query.dto";
import { validate } from "class-validator";
import { GEODETIC } from "src/shares/lib/proj4";

describe("LineStringsQueryDTO", () => {
  const baseQuery = {};
  const MOCK_ZOOM_LEVEL = 20;

  const MOCK_VOXEL = {
    startX: 931283,
    startY: 412959,
    startZ: MOCK_ZOOM_LEVEL,
    startF: 0,
    endX: 931285,
    endY: 412958,
    endZ: MOCK_ZOOM_LEVEL,
    endF: 0,
  };

  //  @Validate(IsTwoVoxels)のバリデーションチェックも含む
  describe("voxels(startX, startY, startZ, startF, endX, endY, endZ, endF)", () => {
    it("空間ID[startX, startY, startZ, endX, endY, endZ]の値が数値で全て存在する場合、エラーにならないこと", async () => {
      const dto = plainToInstance(LineStringsQueryDTO, MOCK_VOXEL);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("空間ID[startX, startY, startZ, startF, endX, endY, endZ, endF]が全て存在しなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(LineStringsQueryDTO, baseQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("空間ID[startF]の値のみの場合、エラーになること", async () => {
      const voxelQuery = { startF: 0 };
      const dto = plainToInstance(LineStringsQueryDTO, voxelQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });

    it("空間IDの指定が[startX, endX]のみの場合、エラーになること", async () => {
      const voxelQuery = { startX: 931283, endX: 931285 };

      const dto = plainToInstance(LineStringsQueryDTO, voxelQuery);
      const errors = await validate(dto);

      expect(errors.length).toBe(2);
    });

    it("文字列の場合、エラーとなること", async () => {
      const voxelQuery = {
        startX: "a",
        startY: "aaa",
        startZ: "1.5",
        startF: "xy",
        endX: "x",
        endY: "y",
        endZ: "1.5",
        endF: "f",
      };

      const dto = plainToInstance(LineStringsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(8);
    });

    it("voxels(startX, startY, startZ, startF, endX, endY, endZ, endF)が存在せずroadNameがある場合、エラーになること", async () => {
      const geodeticQuery = { roadName: "東名高速" };
      const dto = plainToInstance(LineStringsQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("voxels(startX, startY, startZ, startF, endX, endY, endZ, endF)が存在せずgeodeticがある場合、エラーになること", async () => {
      const geodeticQuery = { geodetic: GEODETIC.EPSG4326 };
      const dto = plainToInstance(LineStringsQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("voxels(startX, startY, startZ, startF, endX, endY, endZ, endF)、geodetic、roadNameが存在する場合、エラーにならないこと", async () => {
      const dto = plainToInstance(LineStringsQueryDTO, { ...MOCK_VOXEL, roadName: "東名高速", geodetic: GEODETIC.EPSG4326 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("roadName", () => {
    const queryKey = "roadName";

    it("roadNameがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(LineStringsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("roadNameが文字列の場合、エラーとならないこと", async () => {
      // roadNameのみの場合エラーになるため、空間ID追加
      for (const value of ["国道", "通り", "新名神"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(LineStringsQueryDTO, { ...MOCK_VOXEL, query });
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("roadNameが文字列以外の場合、エラーになること", async () => {
      for (const value of [12348, new Date()]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(LineStringsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });
  });

  describe("geodetic", () => {
    it("geodeticがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(LineStringsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("Geodetic型以外のEPSG4325だと、エラーになること", async () => {
      const geodeticQuery = { geodetic: "EPSG4325" };

      const dto = plainToInstance(LineStringsQueryDTO, geodeticQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("geodetic[EPSG4326]を指定した場合、エラーにならないこと", async () => {
      // geodeticのみの場合、エラーになるため空間ID追加
      const dto = plainToInstance(LineStringsQueryDTO, { ...MOCK_VOXEL, geodetic: GEODETIC.EPSG4326 });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
