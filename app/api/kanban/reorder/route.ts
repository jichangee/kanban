import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// The expected payload is an array of tasks with their new order and column
type ReorderPayload = {
  id: string;
  order: number;
  columnId: string;
}[];

export async function POST(req: Request) {
  const client = await db.connect();
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tasksToUpdate: ReorderPayload = await req.json();

    if (!Array.isArray(tasksToUpdate)) {
        return new NextResponse('Invalid payload: Expected an array of tasks.', { status: 400 });
    }

    // Start a database transaction
    await client.query('BEGIN');

    // Loop through each task and update its order and columnId
    for (const task of tasksToUpdate) {
      const res = await client.query(
        'UPDATE "tasks" SET "order" = $1, "columnId" = $2 WHERE "id" = $3 AND "userId" = $4',
        [task.order, task.columnId, task.id, userId]
      );
      // If a task wasn't found or updated, it might mean a permissions issue or bad ID
      if (res.rowCount === 0) {
        throw new Error(`Failed to update task ${task.id}. Task not found or permission denied.`);
      }
    }

    // If all updates were successful, commit the transaction
    await client.query('COMMIT');

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    // If any error occurs, roll back the entire transaction
    await client.query('ROLLBACK');
    console.error('[REORDER_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    // Release the client back to the pool
    client.release();
  }
}
