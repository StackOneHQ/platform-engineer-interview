import express from "express";
import { Pool } from "pg";
import { requireEnv } from "@acme/shared";

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });
const API_SECRET = requireEnv("API_SECRET");

app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

app.post("/invoices", async (req, res) => {
  if (req.header("x-api-secret") !== API_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { accountId, amountCents, currency } = req.body;
  const result = await pool.query(
    "insert into invoices (account_id, amount_cents, currency) values ($1, $2, $3) returning id",
    [accountId, amountCents, currency],
  );

  res.status(201).json({ id: result.rows[0].id });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`billing-api listening on ${port}`));
