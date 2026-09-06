import { randomBytes } from "node:crypto";

export function newManageToken(): string {
  return randomBytes(32).toString("hex");
}
