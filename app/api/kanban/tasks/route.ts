import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2';
import { Task } from '@/types/kanban';
import { executeAutomationRules, mergeAndDeduplicateLinks } from '@/lib/automation';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { columnId, ...taskData }: { columnId: string, [key: string]: any } = body;

    if (!taskData.content || !columnId) {
      return new NextResponse('Missing content or columnId', { status: 400 });
    }

    // --- Apply Automation Rules ---
    const userSubmittedLinks: string[] = Array.isArray(taskData.links) ? taskData.links : [];
    const generatedLinks = await executeAutomationRules(taskData.content, userId, userSubmittedLinks);
    
    // 合并并去重链接
    const mergedLinks = mergeAndDeduplicateLinks([], userSubmittedLinks, generatedLinks);
    // --- End Automation Rules ---

    const orderResult = await db.query(
      'SELECT COUNT(*) FROM "tasks" WHERE "columnId" = $1 AND "userId" = $2',
      [columnId, userId]
    );
    const order = parseInt(orderResult.rows[0].count, 10);

    const newId = createId();
    
    const newTask: Omit<Task, 'columnId'> & { userId: string, columnId: string } = {
      id: newId,
      content: taskData.content,
      description: taskData.description || null,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      links: mergedLinks,
      order,
      userId,
      columnId,
    };

    await db.query(
      'INSERT INTO "tasks" (id, content, description, priority, "dueDate", "order", "columnId", "userId", tags, links) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        newTask.id,
        newTask.content,
        newTask.description,
        newTask.priority,
        newTask.dueDate,
        newTask.order,
        newTask.columnId,
        newTask.userId,
        newTask.tags,
        newTask.links,
      ]
    );

    const { userId: _, ...taskToReturn } = newTask;

    return NextResponse.json(taskToReturn, { status: 201 });
  } catch (error) {
    console.error('[CREATE_TASK_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}