import type { FastifyInstance } from "fastify";
import type { SqliteDatabase } from "../db.js";

export async function registerDoctorRoutes(app: FastifyInstance, database: SqliteDatabase): Promise<void> {
  app.get("/doctores/", async (request) => {
    const query = request.query as { limite?: string; salto?: string };
    const limite = Math.min(Math.max(Number(query.limite ?? 10), 1), 100);
    const salto = Math.max(Number(query.salto ?? 0), 0);
    return database.prepare("SELECT id, nombre, no_colegiacion, especialidad, telefono, correo, id_usuario FROM Doctores LIMIT ? OFFSET ?").all(limite, salto);
  });
}
