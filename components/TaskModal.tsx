"use client";

import React, { useState, useEffect } from 'react';
import { Task, Priority } from '@/types/kanban';

interface TaskModalProps {
  task?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
}

export default function TaskModal({
  task,
  onSave,
  onCancel,
  mode
}: TaskModalProps) {
  const [content, setContent] = useState(task?.content || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [links, setLinks] = useState<string[]>(task?.links || []);
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Task = {
      id: task?.id || Date.now(),
      content,
      description,
      priority,
      tags,
      dueDate: dueDate || null,
      links,
      order: task?.order || 0
    };
    
    onSave(taskData);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddLink = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newLink.trim()) {
      e.preventDefault();
      if (!links.includes(newLink.trim())) {
        setLinks([...links, newLink.trim()]);
      }
      setNewLink('');
    }
  };

  const removeLink = (linkToRemove: string) => {
    setLinks(links.filter(link => link !== linkToRemove));
  };

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
      <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-[#dfe1e6]">
          <h2 className="text-xl font-semibold text-[#172b4d]">
            {mode === 'add' ? '添加新任务' : '编辑任务'}
          </h2>
          <button
            onClick={onCancel}
            className="text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 任务内容 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              任务内容 *
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field w-full"
              placeholder="输入任务内容..."
              required
            />
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              任务描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full resize-none"
              rows={4}
              placeholder="添加任务描述..."
            />
          </div>

          {/* 相关链接 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              相关链接
            </label>
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={handleAddLink}
              className="input-field w-full"
              placeholder="输入链接后按回车添加"
            />
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {links.map((link, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#e4f0f6] text-[#0079bf] rounded-full text-sm font-medium flex items-center"
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#0079bf] hover:underline max-w-xs truncate">{link}</a>
                    <button
                      type="button"
                      onClick={() => removeLink(link)}
                      className="ml-2 text-[#0079bf] hover:text-[#005a8b] font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 优先级和截止日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#172b4d] mb-2">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-field w-full"
              >
                <option value="low">低优先级</option>
                <option value="medium">中优先级</option>
                <option value="high">高优先级</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#172b4d] mb-2">
                截止日期
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#e4f0f6] text-[#0079bf] rounded-full text-sm font-medium flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-[#0079bf] hover:text-[#005a8b] font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              className="input-field w-full"
              placeholder="输入标签后按回车添加"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#dfe1e6]">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {mode === 'add' ? '创建任务' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}