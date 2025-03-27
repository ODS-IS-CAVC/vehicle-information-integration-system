import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { VoxelsQueryDTO } from "../voxels-query.dto";

describe("VoxelsQueryDTO", () => {
  const baseQuery = {};

  describe("IsGeometry", () => {
    it("bboxのみ存在する場合、エラーにならないこと", async () => {
      const voxelQuery = {
        bbox: "139.662591974, 35.510053294, 139.660402379, 35.506635841",
      };

      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("meshとcityが存在する場合、エラーになること", async () => {
      const voxelQuery = {
        city: "14107",
        mesh: 533915,
      };
      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it("bbox, mesh, cityが存在しない場合、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("IsGeometryOptional", () => {
    it("bbox, mesh, cityが存在せず、roadNameがある場合、エラーになること", async () => {
      const geodeticQuery = { roadName: "東名高速" };
      const dto = plainToInstance(VoxelsQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("bbox, mesh, cityが存在せず、zoomLevelがある場合、エラーになること", async () => {
      const geodeticQuery = { zoomLevel: 15 };
      const dto = plainToInstance(VoxelsQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("city、roadName、zoomLevelが存在する場合、エラーにならないこと", async () => {
      const geodeticQuery = { city: "14104", roadName: "東名高速", zoomLevel: 15 };
      const dto = plainToInstance(VoxelsQueryDTO, geodeticQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("bbox", () => {
    const queryKey = "bbox";

    it("BBoxがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("BBoxの形式の場合は、エラーとならないこと", async () => {
      const query = { ...baseQuery };
      query[queryKey] = "139.662591974, 35.510053294, 139.660402379, 35.506635841";

      const dto = plainToInstance(VoxelsQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it("BBoxの形式ではない場合は、エラーになること", async () => {
      const query = { ...baseQuery };
      query[queryKey] = "35.510053294, 139.662591974, 35.506635841, 139.660402379";

      const dto = plainToInstance(VoxelsQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });
  });

  describe("mesh", () => {
    const queryKey = "mesh";

    it("meshがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("meshが4, 6, 8桁以外の数字や文字列の場合はエラーになること", async () => {
      for (const value of [1, 12345, 123456789, "abc", "$xyz"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });

    it("meshが4桁[5339], 6桁[533915], 8桁[53391541]の数値の場合、エラーにならないこと", async () => {
      for (const value of [5339, 533915, 53391541]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("meshが[3620]の場合、国内最小のmesh[3622]より小さいためエラーになること", async () => {
      const voxelQuery = { mesh: 3620 };

      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("meshが[68482731]の場合、国内最大のmesh[68482730]より大きいためエラーになること", async () => {
      const voxelQuery = { mesh: 68482731 };

      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("city", () => {
    const queryKey = "city";

    it("cityがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("cityが5桁(許容値01101~47801)以外、または数値でない文字列の場合エラーになること", async () => {
      for (const value of ["123", "123456", "a123", "1$"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });

    it("cityが5桁(許容値01101~47801)の場合、エラーにならないこと", async () => {
      for (const value of ["14107", "13104", "12463"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("cityが['110']の場合、cityの最小値[01101]より小さいためエラーになること", async () => {
      const voxelQuery = { city: "110" };

      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("cityが['48000']の場合、cityの最大値[47801]より大きいためエラーになること", async () => {
      const voxelQuery = { city: "48000" };

      const dto = plainToInstance(VoxelsQueryDTO, voxelQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("roadName", () => {
    const queryKey = "roadName";
    it("roadNameがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("roadNameが文字列の場合、エラーとならないこと", async () => {
      for (const value of ["国道", "通り", "新名神"]) {
        // roadNameのみの場合エラーになるため、cityを設定
        const query = { ...baseQuery, city: 14106 };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("roadNameが文字列以外の場合、エラーになること", async () => {
      for (const value of [12348, new Date()]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(1);
      }
    });
  });

  describe("zoomLevel", () => {
    const queryKey = "zoomLevel";
    it("zoomLevelがなくても、エラーにならないこと", async () => {
      const dto = plainToInstance(VoxelsQueryDTO, baseQuery);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    // zoomLevelのみの場合エラーになるため、cityを設定
    it("数値の場合、エラーにならないこと", async () => {
      for (const value of [5, 15, 20, 25]) {
        const query = { ...baseQuery, city: 14106 };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it("文字列の場合、エラーになること", async () => {
      for (const value of ["12,5", "abc", "a"]) {
        const query = { ...baseQuery };
        query[queryKey] = value;

        const dto = plainToInstance(VoxelsQueryDTO, query);
        const errors = await validate(dto);
        expect(errors.length).toBe(1);
      }
    });
  });
});
