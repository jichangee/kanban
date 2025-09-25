import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { clearUserExecutionCache } from '@/lib/automation';

// PUT (Update) a specific automation rule
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { ruleId } = await params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { name, regex, linkTemplate } = body;

    if (!name || !regex || !linkTemplate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const result = await db.query(
      'UPDATE "automation_rules" SET name = $1, regex = $2, "linkTemplate" = $3 WHERE id = $4 AND "userId" = $5 RETURNING *',
      [name, regex, linkTemplate, ruleId, userId]
    );

    if (result.rowCount === 0) {
      return new NextResponse('Rule not found or user not authorized', { status: 404 });
    }

    // 清理用户的执行缓存，确保规则修改后能重新执行
    clearUserExecutionCache(userId);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[UPDATE_AUTOMATION_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE a specific automation rule
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { ruleId } = await params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await db.query(
      'DELETE FROM "automation_rules" WHERE id = $1 AND "userId" = $2',
      [ruleId, userId]
    );

    if (result.rowCount === 0) {
      return new NextResponse('Rule not found or user not authorized', { status: 404 });
    }

    // 清理用户的执行缓存
    clearUserExecutionCache(userId);

    return new NextResponse(null, { status: 204 }); // Success, no content
  } catch (error) {
    console.error('[DELETE_AUTOMATION_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
