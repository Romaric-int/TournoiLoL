import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json();
  const { teamId, userId, role } = body;

  const res = await fetch(`${process.env.NEST_API_URL}/team/assign-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ teamId, requesterId: session.user.id, userId, role }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
