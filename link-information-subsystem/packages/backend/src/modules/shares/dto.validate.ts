import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, isLatitude, isLongitude, isNumber } from "class-validator";
import dayjs from "dayjs";
@ValidatorConstraint({ name: "isBBox", async: false })
export class IsBBox implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) {
      return true;
    }

    const [w, s, e, n] = value.split(",");
    return n && isLongitude(w.trim()) && isLatitude(s.trim()) && isLongitude(e.trim()) && isLatitude(n.trim());
  }
}

@ValidatorConstraint({ name: "isCity", async: false })
export class IsCity implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    // cityCodeが5桁であるかの判定
    if (String(value).length !== 5) {
      return false;
    }

    // NaN判定
    const numberValue = Number(value);
    if (!isNumber(numberValue)) {
      return false;
    }

    // citycodeの最小値（北海道札幌市中央区）
    const MIN_CITY_CODE = Number("01101");
    // citycodeの最大値（沖縄県うるま市・金武町境界部地先の埋立地）
    const MAX_CITY_CODE = Number("47801");

    return numberValue >= MIN_CITY_CODE && numberValue <= MAX_CITY_CODE;
  }
}

@ValidatorConstraint({ name: "isMesh", async: false })
export class IsMesh implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    // NaN判定
    if (!isNumber(value)) {
      return false;
    }

    const meshCodeString = String(value);
    // 1,2,3次メッシュコードの桁数
    const meshLengths = [4, 6, 8];

    // 1,2,3次メッシュコード判定
    if (!meshLengths.includes(meshCodeString.length)) {
      return false;
    }

    // 日本国内の最小・最大のメッシュコード
    const MIN_MESH = 3622;
    const MAX_MESH = 68482730;

    return value >= MIN_MESH && value <= MAX_MESH;
  }
}

// bbox, 空間ID, city, meshのどれか１つが含まれかのパラメーターチェック
@ValidatorConstraint({ name: "isGeometry", async: false })
export class IsGeometry implements ValidatorConstraintInterface {
  validate(_value: string, validationArguments: ValidationArguments): boolean {
    const paramsKeys = Object.keys(validationArguments.object);

    // x,y,zが3つ揃う場合のみOK。
    const voxelKeys = ["x", "y", "z"];
    const geomKeys = ["bbox", "mesh", "city"];

    // 空間ID指定がある場合
    const hasVoxelKeys = voxelKeys.every((o) => paramsKeys.includes(o));
    const voxelParamCount = voxelKeys.filter((v) => paramsKeys.some((o) => v === o)).length;

    // bbox, mesh, cityがあるかの判定
    const geomParamCount = paramsKeys.filter((o) => geomKeys.some((r) => o === r)).length;

    // xyzfのみの場合
    if (hasVoxelKeys && geomParamCount === 0) {
      return true;
    }

    // xyzfがなく、bbox, mesh, cityのどれかがある場合
    if (voxelParamCount === 0 && geomParamCount === 1) {
      return true;
    }

    return false;
  }
}

// C-2-2[B] 座標列(LineString)データモデル取得のリクエストで利用
@ValidatorConstraint({ name: "isTwoVoxels", async: false })
export class IsTwoVoxels implements ValidatorConstraintInterface {
  validate(_value: string, validationArguments: ValidationArguments): boolean {
    const paramsKeys = Object.keys(validationArguments.object);
    const voxelsKeys = ["startX", "startY", "startZ", "endX", "endY", "endZ"];
    const geomOptionalKeys = ["roadName", "geodetic"];

    // ２地点の空間IDが存在する場合
    if (voxelsKeys.every((r) => paramsKeys.includes(r))) {
      return true;
    }

    // roadName, geodeticのみ存在する場合
    if (!voxelsKeys.some((key) => paramsKeys.includes(key)) && geomOptionalKeys.some((key) => paramsKeys.includes(key))) {
      return false;
    }

    return false;
  }
}

// timestamp指定の場合、startTimestamp, endTimestampの指定不可。
@ValidatorConstraint({ name: "isOnlyTimestamp", async: false })
export class IsOnlyTimestamp implements ValidatorConstraintInterface {
  validate(_value: string, validationArguments: ValidationArguments): boolean {
    const paramsKeys = Object.keys(validationArguments.object);
    const hasTimestamp = paramsKeys.includes("timestamp");
    const hasStartAndEndTimestamp = ["startTimestamp", "endTimestamp"].some((e) => paramsKeys.includes(e));
    return !(hasTimestamp && hasStartAndEndTimestamp);
  }
}

// startTimestamp指定の場合、endTimestampの指定が必須。endTimestamp指定の場合はstartTimestampの指定が必須。
@ValidatorConstraint({ name: "isStartAndEndTimestamp", async: false })
export class IsStartAndEndTimestamp implements ValidatorConstraintInterface {
  validate(_value: string, validationArguments: ValidationArguments): boolean {
    const paramsKeys = Object.keys(validationArguments.object);
    const hasStartAndEndTimestamp = ["startTimestamp", "endTimestamp"].every((t) => paramsKeys.includes(t));
    const startAndEndTimestamp = validationArguments.object as any;

    return hasStartAndEndTimestamp && startAndEndTimestamp.startTimestamp < startAndEndTimestamp.endTimestamp;
  }
}

@ValidatorConstraint({ name: "isDateString", async: false })
export class IsDateString implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) {
      return true;
    }

    return value === dayjs(value).format("YYYY-MM-DD");
  }
}

// C-2-2[B] 共有資源データモデル取得のリクエストで利用
@ValidatorConstraint({ name: "isValidFromAndValidUntil", async: false })
export class IsValidFromAndValidUntil implements ValidatorConstraintInterface {
  validate(_value: string, args: ValidationArguments): boolean {
    const now = dayjs();
    const validFrom = dayjs(args.object["validFrom"]);
    const validUntil = args.object["validUntil"] ? dayjs(args.object["validUntil"]) : null;
    // validUntil(予約終了時刻)が無い場合
    if (validUntil === null) {
      return validFrom.isAfter(now);
    } else {
      //　validFrom(予約開始時刻)＜validUntil(予約終了時刻)
      return validFrom.isBefore(validUntil) && validFrom.isAfter(now);
    }
  }
}

// zoomLevel, geodetic, roadNameのみ指定した場合のパラメーターチェック
@ValidatorConstraint({ name: "IsGeometryOptional", async: false })
export class IsGeometryOptional implements ValidatorConstraintInterface {
  validate(_value: string, validationArguments: ValidationArguments): boolean {
    const paramsKeys = Object.keys(validationArguments.object);
    const geomKeys = ["x", "y", "z", "bbox", "mesh", "city"];
    const geomOptionalKeys = ["zoomLevel", "roadName", "geodetic", "reg", "timestamp", "startTimestamp", "endTimestamp"];

    // voxel(x,y,z), bbox, mesh, cityの指定がなく、zoomLevel, geodetic, roadNameのみ指定の場合
    if (!geomKeys.some((key) => paramsKeys.includes(key)) && geomOptionalKeys.some((key) => paramsKeys.includes(key))) {
      return false;
    }

    return true;
  }
}
