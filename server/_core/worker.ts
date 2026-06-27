import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { serveStatic } from "hono/cloudflare-workers";
import { drizzle } from "drizzle-orm/d1";

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

// Create context for tRPC
const createContext = (c: any) => {
  // MOCK USER FOR TESTING!
  const mockUser = {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  };
  const db = drizzle(c.env.DB);
  return {
    req: c.req,
    res: c.res,
    user: mockUser,
    db: db,
    env: c.env,
  };
};

// tRPC API endpoint
app.use("/api/trpc/*", trpcServer({
  router: appRouter,
  createContext: (opts) => {
    return createContext(opts.c);
  },
  onError: ({ path, error }) => {
    console.error("tRPC error on path:", path, error);
  },
}));

// Serve static files
app.get("*", serveStatic({ root: "./dist/public" }));

// Fallback to index.html for SPA (single-page app) routing
app.get("*", async (c) => {
  return serveStatic({
    path: "index.html",
    root: "./dist/public",
  })(c);
});

export default app;
