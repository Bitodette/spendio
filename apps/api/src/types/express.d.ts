import type { Session, User } from 'better-auth'

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth`; never trust a user id from the client. */
      auth?: { user: User; session: Session }
    }
  }
}

export {}
