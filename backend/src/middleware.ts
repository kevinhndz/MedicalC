import type { FastifyRequest } from "fastify";
import { verifyToken, type Claims } from "./auth.js";

export async function authenticated(request: FastifyRequest): Promise<Claims> {
  const token = request.headers.token;
  if (typeof token !== "string") throw new Error("missing token");
  return verifyToken(token);
}

export async function requireRole(request: FastifyRequest, role: string): Promise<Claims> {
  const claims = await authenticated(request);
  if (claims.rol !== role) throw new Error("forbidden");
  return claims;
}
