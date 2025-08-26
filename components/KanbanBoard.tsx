"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Column, Task, Priority } from '@/types/kanban';
import ColumnComponent from '@/components/Column';
import TaskModal from '@/components/TaskModal';
import TrashModal from '@/components/TrashModal';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { createId } from '@paralleldrive/cuid2';
import useSWR from 'swr';
import { BoardData } from '@/app/api/kanban/board/route';

// 自动化规则类型
type AutomationRule = {
  id: string;
  name: string;
  regex: string;
  linkTemplate: string;
};

export default function KanbanBoard() {
  // --- Data Fetching ---
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: boardData, error: boardError, isLoading: boardIsLoading, mutate: mutateBoard } = useSWR<BoardData>('/api/kanban/board', fetcher);
  const { data: automationRules, error: rulesError, isLoading: rulesIsLoading, mutate: mutateRules } = useSWR<AutomationRule[]>('/api/automations', fetcher);

  // The original `columns` state is now replaced by `boardData` from SWR.
  // The `setColumns` function is replaced by `mutate` from SWR.
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<{task: Task, columnId: number} | null>(null);
  
  // 自动化规则状态
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // 背景设置相关状态
  const presetColors = [
    '#0079bf', '#61bd4f', '#f2d600', '#ff5a5f', '#c377e0', '#344563', '#00c2e0', '#ffab4a', '#ebecf0'
  ];
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundColor, setBackgroundColor] = useState<string>(presetColors[0]);
  const [backgroundImage, setBackgroundImage] = useState<string>(''); // 网络图片或 base64
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  // useEffect for saving to localStorage has been removed as we now fetch from the database.

  // useEffects for loading and saving automation rules from localStorage have been removed.

  // 加载背景设置
  useEffect(() => {
    const bgType = localStorage.getItem('kanbanBgType');
    const bgColor = localStorage.getItem('kanbanBgColor');
    const bgImg = localStorage.getItem('kanbanBgImg');
    if (bgType === 'image' && bgImg) {
      setBackgroundType('image');
      setBackgroundImage(bgImg);
    } else if (bgColor) {
      setBackgroundType('color');
      setBackgroundColor(bgColor);
    }
  }, []);
  // 持久化背景设置
  useEffect(() => {
    localStorage.setItem('kanbanBgType', backgroundType);
    if (backgroundType === 'color') {
      localStorage.setItem('kanbanBgColor', backgroundColor);
    } else if (backgroundType === 'image') {
      localStorage.setItem('kanbanBgImg', backgroundImage);
    }
  }, [backgroundType, backgroundColor, backgroundImage]);

  // 处理本地图片上传
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBackgroundImage(ev.target?.result as string);
        setBackgroundType('image');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddTask = async (task: Task) => {
    if (!boardData || boardData.length === 0) {
      console.error("Cannot add task: No columns available.");
      return;
    }

    const firstColumn = boardData[0];

    // Data to be sent to the API (omitting temporary client-side ID)
    const dataToSend = {
      ...task,
      columnId: firstColumn.id,
    };

    // --- Optimistic UI Update ---
    const tempTask: Task = {
      ...dataToSend,
      id: createId(), // Create a temporary, unique ID for the React key
      order: firstColumn.tasks.length, // Assume it will be added at the end
    };

    const newBoardData = boardData.map(col => {
      if (col.id === firstColumn.id) {
        return { ...col, tasks: [...col.tasks, tempTask] };
      }
      return col;
    });
    mutateBoard(newBoardData, false); // Update local data, but don't revalidate from server yet

    setIsModalOpen(false);

    // --- API Call ---
    try {
      const response = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to create task on the server');
      }

      // Trigger a revalidation to get the final state from the server
      mutateBoard(); 
    } catch (error) {
      console.error("Failed to save task:", error);
      // If the API call fails, revert the optimistic update
      mutateBoard(boardData, false); 
      // TODO: Show an error message to the user
    }
  };
  
  const deleteTask = async (columnId: string, taskId: string) => {
    if (!boardData) return;

    const trashColumn = boardData.find(col => col.title === '回收站');
    const sourceColumn = boardData.find(col => col.id === columnId);

    if (!trashColumn || !sourceColumn) {
      console.error("Source or Trash column not found!");
      // TODO: Add user-facing error
      return;
    }

    const taskToMove = sourceColumn.tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // --- 1. Optimistic Update ---
    const newBoardData = JSON.parse(JSON.stringify(boardData));
    const sourceColFromNew = newBoardData.find((c: Column) => c.id === columnId);
    const trashColFromNew = newBoardData.find((c: Column) => c.id === trashColumn.id);
    
    const taskIndex = sourceColFromNew.tasks.findIndex((t: Task) => t.id === taskId);
    const [movedTask] = sourceColFromNew.tasks.splice(taskIndex, 1);
    trashColFromNew.tasks.push(movedTask);

    mutateBoard(newBoardData, false);

    // --- 2. Prepare API Payload ---
    const tasksToUpdate: { id: string; order: number; columnId: string }[] = [];
    
    // Add the moved task with its new column and order
    tasksToUpdate.push({ id: taskId, order: trashColFromNew.tasks.length - 1, columnId: trashColFromNew.id });

    // Add all tasks in the source column to update their order
    sourceColFromNew.tasks.forEach((task: Task, index: number) => {
      tasksToUpdate.push({ id: task.id, order: index, columnId: sourceColFromNew.id });
    });

    // --- 3. API Call ---
    try {
      const response = await fetch('/api/kanban/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasksToUpdate),
      });

      if (!response.ok) {
        throw new Error('Server failed to move task to trash');
      }

      mutateBoard(); // Revalidate
    } catch (error) {
      console.error("Failed to move task to trash:", error);
      mutateBoard(boardData, false); // Revert on failure
    }
  };

  const restoreTask = async (taskId: string) => {
    if (!boardData) return;

    const trashColumn = boardData.find(col => col.title === '回收站');
    const destColumn = boardData[0]; // Assume the first column is the destination, e.g., 'To Do'
    
    if (!trashColumn || !destColumn) {
        console.error("Trash or destination column not found!");
        return;
    }

    const taskToMove = trashColumn.tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // --- 1. Optimistic Update ---
    const newBoardData = JSON.parse(JSON.stringify(boardData));
    const trashColFromNew = newBoardData.find((c: Column) => c.id === trashColumn.id);
    const destColFromNew = newBoardData.find((c: Column) => c.id === destColumn.id);

    const taskIndex = trashColFromNew.tasks.findIndex((t: Task) => t.id === taskId);
    const [movedTask] = trashColFromNew.tasks.splice(taskIndex, 1);
    destColFromNew.tasks.push(movedTask);

    mutateBoard(newBoardData, false);
    setIsTrashModalOpen(false); // Close the modal after restoring

    // --- 2. Prepare API Payload ---
    const tasksToUpdate: { id: string; order: number; columnId: string }[] = [];

    // The restored task with its new column and order
    tasksToUpdate.push({ id: taskId, order: destColFromNew.tasks.length - 1, columnId: destColFromNew.id });

    // All remaining tasks in the trash column need their order updated
    trashColFromNew.tasks.forEach((task: Task, index: number) => {
        tasksToUpdate.push({ id: task.id, order: index, columnId: trashColFromNew.id });
    });

    // --- 3. API Call ---
    try {
        await fetch('/api/kanban/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasksToUpdate),
        });
        mutateBoard(); // Revalidate
    } catch (error) {
        console.error("Failed to restore task:", error);
        mutateBoard(boardData, false); // Revert on failure
    }
  };
  
  // 编辑任务
  const openEditModal = (columnId: string, task: Task) => {
    setEditingTask({ task, columnId });
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  const handleEditTask = async (editedTask: Task) => {
    if (!editingTask || !boardData) return;

    // --- Optimistic UI Update ---
    const newBoardData = boardData.map(column => {
      if (column.id === editingTask.columnId) {
        return {
          ...column,
          tasks: column.tasks.map(task => 
            task.id === editedTask.id ? editedTask : task
          )
        };
      }
      return column;
    });
    mutateBoard(newBoardData, false); // Update local data, don't revalidate yet

    setIsModalOpen(false);
    setEditingTask(null);

    // --- API Call ---
    try {
      const { id, ...taskData } = editedTask; // Don't send the ID in the body
      const response = await fetch(`/api/kanban/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to update task on the server');
      }

      mutateBoard(); // Revalidate to get final state from server
    } catch (error) {
      console.error("Failed to save edited task:", error);
      // Revert the optimistic update on failure
      mutateBoard(boardData, false); 
      // TODO: Show an error message to the user
    }
  };
  
  // 打开添加任务模态框
  const openAddModal = () => {
    setModalMode('add');
    setEditingTask(null);
    setIsModalOpen(true);
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !boardData) return;

    // Create a deep copy for mutation to prevent issues with SWR's cache
    const newBoardData = JSON.parse(JSON.stringify(boardData));

    const sourceCol = newBoardData.find((c: Column) => c.id === source.droppableId);
    const destCol = newBoardData.find((c: Column) => c.id === destination.droppableId);

    if (!sourceCol || !destCol) return;

    // --- 1. Optimistic Update ---
    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    destCol.tasks.splice(destination.index, 0, movedTask);
    
    mutateBoard(newBoardData, false); // Optimistically update the UI

    // --- 2. Prepare API Payload ---
    const tasksToUpdate: { id: string; order: number; columnId: string }[] = [];

    // Re-calculate order for all tasks in the destination column
    destCol.tasks.forEach((task: Task, index: number) => {
      tasksToUpdate.push({ id: task.id, order: index, columnId: destCol.id });
    });

    // If moved between columns, also re-calculate order for the source column
    if (source.droppableId !== destination.droppableId) {
      sourceCol.tasks.forEach((task: Task, index: number) => {
        tasksToUpdate.push({ id: task.id, order: index, columnId: sourceCol.id });
      });
    }

    // --- 3. API Call ---
    try {
      const response = await fetch('/api/kanban/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasksToUpdate),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder tasks on the server');
      }
      
      // Revalidate to ensure data is consistent with the server
      mutateBoard();

    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      // Revert on failure by re-fetching original data from cache
      mutateBoard(boardData, false);
    }
  };

  // 自动化规则表单相关
  const [ruleForm, setRuleForm] = useState({ name: '', regex: '', linkTemplate: '' });
  const handleRuleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRuleForm({ ...ruleForm, [e.target.name]: e.target.value });
  };
  const handleAddRule = async () => {
    if (!ruleForm.name || !ruleForm.regex || !ruleForm.linkTemplate) return;
    
    const tempId = createId();
    const newRule = { ...ruleForm, id: tempId };

    // Optimistic update
    mutateRules([...(automationRules || []), newRule], false);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });

    try {
      // API Call
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm), // Send the form data, backend will create ID
      });
      // Revalidate to get the final rule from the server (with the real ID)
      mutateRules();
    } catch (error) {
      console.error("Failed to add rule:", error);
      // Revert on failure
      mutateRules(automationRules, false);
    }
  };
  const handleDeleteRule = async (id: string) => {
    const originalRules = automationRules;
    
    // Optimistic update
    mutateRules(automationRules?.filter(r => r.id !== id), false);

    try {
      // API Call
      await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      // Revalidate to ensure consistency, though optimistic update is often sufficient
      mutateRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      // Revert on failure
      mutateRules(originalRules, false);
    }
  };
  // 开始编辑规则
  const handleStartEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setRuleForm({ name: rule.name, regex: rule.regex, linkTemplate: rule.linkTemplate });
  };
  const handleUpdateRule = async () => {
    if (!editingRule) return;
    if (!ruleForm.name || !ruleForm.regex || !ruleForm.linkTemplate) return;

    const originalRules = automationRules;
    const updatedRule = { ...editingRule, ...ruleForm };

    // Optimistic update
    mutateRules(automationRules?.map(r => r.id === editingRule.id ? updatedRule : r), false);
    setEditingRule(null);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });

    try {
      // API Call
      await fetch(`/api/automations/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm),
      });
      mutateRules(); // Revalidate
    } catch (error) {
      console.error("Failed to update rule:", error);
      // Revert on failure
      mutateRules(originalRules, false);
    }
  };
  // 取消编辑
  const handleCancelEditRule = () => {
    setEditingRule(null);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });
  };

  if (boardIsLoading) {
    return <div className="text-white text-center p-10">看板加载中...</div>;
  }

  if (boardError) {
    return <div className="text-red-500 bg-white p-10 rounded-md">错误：看板数据加载失败，请重试。</div>;
  }

  if (!boardData) {
    return <div className="text-white text-center p-10">未找到看板数据。</div>;
  }
  
  return (
    <div
      className="min-h-screen"
      style={
        backgroundType === 'image' && backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: backgroundColor }
      }
    >
      {/* 顶部导航栏 */}
      <div className="nav-glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image src="/logo.svg" alt="标识" width={40} height={40} />
                <h1 className="text-white font-semibold text-xl">看板</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="sm" onClick={() => setIsBgModalOpen(true)}>🎨 更换背景</Button>
              <Button variant="secondary" size="sm" onClick={() => setIsAutomationModalOpen(true)}>⚙️ 自动化规则</Button>
              <Button size="sm" onClick={openAddModal}>+ 添加任务</Button>
              <Button variant="secondary" size="sm" onClick={() => setIsTrashModalOpen(true)} aria-label="回收站">🗑️</Button>
            </div>
          </div>
        </div>
      </div>
      {/* 自动化规则模态框 */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
              <h2 className="text-xl font-semibold text-[#172b4d]">自动化规则</h2>
              <button onClick={() => setIsAutomationModalOpen(false)} className="text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#172b4d] mb-2">规则名称</label>
                <input name="name" value={ruleForm.name} onChange={handleRuleFormChange} className="input-field w-full mb-2" placeholder="如：数字转链接" />
                <label className="block text-sm font-medium text-[#172b4d] mb-2">正则表达式</label>
                <input name="regex" value={ruleForm.regex} onChange={handleRuleFormChange} className="input-field w-full mb-2" placeholder="如：(\d+)" />
                <label className="block text-sm font-medium text-[#172b4d] mb-2">链接模板（用$1、$2等占位）</label>
                <input name="linkTemplate" value={ruleForm.linkTemplate} onChange={handleRuleFormChange} className="input-field w-full mb-2" placeholder="如：https://example.com/item/$1" />
                {editingRule ? (
                  <div className="flex items-center gap-2 mt-2">
                    <button type="button" className="btn-primary" onClick={handleUpdateRule}>保存修改</button>
                    <button type="button" className="btn-secondary" onClick={handleCancelEditRule}>取消</button>
                  </div>
                ) : (
                  <button type="button" className="btn-primary mt-2" onClick={handleAddRule}>添加规则</button>
                )}
              </div>
              <div>
                <h3 className="font-medium text-[#172b4d] mb-2">已添加规则</h3>
                <ul className="space-y-2">
                  {(automationRules || []).map(rule => (
                    <li key={rule.id} className="flex items-center justify-between bg-white border border-[#dfe1e6] rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#172b4d] mb-1">{rule.name}</div>
                        <div className="text-xs text-[#5e6c84] mb-1">正则: <code className="bg-[#f4f5f7] px-1 py-0.5 rounded">{rule.regex}</code></div>
                        <div className="text-xs text-[#5e6c84]">模板: <code className="bg-[#f4f5f7] px-1 py-0.5 rounded">{rule.linkTemplate}</code></div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50" onClick={() => handleStartEditRule(rule)}>编辑</button>
                        <button className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDeleteRule(rule.id)}>删除</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 更换背景模态框 */}
      {isBgModalOpen && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
          <div className="modal-content w-full max-w-md max-h-[90vh] overflow-y-auto text-[#172b4d]">
            <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
              <h2 className="text-xl font-semibold">更换背景</h2>
              <button onClick={() => setIsBgModalOpen(false)} className="text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="mb-4">
                <label className="mr-4 font-medium">
                  <input
                    type="radio"
                    name="bgType"
                    checked={backgroundType === 'color'}
                    onChange={() => setBackgroundType('color')}
                  />
                  <span className="ml-1">背景色</span>
                </label>
                <label className="font-medium">
                  <input
                    type="radio"
                    name="bgType"
                    checked={backgroundType === 'image'}
                    onChange={() => setBackgroundType('image')}
                  />
                  <span className="ml-1">背景图片</span>
                </label>
              </div>
              {backgroundType === 'color' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2"
                      style={{ background: color, borderColor: backgroundColor === color ? '#333' : '#fff' }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                </div>
              )}
              {backgroundType === 'image' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="输入图片链接..."
                    value={backgroundImage.startsWith('data:') ? '' : backgroundImage}
                    onChange={e => setBackgroundImage(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={handleBgFileChange} />
                    <span className="text-xs text-[#5e6c84]">或上传本地图片</span>
                  </div>
                  {backgroundImage && (
                    <img src={backgroundImage} alt="预览" className="w-full h-32 object-cover rounded mt-2" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 看板内容区域 */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 p-4">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {boardData.filter(item => !item.hide).map(column => (
              <ColumnComponent
                key={column.id}
                column={column}
                onDeleteTask={deleteTask}
                onEditTask={openEditModal}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
      
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

      {/* 回收站模态框 */}
      {isTrashModalOpen && (
        <TrashModal
          tasks={boardData.find(col => col.title === '回收站')?.tasks || []}
          onRestore={restoreTask}
          onDelete={deleteTask}
          onClose={() => setIsTrashModalOpen(false)}
        />
      )}
    </div>
  );
}
