import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { SqliteDatabase } from "../db.js";
import { requireRole } from "../middleware.js";

const updateSchema = z.object({
  nombre: z.string().optional(), telefono: z.string().optional(), correo: z.string().email().optional(),
  identidad: z.string().optional(), edad: z.number().int().optional(),
}).strict();

export async function registerPatientRoutes(app: FastifyInstance, database: SqliteDatabase): Promise<void> {
  app.get("/pacientes/", async (request, reply) => {
    try { await requireRole(request, "doctor"); } catch { return reply.code(401).send({ detail: "Sesion invalida o expirada" }); }
    const query = request.query as { limite?: string; salto?: string };
    const limite = Math.min(Math.max(Number(query.limite ?? 10), 1), 100);
    const salto = Math.max(Number(query.salto ?? 0), 0);
    const rows = database.prepare("SELECT id, nombre, telefono, correo, identidad, edad, id_usuario FROM Clientes LIMIT ? OFFSET ?").all(limite, salto);
    if (!rows.length) return reply.code(404).send({ detail: "No hay pacientes registrados" });
    return rows;
  });

  app.patch("/pacientes/:paciente_id", async (request, reply) => {
    try { await requireRole(request, "doctor"); } catch { return reply.code(401).send({ detail: "Sesion invalida o expirada" }); }
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });
    const id = Number((request.params as { paciente_id: string }).paciente_id);
    const fields = Object.entries(parsed.data).filter(([, value]) => value !== undefined);
    if (!fields.length) return reply.code(400).send({ detail: "No hay datos para actualizar" });
    const set = fields.map(([key]) => `${key} = ?`).join(", ");
    const result = database.prepare(`UPDATE Clientes SET ${set} WHERE id = ?`).run(...fields.map(([, value]) => value), id);
    if (!result.changes) return reply.code(404).send({ detail: "Paciente no encontrado" });
    return database.prepare("SELECT id, nombre, telefono, correo, identidad, edad, id_usuario FROM Clientes WHERE id = ?").get(id);
  });

  app.delete("/pacientes/:paciente_id", async (request, reply) => {
    try { await requireRole(request, "doctor"); } catch { return reply.code(401).send({ detail: "Sesion invalida o expirada" }); }
    const id = Number((request.params as { paciente_id: string }).paciente_id);
    const result = database.prepare("DELETE FROM Clientes WHERE id = ?").run(id);
    if (!result.changes) return reply.code(404).send({ detail: "Paciente no encontrado" });
    return reply.code(204).send();
  });
}
