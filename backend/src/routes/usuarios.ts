import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { SqliteDatabase } from "../db.js";

const cliente=z.object({nombre:z.string().min(3),telefono:z.string().min(8),correo:z.string().email(),edad:z.number().int().min(0).max(120),identidad:z.string().min(5),user:z.string().min(4).max(30),password:z.string().min(6),rol:z.string().min(3)});
const doctor=z.object({nombre:z.string().min(3),no_colegiacion:z.string().min(3),especialidad:z.string().min(3),telefono:z.string().min(8),correo:z.string().email(),user:z.string().min(4).max(30),password:z.string().min(6),rol:z.string().min(3)});
export async function registerUserRoutes(app:FastifyInstance,db:SqliteDatabase){
 async function create(req:any,rep:any,isDoctor:boolean){const p=(isDoctor?doctor:cliente).safeParse(req.body);if(!p.success)return rep.code(422).send({detail:p.error.issues});const x=p.data as any;try{const u=db.prepare("INSERT INTO Usuarios (user,password,rol) VALUES (?,?,?)").run(x.user,await bcrypt.hash(x.password,12),x.rol);if(isDoctor)db.prepare("INSERT INTO Doctores (nombre,no_colegiacion,especialidad,telefono,correo,id_usuario) VALUES (?,?,?,?,?,?)").run(x.nombre,x.no_colegiacion,x.especialidad,x.telefono,x.correo,u.lastInsertRowid);else db.prepare("INSERT INTO Clientes (nombre,telefono,correo,identidad,edad,id_usuario) VALUES (?,?,?,?,?,?)").run(x.nombre,x.telefono,x.correo,x.identidad,x.edad,u.lastInsertRowid);return rep.code(201).send({detail:"Usuario creado correctamente"});}catch{return rep.code(409).send({detail:"El usuario ya existe"});}}
 app.post("/crear/nuevo_cliente",async(req,rep)=>create(req,rep,false));app.post("/crear/nuevo_doctor",async(req,rep)=>create(req,rep,true));
}
