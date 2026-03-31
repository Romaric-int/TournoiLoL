"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

// wrapper client pour exposer la session dans toute l'app
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
