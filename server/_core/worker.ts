import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from '../routers'
import { serveStatic } from 'hono/cloudflare-workers'
import path from 'path'

type Env = {
  DB: D1Database
  JWT_SECRET: string
  OAUTH_SERVER_URL: string
  VITE_APP_ID: string
  OWNER_OPEN_ID: string
  BUILT_IN_FORGE_API_URL?: string
  BUILT_IN_FORGE_API_KEY?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

// Serve static files from dist/public
app.get('*', serveStatic({ root: './dist/public' }))

// TRPC endpoint (we'll need to adapt context for Workers)
app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext: async (opts) => {
    const req = opts.req as any
    const res = opts.res as any
    return {
      req,
      res,
      // We'll add Cloudflare-specific context here later
    }
  }
}))

export default app
