import { neon } from "@neondatabase/serverless";

export default async (request) => {
  const sql = neon(process.env.DATABASE_URL);
  const method = request.method;
  const url = new URL(request.url);
  const exportCsv = url.searchParams.get("export") === "csv";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-tracker-token",
  };

  // Token auth
  const token = process.env.TRACKER_TOKEN;
  if (token) {
    const provided = request.headers.get("x-tracker-token");
    if (provided !== token) {
      return new Response("Unauthorized", { status: 401, headers });
    }
  }

  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
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

    if (method === "GET" && exportCsv) {
      const rows = await sql`SELECT * FROM entries ORDER BY timestamp ASC`;
      const csvRows = rows.map(r =>
        `${r.id},${r.timestamp},${r.sleep},${r.dizziness},${r.alertness},${r.sex}`
      );
      const csv = ["id,timestamp,sleep,dizziness,alertness,sex", ...csvRows].join("\n");
      return new Response(csv, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=tracker_export.csv",
        },
      });
    }

    if (method === "GET") {
      const rows = await sql`SELECT * FROM entries ORDER BY timestamp ASC`;
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      const body = await request.json();
      const { sleep, dizziness, alertness, sex } = body;
      const result = await sql`
        INSERT INTO entries (sleep, dizziness, alertness, sex)
        VALUES (${sleep}, ${dizziness}, ${alertness}, ${sex})
        RETURNING id
      `;
      return new Response(JSON.stringify({ success: true, id: result[0].id }), {
        status: 201,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      await sql`DELETE FROM entries`;
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/entries"
};