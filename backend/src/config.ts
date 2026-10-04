import path from "node:path";

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 8000),
  databaseUrl: process.env.UBICACION_ALMACEN ?? path.resolve(process.cwd(), "base.db"),
  jwtSecret: process.env.SECRET_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
};

export function sqliteFilename(url: string): string {
  return url.startsWith("sqlite:///") ? url.slice("sqlite:///".length) : url;
}
