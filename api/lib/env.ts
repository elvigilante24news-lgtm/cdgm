import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  authUrl: required("AUTH_URL"),
  openUrl: required("OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "portal-matriculados-secret-key-2024",
};
