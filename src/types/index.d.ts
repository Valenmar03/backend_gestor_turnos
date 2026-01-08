import "express-serve-static-core";

export type JwtRole = "SYS_ADMIN" | "OWNER" | "BADMIN" | "PROFESSIONAL";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: JwtRole;
      businessId: string | null;
    };
  }
}
