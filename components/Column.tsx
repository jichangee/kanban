"use client";

import React, { useState } from 'react';
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
  onEditColumnTitle?: (columnId: number, title: string) => void;
}

export default function ColumnComponent({
  column,
  onDeleteTask,
  onEditTask,
  onRestoreTask,
  onEditColumnTitle
}: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);

  const startEdit = () => {
    if (column.hide) return; // 隐藏列不允许编辑
    setTitleInput(column.title);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    const next = titleInput.trim();
    if (!next) {
      setIsEditingTitle(false);
      setTitleInput(column.title);
      return;
    }
    if (next !== column.title && onEditColumnTitle) {
      onEditColumnTitle(column.id, next);
    }
    setIsEditingTitle(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleInput(column.title);
    }
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="bg-[#ebecf0] border-none p-3 h-fit max-h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          {isEditingTitle ? (
            <input
              autoFocus
              className="font-semibold text-[#172b4d] text-sm uppercase tracking-wide bg-white rounded px-2 py-1 w-48"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={onKeyDown}
            />
          ) : (
            <h3 className="font-semibold text-[#172b4d] text-sm uppercase tracking-wide">
              {column.title}
            </h3>
          )}
          <div className="flex items-center gap-2">
            <span className="bg-[#dfe1e6] text-[#5e6c84] text-xs font-medium px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
            {!column.hide && (
              <button
                className="text-[#5e6c84] hover:text-[#172b4d] text-sm px-2 py-1 rounded hover:bg-gray-100"
                onClick={startEdit}
                aria-label="编辑列标题"
              >
                编辑
              </button>
            )}
          </div>
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