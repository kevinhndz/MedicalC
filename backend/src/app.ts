import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase, assertDatabase } from "./db.js";
import { registerLoginRoutes } from "./routes/login.js";
import { registerDoctorRoutes } from "./routes/doctores.js";
import { registerPatientRoutes } from "./routes/pacientes.js";
import { registerMedicationRoutes } from "./routes/medicamentos.js";
import { registerAppointmentRoutes } from "./routes/citas.js";
import { registerConsultationRoutes } from "./routes/consultas.js";
import { registerRecipeRoutes } from "./routes/recetas.js";
import { registerUserRoutes } from "./routes/usuarios.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const database = openDatabase();
  app.addHook("onClose", async () => database.close());

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.get("/health", async (_request, reply) => {
    try {
      assertDatabase(database);
      return { status: "ok", database: "ok" };
    } catch {
      return reply.code(503).send({ status: "error", database: "unavailable" });
    }
  });

  await registerLoginRoutes(app, database);
  await registerDoctorRoutes(app, database);
  await registerPatientRoutes(app, database);
  await registerMedicationRoutes(app, database);
  await registerAppointmentRoutes(app, database);
  await registerConsultationRoutes(app, database);
  await registerRecipeRoutes(app, database);
  await registerUserRoutes(app, database);

  await app.register(fastifyStatic, {
    root: path.resolve(here, "../../Frontend"),
    wildcard: false,
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.method === "GET" && !request.url.startsWith("/api/")) {
      return reply.sendFile("index.html");
    }
    return reply.code(404).send({ detail: "Not Found" });
  });

  return app;
}
