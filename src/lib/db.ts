import { createClient } from "@libsql/client/web";

// By explicitly setting `protocol: "http"`, we force the client to use the
// pure JavaScript fetch-based implementation, completely avoiding any native
// modules or WebSocket issues, thus ensuring maximum compatibility.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export default db;