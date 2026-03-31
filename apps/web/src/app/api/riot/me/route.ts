import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEST_API_URL}/riot/me?userId=${session.user.id}`,
    {
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    },
  );

  const text = await res.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  return NextResponse.json(data, { status: res.status });
}
