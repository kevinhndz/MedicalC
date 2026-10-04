import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
export async function buildApp() {
    const app = Fastify({ logger: true });
    await app.register(cors, {
        origin: true,
        credentials: true,
    });
    app.get("/health", async () => ({ status: "ok" }));
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
