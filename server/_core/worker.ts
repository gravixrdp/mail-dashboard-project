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

// Since we're using Cloudflare's assets feature (wrangler.toml assets = ...),
// Cloudflare will handle static files (js, css, index.html at root). For SPA routes
// like /compose, /dashboard, etc., we need to serve index.html, but let's let Cloudflare
// handle the static files first. We'll add a fallback for any path that would 404.
// Since we can't easily intercept Cloudflare's asset serving, let's add a 404 handler:
app.notFound(async (c) => {
  console.log("404 for path:", c.req.path);
  // If it's an API path, let it 404
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }
  // Otherwise, return index.html for SPA routing
  console.log("Falling back to index.html for SPA");
  // We can use c.env.ASSETS.fetch to get index.html from Cloudflare's asset service!
  const url = new URL(c.req.url);
  url.pathname = "/index.html";
  const indexRes = await c.env.ASSETS.fetch(url.toString());
  // Return the index.html response, but make sure status is 200
  return new Response(indexRes.body, {
    status: 200,
    headers: indexRes.headers,
  });
});

export default app;
