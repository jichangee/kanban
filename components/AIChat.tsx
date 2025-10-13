"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Column, Task, BoardData } from '@/types/kanban';
import { Send, Bot, User, Sparkles, Copy, Check } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

interface AIAction {
  type: 'create_task' | 'update_task' | 'move_task' | 'delete_task' | 'create_column';
  description: string;
  data: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

interface AIChatProps {
  boardData: BoardData | undefined;
  onActionExecute: (action: AIAction) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ boardData, onActionExecute, isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatBoardData = (): string => {
    if (!boardData) return '当前没有看板数据';

    return boardData.map(column => {
      const tasks = column.tasks.map(task =>
        `- ${task.content}${task.description ? ` (${task.description})` : ''} [优先级: ${task.priority}]${task.dueDate ? ` [截止: ${task.dueDate}]` : ''}${task.tags?.length ? ` [标签: ${task.tags.join(', ')}]` : ''}`
      ).join('\n  ');
      return `${column.title} (${column.tasks.length}个任务):\n  ${tasks}`;
    }).join('\n\n');
  };

  const generateSystemPrompt = (): string => {
    return `你是一个智能看板助手，可以帮助用户管理任务和看板。你可以：

1. 创建新任务（指定内容和所属列）
2. 更新现有任务（修改内容、优先级、标签等）
3. 移动任务到不同列
4. 删除任务
5. 创建新列

当前看板状态：
${formatBoardData()}

请根据用户的需求，分析看板数据并提供相应的帮助。当用户需要执行操作时，请生成对应的操作指令。

操作指令格式：
- 创建任务: {"type": "create_task", "data": {"columnId": "列ID", "content": "任务内容", "priority": "high/medium/low", "description": "描述", "tags": ["标签1", "标签2"]}}
- 移动任务: {"type": "move_task", "data": {"taskId": "任务ID", "targetColumnId": "目标列ID"}}
- 更新任务: {"type": "update_task", "data": {"taskId": "任务ID", "updates": {"content": "新内容", "priority": "high"}}}
- 删除任务: {"type": "delete_task", "data": {"taskId": "任务ID"}}
- 创建列: {"type": "create_column", "data": {"title": "列标题"}}

回复格式要求：
1. 使用Markdown格式化回复，使内容更加清晰易读
2. 使用标题、列表、代码块等Markdown元素
3. 对于复杂信息，使用表格展示
4. 重要信息使用加粗或强调
5. 代码示例使用代码块格式
6. 用中文回复，提供清晰、简洁的帮助

例如：
### 📋 任务分析

**当前状态：**
- ✅ 已完成: 5个任务
- 🔄 进行中: 3个任务
- ⏳ 待办: 8个任务

**建议操作：**
1. 优先处理高优先级任务
2. 考虑任务的依赖关系

请确保所有回复都使用良好的Markdown格式。`;
  };

  const executeAIAction = async (action: AIAction): Promise<Message> => {
    const success = await onActionExecute(action);

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: success
        ? `✅ 操作执行成功：${action.description}`
        : `❌ 操作执行失败：${action.description}${action.error ? ` (${action.error})` : ''}`,
      timestamp: new Date(),
      actions: [{ ...action, status: success ? 'completed' : 'failed' }]
    };
  };

  const parseAndExecuteActions = async (aiResponse: string): Promise<Message[]> => {
    const actionRegex = /\{"type":"[^"]+","data":\{[^}]+\}\}/g;
    const actionMatches = aiResponse.match(actionRegex);
    const actionMessages: Message[] = [];

    if (actionMatches) {
      for (const match of actionMatches) {
        try {
          const actionData = JSON.parse(match);
          const action: AIAction = {
            type: actionData.type,
            description: getActionDescription(actionData),
            data: actionData.data,
            status: 'pending'
          };

          const actionMessage = await executeAIAction(action);
          actionMessages.push(actionMessage);
        } catch (error) {
          console.error('Failed to parse or execute action:', error);
        }
      }
    }

    return actionMessages;
  };

  const getActionDescription = (actionData: any): string => {
    switch (actionData.type) {
      case 'create_task':
        return `创建任务：${actionData.data.content}`;
      case 'move_task':
        return `移动任务`;
      case 'update_task':
        return `更新任务`;
      case 'delete_task':
        return `删除任务`;
      case 'create_column':
        return `创建列：${actionData.data.title}`;
      default:
        return `执行操作`;
    }
  };

  const callGoogleAI = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: generateSystemPrompt() },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('AI API调用失败');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await callGoogleAI([...messages, userMessage]);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      const actionMessages = await parseAndExecuteActions(aiResponse);
      if (actionMessages.length > 0) {
        setMessages(prev => [...prev, ...actionMessages]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '抱歉，我现在无法处理您的请求。请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-blue-500" />
            AI 看板助手
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">你好！我是你的AI看板助手</p>
                <p className="text-sm text-gray-500">我可以帮你管理任务，比如创建新任务、移动任务或查看看板状态</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <MarkdownRenderer
                      content={message.content}
                      isUserMessage={message.role === 'user'}
                      className="text-sm"
                    />

                    {message.actions && (
                      <div className="mt-2 space-y-1">
                        {message.actions.map((action, index) => (
                          <Badge
                            key={index}
                            variant={
                              action.status === 'completed'
                                ? 'default'
                                : action.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {action.status === 'completed' && '✅ '}
                            {action.status === 'failed' && '❌ '}
                            {action.description}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="问我关于看板的任何问题..."
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}