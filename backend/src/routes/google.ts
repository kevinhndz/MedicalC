import type { FastifyInstance } from "fastify";
import { OAuth2Client } from "google-auth-library";
import type { SqliteDatabase } from "../db.js";
import { config } from "../config.js";
import { createToken } from "../auth.js";

export async function registerGoogleRoutes(app: FastifyInstance, db: SqliteDatabase) {
  const client = new OAuth2Client(config.googleClientId);
  app.post("/login/google", async (request, reply) => {
    const body = request.body as { id_token?: string };
    if (!body?.id_token) return reply.code(400).send({ detail: "id_token requerido" });
    try {
      const ticket = await client.verifyIdToken({ idToken: body.id_token, audience: config.googleClientId });
      const email = ticket.getPayload()?.email;
      if (!email) return reply.code(401).send({ detail: "No se pudo obtener el correo de Google" });
      const row = db.prepare("SELECT u.id,u.user,u.rol FROM Usuarios u LEFT JOIN Clientes c ON c.id_usuario=u.id LEFT JOIN Doctores d ON d.id_usuario=u.id WHERE c.correo=? OR d.correo=?").get(email,email) as {id:number;user:string;rol:string}|undefined;
      if (!row) return reply.code(404).send({ detail: "Usuario no encontrado" });
      return { user: row.user, rol: row.rol, token: await createToken({ user: row.user, user_id: row.id, rol: row.rol }) };
    } catch { return reply.code(401).send({ detail: "Token de Google invalido o expirado" }); }
  });
}
