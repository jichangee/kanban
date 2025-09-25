"use client";

import React, { useEffect } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/kanban';
import TaskCard from './TaskCard';

interface TrashModalProps {
  tasks: Task[];
  onRestore: (taskId: string) => void;
  onDelete: (columnId: string, taskId: string) => void;
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
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogHeader className="relative">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-lg">🗑️</span>
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-[#172b4d]">回收站</DialogTitle>
            <p className="text-sm text-[#5e6c84]">{tasks.length} 个已删除的任务</p>
          </div>
        </div>
        <button onClick={onClose} className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100">×</button>
      </DialogHeader>

      <DialogContent>
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
                columnId={task.columnId}
                onDelete={onDelete}
                onEdit={(columnId, task) => {}}
                onRestore={onRestore}
              />
            ))}
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button onClick={onClose}>关闭</Button>
      </DialogFooter>
    </Dialog>
  );
} 