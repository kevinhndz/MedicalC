import { jwtVerify, SignJWT } from "jose";
import { config } from "./config.js";

export type Claims = { user: string; user_id: number; rol: string };

function key(): Uint8Array {
  if (!config.jwtSecret) throw new Error("SECRET_KEY is not configured");
  return new TextEncoder().encode(config.jwtSecret);
}

export async function createToken(claims: Claims): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("30m")
    .sign(key());
}

export async function verifyToken(token: string): Promise<Claims> {
  const result = await jwtVerify(token, key(), { algorithms: ["HS256"] });
  const payload = result.payload;
  if (typeof payload.user !== "string" || typeof payload.user_id !== "number" || typeof payload.rol !== "string") {
    throw new Error("Invalid token claims");
  }
  return { user: payload.user, user_id: payload.user_id, rol: payload.rol };
}
