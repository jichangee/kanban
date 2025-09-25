import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const client = await db.connect();
  try {
    const columns: { id: string; order: number }[] = await req.json();

    await client.query('BEGIN');
    for (const column of columns) {
      await client.query(
        'UPDATE "columns" SET "order" = $1 WHERE "id" = $2',
        [column.order, column.id]
      );
    }
    await client.query('COMMIT');

    return NextResponse.json({ message: 'Columns reordered' }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder columns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
