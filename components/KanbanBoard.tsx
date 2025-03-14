"use client";

import React, { useState, useEffect, DragEvent } from 'react';
import { Column, Task, DraggedTask, Priority } from '@/types/kanban';
import ColumnComponent from '@/components/Column';
import TaskModal from '@/components/TaskModal';
import TrashModal from '@/components/TrashModal';

export default function KanbanBoard() {
  // 看板数据状态
  const [columns, setColumns] = useState<Column[]>([
    { id: 1, title: '待办', tasks: [] },
    { id: 2, title: '进行中', tasks: [] },
    { id: 3, title: '已完成', tasks: [] },
    { id: 4, title: '回收站', tasks: [], hide: true }
  ]);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<{task: Task, columnId: number} | null>(null);
  
  // 拖拽状态
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  
  // 从本地存储加载数据
  useEffect(() => {
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      setColumns(JSON.parse(savedColumns));
    }
  }, []);
  
  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem('kanbanColumns', JSON.stringify(columns));
  }, [columns]);
  
  // 添加新任务
  const handleAddTask = (task: Task) => {
    const updatedColumns = [...columns];
    const column = updatedColumns[0];
    // 设置新任务的顺序为当前列最后一个
    const newTask = {
      ...task,
      order: column.tasks.length
    };
    column.tasks.push(newTask);
    setColumns(updatedColumns);
    setIsModalOpen(false);
  };
  
  // 删除任务（移动到回收站）
  const deleteTask = (columnId: number, taskId: number) => {
    const updatedColumns = columns.map(column => {
      if (column.id === columnId) {
        // 找到要删除的任务
        const taskToDelete = column.tasks.find(task => task.id === taskId);
        if (!taskToDelete) return column;
        
        // 从当前列移除任务
        const updatedTasks = column.tasks.filter(task => task.id !== taskId);
        
        // 将任务移动到回收站
        const trashColumn = columns.find(col => col.id === 4);
        if (trashColumn) {
          trashColumn.tasks.push({
            ...taskToDelete,
            order: trashColumn.tasks.length
          });
        }
        
        return {
          ...column,
          tasks: updatedTasks
        };
      }
      return column;
    });
    
    setColumns(updatedColumns);
  };

  // 恢复任务
  const restoreTask = (taskId: number) => {
    const updatedColumns = columns.map(column => {
      if (column.id === 4) { // 回收站列
        const taskToRestore = column.tasks.find(task => task.id === taskId);
        if (!taskToRestore) return column;
        
        // 从回收站移除任务
        const updatedTasks = column.tasks.filter(task => task.id !== taskId);
        
        // 将任务恢复到待办列
        const todoColumn = columns.find(col => col.id === 1);
        if (todoColumn) {
          todoColumn.tasks.push({
            ...taskToRestore,
            order: todoColumn.tasks.length
          });
        }
        
        return {
          ...column,
          tasks: updatedTasks
        };
      }
      return column;
    });
    
    setColumns(updatedColumns);
  };
  
  // 编辑任务
  const openEditModal = (columnId: number, task: Task) => {
    setEditingTask({ task, columnId });
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  const handleEditTask = (editedTask: Task) => {
    if (!editingTask) return;
    
    const updatedColumns = columns.map(column => {
      if (column.id === editingTask.columnId) {
        return {
          ...column,
          tasks: column.tasks.map(task => 
            task.id === editedTask.id ? { ...editedTask, order: task.order } : task
          )
        };
      }
      return column;
    });
    
    setColumns(updatedColumns);
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  // 打开添加任务模态框
  const openAddModal = () => {
    setModalMode('add');
    setEditingTask(null);
    setIsModalOpen(true);
  };
  
  // 拖拽相关函数
  const onDragStart = (columnId: number, taskId: number, taskContent: string, sourceIndex: number) => {
    setDraggedTask({ columnId, taskId, taskContent, sourceIndex });
  };
  
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const onDrop = (columnId: number, targetIndex: number) => {
    if (!draggedTask) return;
    
    const updatedColumns = [...columns];
    const sourceColumn = updatedColumns.find(col => col.id === draggedTask.columnId);
    if (!sourceColumn) return;
    
    const taskToMove = sourceColumn.tasks.find(task => task.id === draggedTask.taskId);
    if (!taskToMove) return;
    
    // 从源列删除任务
    sourceColumn.tasks = sourceColumn.tasks.filter(task => task.id !== draggedTask.taskId);
    
    // 如果是同一列，重新排序
    if (columnId === draggedTask.columnId) {
      const targetColumn = updatedColumns.find(col => col.id === columnId);
      if (!targetColumn) return;
      
      // 重新计算所有任务的顺序
      targetColumn.tasks = targetColumn.tasks.map((task, index) => ({
        ...task,
        order: index
      }));
      
      // 在目标位置插入任务
      targetColumn.tasks.splice(targetIndex, 0, {
        ...taskToMove,
        order: targetIndex
      });
    } else {
      // 如果是不同列，添加到目标列
      const targetColumn = updatedColumns.find(col => col.id === columnId);
      if (!targetColumn) return;
      
      // 在目标位置插入任务
      targetColumn.tasks.splice(targetIndex, 0, {
        ...taskToMove,
        order: targetIndex
      });
    }
    
    setColumns(updatedColumns);
    setDraggedTask(null);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">看板应用</h1>
        {/* 添加任务按钮 */}
        <div className="">
          <button
            onClick={openAddModal}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            添加新任务
          </button>
        </div>
      </div>
      {/* 看板列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.filter(item => !item.hide).map(column => (
          <ColumnComponent
            key={column.id}
            column={column}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onDeleteTask={deleteTask}
            onEditTask={openEditModal}
          />
        ))}
      </div>
      
      {/* 任务模态框 */}
      {isModalOpen && (
        <TaskModal
          task={editingTask?.task}
          onSave={modalMode === 'add' ? handleAddTask : handleEditTask}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          mode={modalMode}
        />
      )}

      {/* 回收站按钮 */}
      <button
        onClick={() => setIsTrashModalOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="打开回收站"
      >
        🗑️
      </button>

      {/* 回收站模态框 */}
      {isTrashModalOpen && (
        <TrashModal
          tasks={columns.find(col => col.id === 4)?.tasks || []}
          onRestore={restoreTask}
          onDelete={deleteTask}
          onClose={() => setIsTrashModalOpen(false)}
        />
      )}
    </>
  );
}