import type { User } from "../../drizzle/schema";
import { DrizzleD1Database } from "drizzle-orm/d1";

export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
  db: DrizzleD1Database;
};

// We don't need createContext here anymore, we define it in worker.ts
