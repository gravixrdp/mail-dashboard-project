import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  OAUTH_SERVER_URL: string;
  VITE_APP_ID: string;
  OWNER_OPEN_ID: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.use("*", serveStatic({ root: "./dist/public" }));

app.get("*", (c) => {
  return serveStatic({ path: "index.html", root: "./dist/public" })(c);
});

app.onError((err, c) => {
  console.error("Worker Error:", err);
  return c.text("Internal Server Error", 500);
});

export default app;
