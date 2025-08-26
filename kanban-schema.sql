-- Schema for Kanban board feature (Version 2)

-- Create the Columns table
CREATE TABLE "columns" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "columns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create the Tasks table with all necessary fields
CREATE TABLE "tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT DEFAULT 'medium',
  "dueDate" TIMESTAMPTZ,
  "order" INTEGER NOT NULL,
  "columnId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tags" TEXT[],
  "links" TEXT[],
  CONSTRAINT "tasks_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE,
  CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for better performance on queries
CREATE INDEX "columns_userId_idx" ON "columns"("userId");
CREATE INDEX "tasks_columnId_idx" ON "tasks"("columnId");
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");