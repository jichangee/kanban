"use client";

import React from 'react';
import { Task } from '@/types/kanban';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TaskCardProps {
  task: Task;
  columnId: string;
  onDelete: (columnId: string, taskId: string) => void;
  onEdit: (columnId: string, task: Task) => void;
  onRestore?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  columnId,
  onDelete,
  onEdit,
  onRestore
}: TaskCardProps) {
  // 根据优先级获取样式类
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  // 检查任务是否过期
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

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
    <Card className={`task-card cursor-move group ${getPriorityClass(task.priority)} mb-2`}>
      {/* 任务内容 */}
      <CardContent className="pb-3 pt-4">
        <p className="text-gray-900 text-sm font-medium leading-relaxed">
          {task.content}
        </p>
        
        {/* 链接区域 */}
        {task.links && task.links.length > 0 && (
          <div className="mt-3 space-y-2">
            {task.links.map((link, index) => {
              // 提取域名作为显示名称
              let displayName = `链接 ${index + 1}`;
              try {
                const url = new URL(link);
                displayName = url.hostname;
              } catch (e) {
                displayName = link.length > 20 ? link.substring(0, 20) + '...' : link;
              }
              
              return (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-all duration-200 border border-blue-200"
                  onClick={(e) => e.stopPropagation()}
                  title={link}
                >
                  <span className="mr-1 text-blue-500">🔗</span>
                  {displayName}
                </a>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* 任务描述 */}
      {task.description && (
        <CardContent className="text-xs text-gray-600 -mt-2 mb-2 line-clamp-2 leading-relaxed px-4">
          {task.description}
        </CardContent>
      )}
      
      {/* 标签区域 */}
      {task.tags && task.tags.length > 0 && (
        <CardContent className="flex flex-wrap gap-2 -mt-2 mb-3 px-4">
          {task.tags.map((tag, index) => (
            <span key={index} className="modern-badge">
              {tag}
            </span>
          ))}
        </CardContent>
      )}
      
      {/* 底部信息栏 */}
      <CardFooter className="flex items-center justify-between pt-0 px-4 pb-3">
        <div className="flex items-center space-x-3">
          {/* 优先级标签 */}
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            task.priority === 'high' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : task.priority === 'medium' 
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
          </div>
          
          {/* 到期时间 */}
          {task.dueDate && (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isOverdue 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}>
              <span className="mr-1">📅</span>
              {formatDateTime(task.dueDate)}
              {isOverdue && <span className="ml-1">⚠️</span>}
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {onRestore ? (
            <>
              <button
                onClick={() => onRestore(task.id)}
                className="text-green-600 hover:text-green-700 text-sm p-1 rounded hover:bg-green-50 transition-all duration-200"
                aria-label="恢复任务"
              >
                🔄
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-600 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50 transition-all duration-200"
                aria-label="永久删除"
              >
                🗑️
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(columnId, task)}
                className="text-blue-600 hover:text-blue-700 text-sm p-1 rounded hover:bg-blue-50 transition-all duration-200"
                aria-label="编辑任务"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(columnId, task.id)}
                className="text-red-600 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50 transition-all duration-200"
                aria-label="删除任务"
              >
                ❌
              </button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}