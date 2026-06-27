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
  console.log("Handling request for path:", path);

  // If it's an API request, let it 404
  if (path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }

  try {
    // Try to fetch the static asset
    const assetRes = await c.env.ASSETS.fetch(c.req.raw);
    console.log("Asset response status:", assetRes.status);
    if (assetRes.ok && assetRes.status !== 404) {
      return assetRes;
    }

    // Fallback to index.html for SPA
    console.log("Falling back to index.html");
    const indexUrl = new URL(c.req.url);
    indexUrl.pathname = "/index.html";
    const indexRes = await c.env.ASSETS.fetch(indexUrl.toString());
    return new Response(indexRes.body, {
      status: 200,
      headers: indexRes.headers,
    });
  } catch (err) {
    console.error("Error serving static assets:", err);
    return c.text("Internal Server Error: " + (err as Error).message, 500);
  }
});

export default app;
