"use client";

import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column, Task } from '@/types/kanban';
import TaskCard from './TaskCard';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ColumnProps {
  column: Column;
  onDeleteTask: (columnId: number, taskId: number) => void;
  onEditTask: (columnId: number, task: Task) => void;
  onRestoreTask?: (taskId: number) => void;
}

export default function ColumnComponent({
  column,
  onDeleteTask,
  onEditTask,
  onRestoreTask
}: ColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="bg-[#ebecf0] border-none p-3 h-fit max-h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#172b4d] text-sm uppercase tracking-wide">
            {column.title}
          </h3>
          <span className="bg-[#dfe1e6] text-[#5e6c84] text-xs font-medium px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <Droppable droppableId={String(column.id)}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <ScrollArea className={`task-list space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}>
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskCard
                          task={task}
                          columnId={column.id}
                          onDelete={onDeleteTask}
                          onEdit={onEditTask}
                          onRestore={onRestoreTask}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {column.tasks.length === 0 && (
                  <div className="text-center text-[#5e6c84] py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">拖放任务到这里</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </Droppable>
      </Card>
    </div>
  );
}