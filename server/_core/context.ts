import type { User } from "../../drizzle/schema";
import { DrizzleD1Database } from "drizzle-orm/d1";

export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
  db: DrizzleD1Database;
};

export function createContext(): TrpcContext {
  // This is a placeholder for local development
  return {
    req: null,
    res: null,
    user: null,
    db: null as any,
  };
}
