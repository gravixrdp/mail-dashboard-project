import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { serveStatic } from "hono/cloudflare-workers";
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

// Serve static files first, then fallback to index.html for SPA
app.get("*", async (c, next) => {
  try {
    console.log("Handling request for path:", c.req.path);
    const staticRes = await serveStatic({ root: "./dist/public" })(c, next);
    console.log("Static response status:", staticRes?.status);
    if (staticRes && staticRes.status !== 404) {
      console.log("Serving static file");
      return staticRes;
    }
    // Fallback to index.html for SPA routes
    console.log("Falling back to index.html");
    return serveStatic({ path: "index.html", root: "./dist/public" })(c);
  } catch (err) {
    console.error("Error serving static files:", err);
    return c.text("Internal Server Error: " + (err as Error).message, 500);
  }
});

export default app;
