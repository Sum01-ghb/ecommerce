/**
 * Auth schema barrel — re-exports every table in one place.
 *
 * Both `src/lib/db/index.ts` (new) and `src/lib/auth.ts` import from here so
 * there is a single source of truth for the auth schema.
 */
export { user, type User, type NewUser } from "./user";
export { session, type Session, type NewSession } from "./session";
export { account, type Account, type NewAccount } from "./account";
export { verification, type Verification, type NewVerification } from "./verification";
export { guest, type Guest, type NewGuest } from "./guest";
