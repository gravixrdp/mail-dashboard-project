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
    fetch: (url: string | Request, init?: RequestInit) => Promise<Response>;
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

// Handle all GET requests - first try static assets, then fallback to index.html
app.get("*", async (c) => {
  try {
    const path = c.req.path;
    console.log("Handling GET request for path:", path);

    // If it's a tRPC request, let trpcServer handle it
    if (path.startsWith("/api/trpc")) {
      return; // Let the app.use("/api/trpc/*") handle it
    }

    // First, try to fetch from Cloudflare ASSETS
    console.log("Trying to fetch static asset from ASSETS.fetch");
    const assetRes = await c.env.ASSETS.fetch(c.req.raw);
    console.log("ASSETS.fetch status:", assetRes.status);

    if (assetRes.ok && assetRes.status !== 404) {
      console.log("Serving static asset");
      return assetRes;
    }

    // If static asset not found, fall back to index.html
    console.log("Falling back to index.html");
    const url = new URL(c.req.url);
    url.pathname = "/index.html";
    const indexRes = await c.env.ASSETS.fetch(url.toString());
    console.log("index.html fetch status:", indexRes.status);
    return new Response(indexRes.body, {
      status: 200,
      headers: indexRes.headers,
    });
  } catch (err) {
    console.error("Error handling GET request:", err);
    return c.text("Internal Server Error: " + (err as Error).message, 500);
  }
});

export default app;
