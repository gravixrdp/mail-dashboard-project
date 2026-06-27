import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
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

// Update createContext for Hono
const createContext = (c: any) => {
  // MOCK USER FOR DEVELOPMENT! This will let us see the frontend!
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

// tRPC middleware
app.use("/api/trpc/*", trpcServer({
  router: appRouter,
  createContext: (opts => {
    return createContext(opts.c);
  }),
  onError: ({ path, error }) => {
    console.error("tRPC error on", path, error);
  },
}));

// Serve static assets from __STATIC_CONTENT (from wrangler assets config)
app.get("*", async (c) => {
  try {
    const staticOptions = {
      ASSET_NAMESPACE: (c.env as any).__STATIC_CONTENT,
      ASSET_MANIFEST: (c.env as any).__STATIC_CONTENT_MANIFEST,
    };
    const asset = await getAssetFromKV({
      request: c.req.raw,
      waitUntil(promise) {
        c.executionCtx.waitUntil(promise);
      },
    }, staticOptions);
    return new Response(asset.body, asset);
  } catch (e) {
    console.error(e);
    // SPA fallback: serve index.html
    try {
      const indexHtml = await getAssetFromKV({
        request: new Request(new URL("/index.html", c.req.url)),
        waitUntil(promise) {
          c.executionCtx.waitUntil(promise);
        },
      }, {
        ASSET_NAMESPACE: (c.env as any).__STATIC_CONTENT,
        ASSET_MANIFEST: (c.env as any).__STATIC_CONTENT_MANIFEST,
      });
      return new Response(indexHtml.body, indexHtml);
    } catch (e2) {
      return c.text("Not Found", 404);
    }
  }
});

export default app;
