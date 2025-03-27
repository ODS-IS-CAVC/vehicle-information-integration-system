import { Geometry } from "typeorm";
import { Convert } from "../convert";

type TestProperties = {
  type: number;
  number: number;
};

describe("Convert", () => {
  describe("rowsToGeojson", () => {
    it("渡された配列がGeoJSONに整形して返却されること", () => {
      const rows: { geometry: Geometry | string; type: number; number: number }[] = [
        { geometry: { type: "Point", coordinates: [135, 34] }, type: 1, number: 11 },
        { geometry: { type: "Point", coordinates: [136, 35] }, type: 2, number: 22 },
        { geometry: JSON.stringify({ type: "Point", coordinates: [137, 36] }), type: 3, number: 33 },
      ];
      const result = Convert.rowsToGeojson<TestProperties>(rows);
      const expected = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [135, 34] },
            properties: { type: 1, number: 11 },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [136, 35] },
            properties: { type: 2, number: 22 },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [137, 36] },
            properties: { type: 3, number: 33 },
          },
        ],
      };

      expect(result).toEqual(expected);
    });
  });
});
