import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { drizzle } from "drizzle-orm/d1";
import { serveStatic } from "hono/cloudflare-workers";
import * as db from "../db";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  OAUTH_SERVER_URL: string;
  VITE_APP_ID: string;
  OWNER_OPEN_ID: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
  __STATIC_CONTENT: string;
  __STATIC_CONTENT_MANIFEST: string;
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

// Serve static files with correct Hono serveStatic
app.use("/*", serveStatic({ root: "./dist/public" }));

// Fallback all other routes to index.html for SPA (since React Router handles client routing)
app.get("*", async (c, next) => {
  const path = c.req.path;
  // If it's a tRPC path or a static asset (has extension), skip and let next() handle
  if (path.startsWith("/api/trpc") || path.includes(".")) {
    return next();
  }
  // Otherwise, serve index.html for SPA
  return serveStatic({ path: "index.html", root: "./dist/public" })(c);
});

export default app;
