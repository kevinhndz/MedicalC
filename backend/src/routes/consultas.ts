import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { SqliteDatabase } from "../db.js";
import { requireRole } from "../middleware.js";
const schema=z.object({id_cita:z.number().int(),diagnostico:z.string(),tratamiento:z.string(),notas:z.string().optional()});
export async function registerConsultationRoutes(app:FastifyInstance,db:SqliteDatabase){
 app.get("/consulta/",async(req)=>{const q=req.query as {limite?:string;salto?:string};return db.prepare("SELECT * FROM Consultas LIMIT ? OFFSET ?").all(Math.min(Math.max(Number(q.limite??10),1),80),Math.max(Number(q.salto??0),0));});
 app.post("/consulta/crear_consulta",async(req,rep)=>{try{await requireRole(req,"doctor");}catch{return rep.code(401).send({detail:"Sesion invalida o expirada"});}const p=schema.safeParse(req.body);if(!p.success)return rep.code(422).send({detail:p.error.issues});const c=db.prepare("SELECT id FROM Citas WHERE id=?").get(p.data.id_cita);if(!c)return rep.code(404).send({detail:"Cita no encontrada"});try{const r=db.prepare("INSERT INTO Consultas (id_cita,diagnostico,tratamiento,notas) VALUES (?,?,?,?)").run(p.data.id_cita,p.data.diagnostico,p.data.tratamiento,p.data.notas??null);return rep.code(201).send(db.prepare("SELECT * FROM Consultas WHERE id=?").get(r.lastInsertRowid));}catch{return rep.code(409).send({detail:"La cita ya tiene una consulta"});}});
}
