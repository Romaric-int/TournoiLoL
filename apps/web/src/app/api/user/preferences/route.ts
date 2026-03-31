import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEST_API_URL}/user/preferences?userId=${session.user.id}`,
    {
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    }
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

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${process.env.NEST_API_URL}/user/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ userId: session.user.id, ...body }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
