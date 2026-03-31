import { DefaultSession } from "next-auth";

// extension du type Session pour inclure l'id utilisateur
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
