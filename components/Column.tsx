"use client";

import React, { DragEvent } from 'react';
import { Column, Task } from '@/types/kanban';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: Column;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (columnId: number, targetIndex: number) => void;
  onDragStart: (columnId: number, taskId: number, taskContent: string, sourceIndex: number) => void;
  onDeleteTask: (columnId: number, taskId: number) => void;
  onEditTask: (columnId: number, task: Task) => void;
  onRestoreTask?: (taskId: number) => void;
}

export default function ColumnComponent({
  column,
  onDragOver,
  onDrop,
  onDragStart,
  onDeleteTask,
  onEditTask,
  onRestoreTask
}: ColumnProps) {
  // 根据 order 字段排序任务
  const sortedTasks = [...column.tasks].sort((a, b) => a.order - b.order);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskContainer = e.currentTarget.querySelector('.space-y-2');
    if (!taskContainer) return;
    
    const taskElements = Array.from(taskContainer.children);
    const dropTarget = e.target as HTMLElement;
    
    // 找到最近的 TaskCard 元素
    const taskElement = dropTarget.closest('.task-card');
    if (!taskElement) {
      // 如果没有找到任务卡片，说明拖到了空白处，将任务放到末尾
      onDrop(column.id, taskElements.length);
      return;
    }
    
    const targetIndex = taskElements.indexOf(taskElement);
    onDrop(column.id, targetIndex);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-4"
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <h2 className="text-xl font-semibold mb-4 text-center pb-2 border-b">
        {column.title} ({column.tasks.length})
      </h2>
      
      <div className="space-y-2">
        {sortedTasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            columnId={column.id}
            onDragStart={() => onDragStart(column.id, task.id, task.content, index)}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onRestore={onRestoreTask}
          />
        ))}
        
        {column.tasks.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            拖放任务到这里
          </div>
        )}
      </div>
    </div>
  );
}