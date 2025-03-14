"use client";

import React, { useState } from 'react';
import { Task } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  columnId: number;
  onDragStart: (columnId: number, taskId: number, taskContent: string) => void;
  onDelete: (columnId: number, taskId: number) => void;
  onEdit: (columnId: number, task: Task) => void;
  onRestore?: (taskId: number) => void;
}

export default function TaskCard({
  task,
  columnId,
  onDragStart,
  onDelete,
  onEdit,
  onRestore
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  // 根据优先级获取颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-300';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300';
      case 'low':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // 检查任务是否过期
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart(columnId, task.id, task.content);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        task-card p-3 rounded border flex flex-col cursor-move 
        ${getPriorityColor(task.priority)}
        transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-50 scale-105 shadow-lg rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <span className="font-medium">{task.content}</span>
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              🔗
            </a>
          )}
        </div>
        <div className="flex space-x-1">
          {onRestore ? (
            <>
              <button
                onClick={() => onRestore(task.id)}
                className="text-green-500 hover:text-green-700 text-sm p-1"
                aria-label="恢复任务"
              >
                🔄
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-500 hover:text-red-700 text-sm p-1"
                aria-label="永久删除"
              >
                🗑️
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(columnId, task)}
                className="text-blue-500 hover:text-blue-700 text-sm p-1"
                aria-label="编辑任务"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-500 hover:text-red-700 text-sm p-1"
                aria-label="删除任务"
              >
                ❌
              </button>
            </>
          )}
        </div>
      </div>

      {/* 任务描述 */}
      {task.description && (
        <div className="text-sm text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </div>
      )}
      
      {/* 到期时间 */}
      {task.dueDate && (
        <div className={`text-xs mb-2 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
          <span className="font-medium">到期时间：</span>
          {formatDateTime(task.dueDate)}
          {isOverdue && <span className="ml-1">(已过期)</span>}
        </div>
      )}
      
      {/* 优先级标签 */}
      <div className="flex items-center text-xs mb-2">
        <span 
          className={`inline-block px-2 py-1 rounded-full mr-2 ${
            task.priority === 'high' ? 'bg-red-400 text-white' : 
            task.priority === 'medium' ? 'bg-yellow-400 text-black' : 
            'bg-green-400 text-white'
          }`}
        >
          {task.priority === 'high' ? '高优' : 
           task.priority === 'medium' ? '中优' : '低优'}
        </span>
      </div>
      
      {/* 标签区域 */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {task.tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}