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

// Serve static files (JS, CSS, images, etc.)
app.use("/*", serveStatic({ root: "./dist/public", manifest: false }));

// Fallback to index.html for SPA routing
app.get("*", async (c, next) => {
  const path = c.req.path;
  
  // Skip tRPC and static files with extensions
  if (path.startsWith("/api/trpc") || path.includes(".")) {
    return next();
  }
  
  // Serve index.html for all SPA routes
  return serveStatic({ path: "index.html", root: "./dist/public", manifest: false })(c);
});

export default app;
