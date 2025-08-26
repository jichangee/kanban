"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult, Draggable, Droppable } from '@hello-pangea/dnd';
import { Column, Task, Priority } from '@/types/kanban';
import ColumnComponent from '@/components/Column';
import TaskModal from '@/components/TaskModal';
import TrashModal from '@/components/TrashModal';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// 自动化规则类型
type AutomationRule = {
  id: number;
  name: string;
  regex: string;
  linkTemplate: string;
};

export default function KanbanBoard() {
  // 看板数据状态
  const [columns, setColumns] = useState<Column[]>([
    { id: 1, title: '待办', tasks: [] },
    { id: 2, title: '进行中', tasks: [] },
    { id: 5, title: '测试中', tasks: [] },
    { id: 3, title: '已完成', tasks: [] },
    { id: 4, title: '回收站', tasks: [], hide: true }
  ]);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<{task: Task, columnId: number} | null>(null);
  
  // 自动化规则状态
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // 新增/编辑面板（列）
  const addColumn = () => {
    const title = prompt('请输入新面板名称');
    if (!title) return;
    const nextId = Math.max(...columns.map(c => c.id)) + 1;
    const newColumn: Column = { id: nextId, title, tasks: [] };
    const updated = [...columns];
    // 在回收站前插入新面板
    const trashIndex = updated.findIndex(c => c.hide);
    const insertIndex = trashIndex === -1 ? updated.length : trashIndex;
    updated.splice(insertIndex, 0, newColumn);
    setColumns(updated);
  };

  const editColumnTitle = (columnId: number, title: string) => {
    setColumns(cols => cols.map(c => (c.id === columnId ? { ...c, title } : c)));
  };

  // 背景设置相关状态
  const presetColors = [
    '#0079bf', '#61bd4f', '#f2d600', '#ff5a5f', '#c377e0', '#344563', '#00c2e0', '#ffab4a', '#ebecf0'
  ];
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundColor, setBackgroundColor] = useState<string>(presetColors[0]);
  const [backgroundImage, setBackgroundImage] = useState<string>(''); // 网络图片或 base64
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  // 从本地存储加载数据（兼容老数据，自动插入测试中列）
  useEffect(() => {
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      let loaded = JSON.parse(savedColumns);
      // 检查是否有“测试中”列
      if (!loaded.find((col: Column) => col.id === 5)) {
        // 插入“测试中”列到“进行中”与“已完成”之间
        const idx = loaded.findIndex((col: Column) => col.id === 3);
        loaded.splice(idx, 0, { id: 5, title: '测试中', tasks: [] });
      }
      setColumns(loaded);
    }
  }, []);
  
  // 保存数据到本地存储
  useEffect(() => {
    localStorage.setItem('kanbanColumns', JSON.stringify(columns));
  }, [columns]);

  // 加载自动化规则
  useEffect(() => {
    const saved = localStorage.getItem('kanbanAutomationRules');
    if (saved) {
      setAutomationRules(JSON.parse(saved));
    } else {
      setAutomationRules([]);
    }
  }, []);
  // 保存自动化规则
  useEffect(() => {
    localStorage.setItem('kanbanAutomationRules', JSON.stringify(automationRules));
  }, [automationRules]);

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
  
  // 添加新任务
  const handleAddTask = (task: Task) => {
    let newTask = { ...task };
    // 初始化links数组
    if (!newTask.links) {
      newTask.links = [];
    }
    
    // 自动化处理
    for (const rule of automationRules) {
      try {
        const reg = new RegExp(rule.regex);
        const match = newTask.content.match(reg);
        console.log('match', match);
        
        if (match) {
          // 替换模板中的$1、$2等
          let link = rule.linkTemplate;
          match.forEach((m, idx) => {
            link = link.replace(new RegExp('\\$' + idx,'g'), m);
          });
          // 添加到links数组而不是覆盖
          console.log('link', link);
          newTask.links.push(link);
        }
      } catch (e) { /* 忽略无效正则 */ }
    }
    
    const updatedColumns = [...columns];
    const column = updatedColumns[0];
    newTask = {
      ...newTask,
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
  
  // 拖拽结束：支持列与任务两种类型
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result as any;

    if (!destination) {
      return;
    }

    if (type === 'COLUMN') {
      // 列（面板）重新排序
      const updated = Array.from(columns.filter(c => !c.hide));
      const trash = columns.find(c => c.hide);
      const [removed] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, removed);
      const merged = trash ? [...updated, trash] : updated;
      setColumns(merged);
      return;
    }

    // 任务拖拽
    const sourceColumnId = parseInt(source.droppableId);
    const destColumnId = parseInt(destination.droppableId);

    const updatedColumns = [...columns];
    const sourceColumn = updatedColumns.find(col => col.id === sourceColumnId);
    const destColumn = updatedColumns.find(col => col.id === destColumnId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const [removed] = sourceColumn.tasks.splice(source.index, 1);

    if (sourceColumnId === destColumnId) {
      // 同一列内移动
      sourceColumn.tasks.splice(destination.index, 0, removed);
    } else {
      // 不同列之间移动
      destColumn.tasks.splice(destination.index, 0, removed);
    }

    setColumns(updatedColumns);
  };

  // 自动化规则表单相关
  const [ruleForm, setRuleForm] = useState({ name: '', regex: '', linkTemplate: '' });
  const handleRuleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRuleForm({ ...ruleForm, [e.target.name]: e.target.value });
  };
  const handleAddRule = () => {
    if (!ruleForm.name || !ruleForm.regex || !ruleForm.linkTemplate) return;
    setAutomationRules([
      ...automationRules,
      { id: Date.now(), ...ruleForm }
    ]);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });
  };
  const handleDeleteRule = (id: number) => {
    setAutomationRules(automationRules.filter(r => r.id !== id));
  };
  // 开始编辑规则
  const handleStartEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setRuleForm({ name: rule.name, regex: rule.regex, linkTemplate: rule.linkTemplate });
  };
  // 保存规则（编辑模式）
  const handleUpdateRule = () => {
    if (!editingRule) return;
    if (!ruleForm.name || !ruleForm.regex || !ruleForm.linkTemplate) return;
    setAutomationRules(automationRules.map(r => r.id === editingRule.id ? { ...r, ...ruleForm } : r));
    setEditingRule(null);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });
  };
  // 取消编辑
  const handleCancelEditRule = () => {
    setEditingRule(null);
    setRuleForm({ name: '', regex: '', linkTemplate: '' });
  };
  
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
                <Image src="/logo.svg" alt="Logo" width={40} height={40} />
                <h1 className="text-white font-semibold text-xl">看板</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" size="sm" onClick={() => setIsBgModalOpen(true)}>🎨 更换背景</Button>
              <Button variant="secondary" size="sm" onClick={() => setIsAutomationModalOpen(true)}>⚙️ 自动化规则</Button>
              <Button size="sm" onClick={openAddModal}>+ 添加任务</Button>
              <Button variant="secondary" size="sm" onClick={() => setIsTrashModalOpen(true)} aria-label="回收站">🗑️</Button>
              <Button variant="secondary" size="sm" onClick={addColumn}>+ 新增面板</Button>
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
                  {automationRules.map(rule => (
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
      {/* 看板内容区域：列级拖拽 */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-4">
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {columns.map((column, index) => (
                  column.hide ? (
                    <div key={column.id} className="hidden" />
                  ) : (
                    <Draggable draggableId={`col-${column.id}`} index={index} key={column.id}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <ColumnComponent
                            column={column}
                            onDeleteTask={deleteTask}
                            onEditTask={openEditModal}
                            onRestoreTask={restoreTask}
                            onEditColumnTitle={editColumnTitle}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
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
          tasks={columns.find(col => col.id === 4)?.tasks || []}
          onRestore={restoreTask}
          onDelete={deleteTask}
          onClose={() => setIsTrashModalOpen(false)}
        />
      )}
    </div>
  );
}
