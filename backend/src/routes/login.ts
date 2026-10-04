import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createToken } from "../auth.js";
import type { SqliteDatabase } from "../db.js";

const loginSchema = z.object({
  user: z.string().min(5).max(15),
  password: z.string().min(6).max(20),
});

type UserRow = { id: number; user: string; password: string; rol: string };

export async function registerLoginRoutes(app: FastifyInstance, database: SqliteDatabase): Promise<void> {
  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });

    const row = database.prepare("SELECT id, user, password, rol FROM Usuarios WHERE user = ?").get(parsed.data.user) as UserRow | undefined;
    if (!row || !(await bcrypt.compare(parsed.data.password, row.password))) {
      return reply.code(401).send({ detail: "Usuario o contraseña incorrectos" });
    }

    return { user: row.user, rol: row.rol, token: await createToken({ user: row.user, user_id: row.id, rol: row.rol }) };
  });
}
