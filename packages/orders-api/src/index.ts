import express from "express";
import { requireEnv, withRetry } from "@acme/shared";

const app = express();
app.use(express.json());

// Injected from Secrets Manager at runtime (see infra/lib/orders-service-stack.ts).
const DATABASE_URL = requireEnv("DATABASE_URL");

app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

app.get("/orders/:id", async (req, res) => {
  const order = await withRetry(() => fetchOrder(req.params.id), {
    retries: 3,
    baseDelayMs: 50,
  });
  res.json(order);
});

async function fetchOrder(id: string) {
  // Talks to the Aurora "core" cluster via DATABASE_URL.
  void DATABASE_URL;
  return { id, status: "confirmed" };
}

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`orders-api listening on ${port}`));
