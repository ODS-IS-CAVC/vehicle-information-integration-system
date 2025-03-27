// auth.const.ts
export const JWT_SECRET_KEY = () => process.env.JWT_SECRET_KEY;
export const JWT_EXPIRE_IN = () => process.env.JWT_EXPIRE_IN;

// aws.const.ts
export const AWS_S3_OBJECT3D_BUCKET = () => process.env.AWS_S3_OBJECT3D_BUCKET;
export const AWS_SECRET_NAME = () => process.env.AWS_SECRET_NAME;

// facade.const.ts
export const FACADE_URL = () => process.env.FACADE_URL;

// role.const.ts
export const VERIFIED_TOKEN_URL = () => process.env.VERIFIED_TOKEN_URL;
export const NOT_VERIFIED_IP = () => process.env.NOT_VERIFIED_IP.split(",");
export const API_KEY = () => process.env.API_KEY;

// weather.const.ts
export const VENTUS_URL = () => process.env.VENTUS_URL;

export const VENTUS_API_KEY = () => process.env.VENTUS_API_KEY;
