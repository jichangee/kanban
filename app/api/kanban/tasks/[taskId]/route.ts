import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Task } from '@/types/kanban';
import { executeAutomationRules, mergeAndDeduplicateLinks } from '@/lib/automation';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { taskId } = await params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    const body: Partial<Task> = await req.json();

    // If content is being updated, re-run automation rules
    if (body.content) {
      // 获取现有任务的链接，避免重复添加
      const existingTaskResult = await db.query(
        'SELECT links FROM "tasks" WHERE id = $1 AND "userId" = $2',
        [taskId, userId]
      );
      const existingLinks = existingTaskResult.rows[0]?.links || [];
      
      // 使用新的自动化规则执行函数
      const generatedLinks = await executeAutomationRules(body.content, userId, existingLinks);
      
      // 合并链接并去重
      if (generatedLinks.length > 0) {
        const userSubmittedLinks = body.links || [];
        body.links = mergeAndDeduplicateLinks(existingLinks, userSubmittedLinks, generatedLinks);
      }
    }
    
    const allowedFields: (keyof Task)[] = ['content', 'description', 'priority', 'dueDate', 'tags', 'links'];
    const fieldsToUpdate: Partial<Task> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (fieldsToUpdate as any)[field] = body[field];
      }
    }

    const fieldEntries = Object.entries(fieldsToUpdate);
    if (fieldEntries.length === 0) {
      return new NextResponse('No valid fields to update', { status: 400 });
    }

    const setClause = fieldEntries
      .map(([key], index) => `"${key}" = $${index + 1}`)
      .join(', ');

    const values = fieldEntries.map(([, value]) => value);

    const updateQuery = `
      UPDATE "tasks"
      SET ${setClause}
      WHERE "id" = $${values.length + 1} AND "userId" = $${values.length + 2}
      RETURNING *;
    `;
    
    values.push(taskId, userId);

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return new NextResponse('Task not found or user not authorized', { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('[UPDATE_TASK_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { taskId } = await params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    const deleteResult = await db.query(
      'DELETE FROM "tasks" WHERE "id" = $1 AND "userId" = $2',
      [taskId, userId]
    );

    if (deleteResult.rowCount === 0) {
      return new NextResponse('Task not found or user not authorized', { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // Success, no content

  } catch (error) {
    console.error('[DELETE_TASK_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
