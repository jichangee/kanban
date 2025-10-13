import { Task, Priority } from '@/types/kanban';
import { AIService, AIAction } from './ai-service';
import { BoardData } from '@/app/api/kanban/board/route';

export class AIActionHandler {
  // 执行AI动作
  static async executeAction(action: AIAction, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    try {
      switch (action.type) {
        case 'create_task':
          return await this.createTask(action.data, boardData, mutateBoard);
        case 'update_task':
          return await this.updateTask(action.data, boardData, mutateBoard);
        case 'move_task':
          return await this.moveTask(action.data, boardData, mutateBoard);
        case 'delete_task':
          return await this.deleteTask(action.data, boardData, mutateBoard);
        case 'create_column':
          return await this.createColumn(action.data, boardData, mutateBoard);
        default:
          console.error('Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  // 创建任务
  private static async createTask(data: any, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    const { columnId, content, priority = 'medium', description, tags, dueDate } = data;

    if (!columnId || !content) {
      throw new Error('缺少必要参数：列ID和任务内容');
    }

    // 验证列是否存在
    const column = boardData.find(col => col.id === columnId);
    if (!column) {
      throw new Error(`列不存在：${columnId}`);
    }

    const newTask: Omit<Task, 'id'> = {
      content: content.trim(),
      priority: AIService.parsePriority(priority) as Priority,
      description: description?.trim(),
      tags: tags ? AIService.parseTags(tags) : [],
      dueDate: dueDate || null,
      order: column.tasks.length,
      columnId
    };

    try {
      const response = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`创建任务失败: ${errorData}`);
      }

      mutateBoard(); // 重新加载数据
      return true;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  // 更新任务
  private static async updateTask(data: any, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    const { taskId, updates } = data;

    if (!taskId || !updates) {
      throw new Error('缺少必要参数：任务ID和更新内容');
    }

    // 验证任务是否存在
    const task = boardData.flatMap(col => col.tasks).find(t => t.id === taskId);
    if (!task) {
      throw new Error(`任务不存在：${taskId}`);
    }

    // 准备更新数据
    const updateData: Partial<Task> = {};

    if (updates.content) {
      updateData.content = updates.content.trim();
    }

    if (updates.priority) {
      updateData.priority = AIService.parsePriority(updates.priority) as Priority;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }

    if (updates.tags !== undefined) {
      updateData.tags = updates.tags ? AIService.parseTags(updates.tags) : [];
    }

    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate || null;
    }

    if (updates.columnId !== undefined) {
      // 如果要移动到不同列，需要更新order
      const targetColumn = boardData.find(col => col.id === updates.columnId);
      if (!targetColumn) {
        throw new Error(`目标列不存在：${updates.columnId}`);
      }
      updateData.columnId = updates.columnId;
      updateData.order = targetColumn.tasks.length;
    }

    try {
      const response = await fetch(`/api/kanban/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`更新任务失败: ${errorData}`);
      }

      mutateBoard();
      return true;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  // 移动任务
  private static async moveTask(data: any, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    const { taskId, targetColumnId } = data;

    if (!taskId || !targetColumnId) {
      throw new Error('缺少必要参数：任务ID和目标列ID');
    }

    // 验证任务和目标列
    const task = boardData.flatMap(col => col.tasks).find(t => t.id === taskId);
    const targetColumn = boardData.find(col => col.id === targetColumnId);

    if (!task) {
      throw new Error(`任务不存在：${taskId}`);
    }

    if (!targetColumn) {
      throw new Error(`目标列不存在：${targetColumnId}`);
    }

    if (task.columnId === targetColumnId) {
      throw new Error('任务已在目标列中');
    }

    // 准备重新排序数据
    const tasksToUpdate: { id: string; order: number; columnId: string }[] = [];

    // 添加移动的任务到目标列末尾
    tasksToUpdate.push({
      id: taskId,
      order: targetColumn.tasks.length,
      columnId: targetColumnId
    });

    // 更新源列任务的顺序
    const sourceColumn = boardData.find(col => col.id === task.columnId);
    if (sourceColumn) {
      sourceColumn.tasks
        .filter(t => t.id !== taskId)
        .forEach((task, index) => {
          tasksToUpdate.push({
            id: task.id,
            order: index,
            columnId: task.columnId
          });
        });
    }

    try {
      const response = await fetch('/api/kanban/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasksToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`移动任务失败: ${errorData}`);
      }

      mutateBoard();
      return true;
    } catch (error) {
      console.error('Move task error:', error);
      throw error;
    }
  }

  // 删除任务（移动到回收站）
  private static async deleteTask(data: any, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    const { taskId } = data;

    if (!taskId) {
      throw new Error('缺少必要参数：任务ID');
    }

    // 查找任务
    const task = boardData.flatMap(col => col.tasks).find(t => t.id === taskId);
    if (!task) {
      throw new Error(`任务不存在：${taskId}`);
    }

    const trashColumn = boardData.find(col => col.title === '回收站');
    if (!trashColumn) {
      throw new Error('回收站不存在');
    }

    if (task.columnId === trashColumn.id) {
      throw new Error('任务已在回收站中');
    }

    // 复用移动任务的逻辑
    return await this.moveTask({
      taskId,
      targetColumnId: trashColumn.id
    }, boardData, mutateBoard);
  }

  // 创建列
  private static async createColumn(data: any, boardData: BoardData, mutateBoard: () => void): Promise<boolean> {
    const { title } = data;

    if (!title || !title.trim()) {
      throw new Error('缺少必要参数：列标题');
    }

    const trimmedTitle = title.trim();

    // 检查是否已存在同名列
    if (boardData.some(col => col.title === trimmedTitle)) {
      throw new Error(`列"${trimmedTitle}"已存在`);
    }

    try {
      const response = await fetch('/api/kanban/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`创建列失败: ${errorData}`);
      }

      mutateBoard();
      return true;
    } catch (error) {
      console.error('Create column error:', error);
      throw error;
    }
  }

  // 批量执行动作
  static async executeActions(actions: AIAction[], boardData: BoardData, mutateBoard: () => void): Promise<AIAction[]> {
    const results: AIAction[] = [];

    for (const action of actions) {
      action.status = 'executing';
      try {
        const success = await this.executeAction(action, boardData, mutateBoard);
        action.status = success ? 'completed' : 'failed';
      } catch (error) {
        action.status = 'failed';
        action.error = error instanceof Error ? error.message : 'Unknown error';
      }
      results.push({ ...action });
    }

    return results;
  }
}