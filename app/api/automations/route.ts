import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2';

// GET all automation rules for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await db.query(
      'SELECT * FROM "automation_rules" WHERE "userId" = $1 ORDER BY "name" ASC',
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[GET_AUTOMATIONS_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST a new automation rule for the current user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { name, regex, linkTemplate } = body;

    if (!name || !regex || !linkTemplate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newRule = {
      id: createId(),
      name,
      regex,
      linkTemplate,
      userId,
    };

    await db.query(
      'INSERT INTO "automation_rules" (id, name, regex, "linkTemplate", "userId") VALUES ($1, $2, $3, $4, $5)',
      [newRule.id, newRule.name, newRule.regex, newRule.linkTemplate, newRule.userId]
    );

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('[CREATE_AUTOMATION_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
