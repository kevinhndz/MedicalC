import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { SqliteDatabase } from "../db.js";
import { requireRole } from "../middleware.js";

const createSchema = z.object({ nombre: z.string(), presentacion: z.string(), stock: z.number().int().min(0) });
const updateSchema = createSchema.partial();

export async function registerMedicationRoutes(app: FastifyInstance, database: SqliteDatabase): Promise<void> {
  app.addHook("preHandler", async (request, reply) => {
    try { await requireRole(request, "doctor"); } catch { return reply.code(401).send({ detail: "Sesion invalida o expirada" }); }
  });
  app.get("/medicamentos/", async (request) => {
    const q = request.query as { limite?: string; salto?: string };
    return database.prepare("SELECT id, nombre, presentacion, stock FROM Medicamentos LIMIT ? OFFSET ?").all(Math.min(Math.max(Number(q.limite ?? 10), 1), 100), Math.max(Number(q.salto ?? 0), 0));
  });
  app.post("/medicamentos/", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body); if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });
    try { const result = database.prepare("INSERT INTO Medicamentos (nombre,presentacion,stock) VALUES (?,?,?)").run(parsed.data.nombre, parsed.data.presentacion, parsed.data.stock); return reply.code(201).send(database.prepare("SELECT * FROM Medicamentos WHERE id=?").get(result.lastInsertRowid)); }
    catch { return reply.code(409).send({ detail: "El medicamento ya existe" }); }
  });
  app.patch("/medicamentos/:medicamento_id", async (request, reply) => {
    const parsed = updateSchema.safeParse(request.body); if (!parsed.success) return reply.code(422).send({ detail: parsed.error.issues });
    const id = Number((request.params as { medicamento_id: string }).medicamento_id); const fields = Object.entries(parsed.data); if (!fields.length) return reply.code(400).send({ detail: "No hay datos para actualizar" });
    const result = database.prepare(`UPDATE Medicamentos SET ${fields.map(([key]) => `${key}=?`).join(",")} WHERE id=?`).run(...fields.map(([, value]) => value), id); if (!result.changes) return reply.code(404).send({ detail: "Medicamento no encontrado" }); return database.prepare("SELECT * FROM Medicamentos WHERE id=?").get(id);
  });
  app.delete("/medicamentos/:medicamento_id", async (request, reply) => { const result = database.prepare("DELETE FROM Medicamentos WHERE id=?").run(Number((request.params as { medicamento_id: string }).medicamento_id)); if (!result.changes) return reply.code(404).send({ detail: "Medicamento no encontrado" }); return reply.code(204).send(); });
}
