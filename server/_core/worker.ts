import { getAssetFromKV, mapRequestToAsset } from "@cloudflare/kv-asset-handler";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  OAUTH_SERVER_URL: string;
  VITE_APP_ID: string;
  OWNER_OPEN_ID: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Try to serve static assets first
      const response = await getAssetFromKV({
        request,
        waitUntil(promise) {
          ctx.waitUntil(promise);
        },
      });
      return response;
    } catch (e) {
      // If asset not found, fall back to index.html for SPA routing
      try {
        let assetKey = mapRequestToAsset(new Request(new URL("/index.html", new URL(request.url).origin)), {});
        const options = {
          ASSET_NAMESPACE: (env as any).__STATIC_CONTENT,
          ASSET_MANIFEST: (env as any).__STATIC_CONTENT_MANIFEST,
          cacheControl: {
            browserTTL: 0,
            edgeTTL: 0,
            bypassCache: true,
          },
        };
        return await getAssetFromKV({
          request: new Request(new URL("/index.html", request.url)),
          waitUntil(promise) {
            ctx.waitUntil(promise);
          },
        }, options);
      } catch (e2) {
        const pathname = new URL(request.url).pathname;
        return new Response(`"${pathname}" not found`, { status: 404, statusText: "Not Found" });
      }
    }
  },
};
