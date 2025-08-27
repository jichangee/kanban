import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: Request,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { columnId } = context.params as { columnId: string };
    const body = await req.json();
    const { title } = body as { title?: string };

    if (!title || typeof title !== 'string') {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    // Disallow renaming the Trash column for safety
    const existing = await db.query(
      'SELECT * FROM "columns" WHERE "id" = $1 AND "userId" = $2',
      [columnId, userId]
    );
    if (existing.rowCount === 0) {
      return new NextResponse('Not found', { status: 404 });
    }
    if (existing.rows[0].title === '回收站') {
      return new NextResponse('Trash column cannot be renamed', { status: 400 });
    }

    await db.query(
      'UPDATE "columns" SET "title" = $1 WHERE "id" = $2 AND "userId" = $3',
      [title, columnId, userId]
    );

    return NextResponse.json({ id: columnId, title });
  } catch (error) {
    console.error('[UPDATE_COLUMN_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: any
) {
  const client = await db.connect();
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { columnId } = (context.params as { columnId: string });

    await client.query('BEGIN');

    const colRes = await client.query(
      'SELECT * FROM "columns" WHERE "id" = $1 AND "userId" = $2',
      [columnId, userId]
    );
    if (colRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return new NextResponse('Not found', { status: 404 });
    }
    if (colRes.rows[0].title === '回收站') {
      await client.query('ROLLBACK');
      return new NextResponse('Trash column cannot be deleted', { status: 400 });
    }

    // Ensure trash column exists
    let trashRes = await client.query(
      'SELECT * FROM "columns" WHERE "userId" = $1 AND "title" = $2',
      [userId, '回收站']
    );
    if (trashRes.rowCount === 0) {
      // Create trash column at the end
      const { createId } = await import('@paralleldrive/cuid2');
      const trashId = createId();
      // determine new order
      const ordRes = await client.query('SELECT COALESCE(MAX("order"), -1) as max FROM "columns" WHERE "userId" = $1', [userId]);
      const nextOrder = (ordRes.rows[0].max as number) + 1;
      await client.query(
        'INSERT INTO "columns" (id, title, "order", "userId") VALUES ($1, $2, $3, $4)',
        [trashId, '回收站', nextOrder, userId]
      );
      trashRes = await client.query(
        'SELECT * FROM "columns" WHERE "userId" = $1 AND "title" = $2',
        [userId, '回收站']
      );
    }
    const trashId: string = trashRes.rows[0].id;

    // Move tasks to trash with appended order
    const tasksRes = await client.query(
      'SELECT * FROM "tasks" WHERE "userId" = $1 AND "columnId" = $2 ORDER BY "order" ASC',
      [userId, columnId]
    );
    const trashTasksRes = await client.query(
      'SELECT COUNT(1)::int as cnt FROM "tasks" WHERE "userId" = $1 AND "columnId" = $2',
      [userId, trashId]
    );
    let baseOrder: number = trashTasksRes.rows[0].cnt as number;
    for (const task of tasksRes.rows) {
      await client.query(
        'UPDATE "tasks" SET "columnId" = $1, "order" = $2 WHERE "id" = $3 AND "userId" = $4',
        [trashId, baseOrder++, task.id, userId]
      );
    }

    // Delete the column
    await client.query(
      'DELETE FROM "columns" WHERE "id" = $1 AND "userId" = $2',
      [columnId, userId]
    );

    await client.query('COMMIT');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DELETE_COLUMN_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    client.release();
  }
}


