"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
      id: task?.id || Date.now().toString(), // Generate a temporary string ID
      content,
      description,
      priority,
      tags,
      dueDate: dueDate || null,
      links,
      order: task?.order || 0,
      columnId: task?.columnId || '' // Add dummy columnId to satisfy type
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
    <Dialog open={true} onOpenChange={(o) => !o && onCancel()}>
      <DialogHeader className="relative">
        <h2 className="text-xl font-semibold text-[#172b4d]">
          {mode === 'add' ? '添加新任务' : '编辑任务'}
        </h2>
        <button
          onClick={onCancel}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#5e6c84] hover:text-[#172b4d] text-xl p-1 rounded hover:bg-gray-100"
        >
          ×
        </button>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {/* 任务内容 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              任务内容 *
            </label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入任务内容..."
              required
            />
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              任务描述
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="添加任务描述..."
            />
          </div>

          {/* 相关链接 */}
          <div>
            <label className="block text-sm font-medium text-[#172b4d] mb-2">
              相关链接
            </label>
            <Input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={handleAddLink}
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
                className="w-full bg-white border border-[#dfe1e6] rounded-md px-3 py-2 text-sm text-[#172b4d] focus-visible:outline-none focus:border-[#0079bf]"
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
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
            <Input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="输入标签后按回车添加"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>
          <Button type="submit">{mode === 'add' ? '创建任务' : '保存更改'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}