"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
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
      <DialogContent className="space-y-2" showCloseButton={false}>
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {mode === 'add' ? '添加新任务' : '编辑任务'}
                </DialogTitle>
                <p className="text-gray-500 text-sm">完善任务信息</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              ×
            </button>
          </div>
        </DialogHeader>

        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          {/* 任务内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="添加任务描述..."
            />
          </div>

          {/* 相关链接 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center border border-blue-200"
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 max-w-xs truncate">{link}</a>
                    <button
                      type="button"
                      onClick={() => removeLink(link)}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-bold hover:bg-blue-100 rounded p-1 transition-all duration-200"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低优先级</SelectItem>
                  <SelectItem value="medium">中优先级</SelectItem>
                  <SelectItem value="high">高优先级</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                截止日期
              </label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="选择截止日期"
              />
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center border border-purple-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-purple-600 hover:text-purple-800 font-bold hover:bg-purple-100 rounded p-1 transition-all duration-200"
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
        </form>
        
        <DialogFooter className="border-t border-gray-200 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
          >
            取消
          </Button>
          <Button 
            type="submit"
            form="task-form"
          >
            {mode === 'add' ? '创建任务' : '保存更改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}