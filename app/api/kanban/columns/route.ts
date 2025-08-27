import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title } = (await req.json()) as { title?: string };
    if (!title || typeof title !== 'string') {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    // Determine next order (append before trash if exists)
    const columnsRes = await db.query('SELECT id, title, "order" FROM "columns" WHERE "userId" = $1 ORDER BY "order" ASC', [userId]);
    const trash = columnsRes.rows.find((c: any) => c.title === '回收站');
    let newOrder = columnsRes.rows.length;
    if (trash) {
      newOrder = (trash.order as number);
      // shift trash to end and optionally shift subsequent columns
      await db.query('UPDATE "columns" SET "order" = "order" + 1 WHERE "userId" = $1 AND "order" >= $2', [userId, newOrder]);
    }

    const id = createId();
    await db.query(
      'INSERT INTO "columns" (id, title, "order", "userId") VALUES ($1, $2, $3, $4)',
      [id, title, newOrder, userId]
    );

    return NextResponse.json({ id, title, order: newOrder });
  } catch (error) {
    console.error('[CREATE_COLUMN_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


