"use client";

import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column, Task } from '@/types/kanban';
import TaskCard from './TaskCard';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ColumnProps {
  column: Column;
  onDeleteTask: (columnId: string, taskId: string) => void;
  onEditTask: (columnId: string, task: Task) => void;
  onRestoreTask?: (taskId: string) => void;
}

export default function ColumnComponent({
  column,
  onDeleteTask,
  onEditTask,
  onRestoreTask
}: ColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className="column-container p-4 h-fit max-h-[calc(100vh-140px)]">
        {/* 列标题区域 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="font-medium text-gray-900 text-sm">
              {column.title}
            </h3>
          </div>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
            {column.tasks.length}
          </span>
        </div>

        {/* 任务列表区域 */}
        <Droppable droppableId={String(column.id)}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <ScrollArea className={`task-list space-y-3 h-[calc(100vh-220px)] ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''}`}>
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${snapshot.isDragging ? 'dragging' : ''}`}
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
                
                {/* 空状态 */}
                {column.tasks.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
                      <div className="text-xl">📋</div>
                    </div>
                    <p className="text-sm">拖放任务到这里</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}