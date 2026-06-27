import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { drizzle } from "drizzle-orm/d1";
import * as db from "../db";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  OAUTH_SERVER_URL: string;
  VITE_APP_ID: string;
  OWNER_OPEN_ID: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
  ASSETS: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Env }>();

// Global error handling
app.onError((err, c) => {
  console.error("APP ERROR:", err);
  return c.text("Internal Server Error: " + err.message, 500);
});

app.use("*", cors());

// Create context for tRPC (directly from Hono c)
const createContext = async (c: any) => {
  const database = drizzle(c.env.DB);
  
  // First, try to get or create a default user
  let user = await db.getUserByOpenId(database, "default-user-id");
  if (!user) {
    user = await db.upsertUser(database, {
      openId: "default-user-id",
      name: "User",
      email: "user@example.com",
      loginMethod: "default",
      lastSignedIn: new Date(),
    });
  }
  
  return {
    req: c.req,
    res: c.res,
    user: user,
    db: database,
    env: c.env,
  };
};

// tRPC API endpoint (with proper type safety)
app.use("/api/trpc/*", trpcServer({
  router: appRouter,
  createContext: async (opts, c) => {
    return await createContext(c);
  },
  onError: ({ path, error }) => {
    console.error("tRPC error on path:", path, error);
  },
}));

// For all other routes, try to serve static assets first
app.get("*", async (c) => {
  const path = c.req.path;

  // If it's an API request, let it 404
  if (path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }

  // Try ASSETS binding if available
  if (c.env.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok && assetRes.status !== 404) {
        return assetRes;
      }
    } catch (err) {
      console.error("Error serving static assets:", err);
    }

    // SPA fallback via ASSETS: serve index.html for client-side routing
    try {
      const indexReq = new Request(new URL("/index.html", c.req.url).toString(), c.req.raw);
      const indexRes = await c.env.ASSETS.fetch(indexReq);
      return new Response(indexRes.body, {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    } catch (err) {
      console.error("Error serving index.html fallback:", err);
    }
  }

  // Last resort: minimal SPA shell
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mail Dashboard</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index-B0ZNy_X_.js"></script>
  <link rel="stylesheet" href="/assets/index-DuDygwF2.css" />
</body>
</html>`);
});

export default app;
