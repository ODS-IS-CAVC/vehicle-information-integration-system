export const ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

// env
export const VERIFIED_TOKEN_URL = () => process.env.VERIFIED_TOKEN_URL;
// env
export const NOT_VERIFIED_IP = () => process.env.NOT_VERIFIED_IP.split(",");
// env
export const API_KEY = () => process.env.API_KEY;
