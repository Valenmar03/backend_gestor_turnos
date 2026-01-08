import "express";

export type JwtRole = "SYS_ADMIN" | "OWNER" | "BADMIN" | "PROFESSIONAL";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: JwtRole;
        businessId: string | null;
      };
    }
  }
}
