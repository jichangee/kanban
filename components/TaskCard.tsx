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
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return '';
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
        task-card bg-white rounded-lg shadow-sm border border-[#dfe1e6] p-3 cursor-move group
        ${getPriorityColor(task.priority)}
        transition-all duration-200 ease-in-out card-hover
        ${isDragging ? 'dragging' : ''}
      `}
    >
      {/* 任务内容 */}
      <div className="mb-3">
        <p className="text-[#172b4d] text-sm font-medium leading-relaxed">
          {task.content}
        </p>
        {task.links && task.links.length > 0 && (
          <div className="mt-2 space-y-2">
            {task.links.map((link, index) => {
              // 提取域名作为显示名称
              let displayName = `链接 ${index + 1}`;
              try {
                const url = new URL(link);
                displayName = url.hostname;
              } catch (e) {
                // 如果URL解析失败，使用原始链接的前20个字符
                displayName = link.length > 20 ? link.substring(0, 20) + '...' : link;
              }
              
              return (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mr-2 items-center text-[#0079bf] hover:text-[#005a8b] text-xs bg-[#f4f5f7] px-2 py-1 rounded hover:bg-[#e4f0f6] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title={link}
                >
                  <span className="mr-1">🔗</span>
                  {displayName}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* 任务描述 */}
      {task.description && (
        <div className="text-xs text-[#5e6c84] mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </div>
      )}
      
      {/* 标签区域 */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-1 bg-[#e4f0f6] text-[#0079bf] text-xs rounded font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* 底部信息栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 优先级标签 */}
          <span 
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              task.priority === 'high' ? 'bg-red-100 text-red-700' : 
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}
          >
            {task.priority === 'high' ? '高' : 
             task.priority === 'medium' ? '中' : '低'}
          </span>
          
          {/* 到期时间 */}
          {task.dueDate && (
            <span className={`text-xs px-2 py-1 rounded ${
              isOverdue 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {formatDateTime(task.dueDate)}
              {isOverdue && <span className="ml-1">⚠️</span>}
            </span>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRestore ? (
            <>
              <button
                onClick={() => onRestore(task.id)}
                className="text-green-600 hover:text-green-800 text-sm p-1 rounded hover:bg-green-50"
                aria-label="恢复任务"
              >
                🔄
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50"
                aria-label="永久删除"
              >
                🗑️
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(columnId, task)}
                className="text-[#0079bf] hover:text-[#005a8b] text-sm p-1 rounded hover:bg-blue-50"
                aria-label="编辑任务"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50"
                aria-label="删除任务"
              >
                ❌
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}