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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">回收站</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            回收站是空的
          </div>
        ) : (
          <div className="space-y-4">
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
    </div>
  );
} 