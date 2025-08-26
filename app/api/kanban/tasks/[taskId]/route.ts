import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Task } from '@/types/kanban';

export async function PUT(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { taskId } = params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    const body: Partial<Task> = await req.json();

    // If content is being updated, re-run automation rules
    if (body.content) {
      const automationRulesResult = await db.query(
        'SELECT * FROM "automation_rules" WHERE "userId" = $1',
        [userId]
      );
      const automationRules = automationRulesResult.rows;
      const generatedLinks: string[] = [];

      for (const rule of automationRules) {
        try {
          const regex = new RegExp(rule.regex);
          const match = body.content.match(regex);
          if (match) {
            let link = rule.linkTemplate;
            match.forEach((m: string, idx: number) => {
              link = link.replace(new RegExp(`\\${idx}`, 'g'), m);
            });
            generatedLinks.push(link);
          }
        } catch (e) {
          console.error(`Invalid regex for rule ${rule.id}:`, e);
        }
      }

      // Merge with existing links if necessary
      if (generatedLinks.length > 0) {
        const existingTaskResult = await db.query(
          'SELECT links FROM "tasks" WHERE id = $1 AND "userId" = $2',
          [taskId, userId]
        );
        const existingLinks = existingTaskResult.rows[0]?.links || [];
        const userSubmittedLinks = body.links || [];
        const allLinks = [...new Set([...existingLinks, ...userSubmittedLinks, ...generatedLinks])];
        body.links = allLinks;
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
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const { taskId } = params;

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
