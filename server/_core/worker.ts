import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../routers";
import { drizzle } from "drizzle-orm/d1";
import * as db from "../db";

type Env = {
  DB: D1Database;
  ASSETS: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error("APP ERROR:", err);
  return c.text("Internal Server Error: " + err.message, 500);
});

app.use("*", cors());

const createContext = async (c: any) => {
  const database = drizzle(c.env.DB);
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

app.use("/api/trpc/*", trpcServer({
  router: appRouter,
  createContext: async (opts, c) => {
    return await createContext(c);
  },
  onError: ({ path, error }) => {
    console.error("tRPC error on path:", path, error);
  },
}));

app.get("*", async (c) => {
  const path = c.req.path;

  if (path.startsWith("/api/")) {
    return c.json({ error: "Not Found" }, 404);
  }

  if (c.env.ASSETS && typeof c.env.ASSETS.fetch === "function") {
    try {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.ok && assetRes.status !== 404) {
        return assetRes;
      }
    } catch (err) {
      console.error("Error serving static assets:", err);
    }

    try {
      const indexRes = await c.env.ASSETS.fetch(new Request(new URL("/index.html", c.req.url).toString(), c.req.raw));
      return new Response(indexRes.body, {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    } catch (err) {
      console.error("Error serving index.html fallback:", err);
    }
  }

  return c.text("Service Unavailable", 503);
});

export default app;
