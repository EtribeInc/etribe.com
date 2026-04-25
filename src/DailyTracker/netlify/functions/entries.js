import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sleep INTEGER NOT NULL,
    dizziness INTEGER NOT NULL,
    alertness INTEGER NOT NULL,
    sex INTEGER NOT NULL
  )
`;

export default async (req, context) => {
  const method = req.method;
  const url = new URL(req.url);
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-tracker-token",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // Token auth
  const token = process.env.TRACKER_TOKEN;
  if (token) {
    const provided = req.headers.get("x-tracker-token");
    if (provided !== token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
  }

  try {
    // CSV export
    if (method === "GET" && url.searchParams.get("export") === "csv") {
      const rows = await sql`SELECT * FROM entries ORDER BY timestamp ASC`;
      const csvHeader = "id,timestamp,sleep,dizziness,alertness,sex\n";
      const csvRows = rows.map(r =>
        `${r.id},${r.timestamp},${r.sleep},${r.dizziness},${r.alertness},${r.sex}`
      ).join("\n");
      return new Response(csvHeader + csvRows, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=tracker_export.csv",
        },
      });
    }

    // GET all entries
    if (method === "GET") {
      const rows = await sql`SELECT * FROM entries ORDER BY timestamp ASC`;
      return new Response(JSON.stringify(rows), { status: 200, headers });
    }

    // POST new entry
    if (method === "POST") {
      const { sleep, dizziness, alertness, sex } = await req.json();
      const result = await sql`
        INSERT INTO entries (sleep, dizziness, alertness, sex)
        VALUES (${sleep}, ${dizziness}, ${alertness}, ${sex})
        RETURNING id
      `;
      return new Response(JSON.stringify({ success: true, id: result[0].id }), { status: 201, headers });
    }

    // DELETE all entries
    if (method === "DELETE") {
      await sql`DELETE FROM entries`;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/entries"
};