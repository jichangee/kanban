import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Column, Task } from '@/types/kanban';
import { createId } from '@paralleldrive/cuid2';

// Define the structure of the board data
export type BoardData = (Column & { tasks: Task[] })[];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch all columns for the user, ordered by their 'order'
    const columnsResult = await db.query(
      'SELECT * FROM "columns" WHERE "userId" = $1 ORDER BY "order" ASC',
      [userId]
    );
    let columns: any[] = columnsResult.rows;

    // Seed default columns if user has none
    if (columns.length === 0) {
      const defaults = [
        { id: createId(), title: '代办', order: 0 },
        { id: createId(), title: '开发中', order: 1 },
        { id: createId(), title: '测试中', order: 2 },
        { id: createId(), title: '已完成', order: 3 },
        // Ensure a Trash column exists for deletion flow
        { id: createId(), title: '回收站', order: 4 },
      ];

      const insertValues: any[] = [];
      const placeholders = defaults
        .map((c, idx) => {
          const base = idx * 4;
          insertValues.push(c.id, c.title, c.order, userId);
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(', ');

      await db.query(
        `INSERT INTO "columns" (id, title, "order", "userId") VALUES ${placeholders}`,
        insertValues
      );

      // Re-fetch after seeding
      const seeded = await db.query(
        'SELECT * FROM "columns" WHERE "userId" = $1 ORDER BY "order" ASC',
        [userId]
      );
      columns = seeded.rows;
    }

    // Ensure Trash column exists even for existing users/boards
    if (!columns.some((c) => c.title === '回收站')) {
      const trashId = createId();
      const trashOrder = columns.length; // put it at the end
      await db.query(
        'INSERT INTO "columns" (id, title, "order", "userId") VALUES ($1, $2, $3, $4)',
        [trashId, '回收站', trashOrder, userId]
      );
      const refreshed = await db.query(
        'SELECT * FROM "columns" WHERE "userId" = $1 ORDER BY "order" ASC',
        [userId]
      );
      columns = refreshed.rows;
    }

    // Fetch all tasks for the user
    const tasksResult = await db.query(
      'SELECT * FROM "tasks" WHERE "userId" = $1',
      [userId]
    );
    const tasks: Task[] = tasksResult.rows as any;

    // Create a map of tasks by their columnId for efficient lookup
    const tasksByColumn = tasks.reduce((acc, task) => {
      if (!acc[(task as any).columnId]) {
        acc[(task as any).columnId] = [];
      }
      acc[(task as any).columnId].push(task);
      // Sort tasks within the column by their 'order'
      acc[(task as any).columnId].sort((a: any, b: any) => a.order - b.order);
      return acc;
    }, {} as Record<string, Task[]>);

    // Combine columns with their respective tasks
    const board: BoardData = columns.map((column: any) => ({
      id: column.id,
      title: column.title,
      tasks: tasksByColumn[column.id] || [],
      hide: column.title === '回收站',
    }));

    return NextResponse.json(board);
  } catch (error) {
    console.error('[GET_BOARD_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
