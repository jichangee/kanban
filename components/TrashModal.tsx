"use client";

import React, { useEffect } from 'react';
import { Task } from '@/types/kanban';
import TaskCard from './TaskCard';

interface TrashModalProps {
  tasks: Task[];
  onRestore: (taskId: number) => void;
  onDelete: (columnId: number, taskId: number) => void;
  onClose: () => void;
}

export default function TrashModal({
  tasks,
  onRestore,
  onDelete,
  onClose
}: TrashModalProps) {

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
      <div className="modal-content w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">🗑️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#172b4d]">回收站</h2>
              <p className="text-sm text-[#5e6c84]">
                {tasks.length} 个已删除的任务
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* 回收站内容 */}
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗑️</div>
              <h3 className="text-lg font-medium text-[#172b4d] mb-2">回收站是空的</h3>
              <p className="text-[#5e6c84]">删除的任务会出现在这里</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columnId={4}
                  onDragStart={() => {}}
                  onDelete={onDelete}
                  onEdit={() => {}}
                  onRestore={onRestore}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end p-6 border-t border-[#dfe1e6]">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
} 