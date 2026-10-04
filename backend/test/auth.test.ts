import assert from "node:assert/strict";
import { test } from "node:test";

process.env.SECRET_KEY = "clave-de-prueba";
const { createToken, verifyToken } = await import("../src/auth.js");

test("crea y verifica tokens compatibles", async () => {
  const token = await createToken({ user: "doctor", user_id: 1, rol: "doctor" });
  assert.deepEqual(await verifyToken(token), { user: "doctor", user_id: 1, rol: "doctor" });
});

test("rechaza tokens inválidos", async () => {
  await assert.rejects(() => verifyToken("token-invalido"));
});
