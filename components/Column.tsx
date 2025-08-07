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
    const taskContainer = e.currentTarget.querySelector('.task-list');
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
    <div className="flex-shrink-0 w-80">
      <div 
        className="bg-[#ebecf0] rounded-lg p-3 h-fit max-h-[calc(100vh-120px)] overflow-hidden"
        onDragOver={onDragOver}
        onDrop={handleDrop}
      >
        {/* 列标题 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#172b4d] text-sm uppercase tracking-wide">
            {column.title}
          </h3>
          <span className="bg-[#dfe1e6] text-[#5e6c84] text-xs font-medium px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        
        {/* 任务列表 */}
        <div className="task-list space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
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
            <div className="text-center text-[#5e6c84] py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm">拖放任务到这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}