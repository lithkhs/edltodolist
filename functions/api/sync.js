export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "DB binding not found" }), { status: 500 });
    }

    // Ensure the table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS state (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();

    // Fetch state
    const result = await db.prepare("SELECT value FROM state WHERE key = 'app_state'").first("value");
    if (result) {
      return new Response(result, {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return empty state if not initialized
    return new Response(JSON.stringify({ members: [], tasks: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "DB binding not found" }), { status: 500 });
    }

    // Ensure the table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS state (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();

    const body = await context.request.json();
    const valueStr = JSON.stringify(body);

    // Save state
    await db.prepare(`
      INSERT INTO state (key, value)
      VALUES ('app_state', ?1)
      ON CONFLICT(key) DO UPDATE SET value = ?1
    `).bind(valueStr).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
