import { Column, Task, BoardData } from '@/types/kanban';

export interface AIAction {
  type: 'create_task' | 'update_task' | 'move_task' | 'delete_task' | 'create_column';
  description: string;
  data: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

export class AIService {
  // 查找任务
  static findTask(boardData: BoardData, taskDescription: string): Task | null {
    const lowerDesc = taskDescription.toLowerCase();

    for (const column of boardData) {
      for (const task of column.tasks) {
        // 模糊匹配任务内容
        if (
          task.content.toLowerCase().includes(lowerDesc) ||
          lowerDesc.includes(task.content.toLowerCase()) ||
          task.description?.toLowerCase().includes(lowerDesc)
        ) {
          return task;
        }
      }
    }
    return null;
  }

  // 查找列
  static findColumn(boardData: BoardData, columnTitle: string): Column | null {
    const lowerTitle = columnTitle.toLowerCase();

    return boardData.find(column => {
      // 精确匹配或包含匹配
      return (
        column.title.toLowerCase() === lowerTitle ||
        column.title.toLowerCase().includes(lowerTitle) ||
        lowerTitle.includes(column.title.toLowerCase())
      );
    }) || null;
  }

  // 根据状态查找列
  static findColumnByStatus(boardData: BoardData, status: string): Column | null {
    const statusMap: { [key: string]: string } = {
      '待办': '待办',
      'todo': '待办',
      '进行中': '进行中',
      'doing': '进行中',
      '开发中': '开发中',
      '测试中': '测试中',
      'testing': '测试中',
      '已完成': '已完成',
      'done': '已完成',
      '完成': '已完成',
      '回收站': '回收站',
      'trash': '回收站'
    };

    const targetTitle = statusMap[status.toLowerCase()] || status;
    return this.findColumn(boardData, targetTitle);
  }

  // 解析任务优先级
  static parsePriority(priorityText: string): 'low' | 'medium' | 'high' {
    const priorityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
      '高': 'high',
      '紧急': 'high',
      '重要': 'high',
      'high': 'high',
      'urgent': 'high',
      'important': 'high',
      '中': 'medium',
      '普通': 'medium',
      'medium': 'medium',
      'normal': 'medium',
      '低': 'low',
      '一般': 'low',
      'low': 'low',
      'minor': 'low'
    };

    return priorityMap[priorityText.toLowerCase()] || 'medium';
  }

  // 解析标签
  static parseTags(tagsText: string): string[] {
    if (!tagsText) return [];

    return tagsText
      .split(/[,，、\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // 限制最多5个标签
  }

  // 解析任务ID
  static parseTaskId(boardData: BoardData, taskRef: string): string | null {
    // 如果是完整的ID，直接返回
    if (boardData.some(col => col.tasks.some(task => task.id === taskRef))) {
      return taskRef;
    }

    // 尝试通过内容匹配
    const task = this.findTask(boardData, taskRef);
    return task ? task.id : null;
  }

  // 生成任务总结
  static generateBoardSummary(boardData: BoardData): string {
    const totalTasks = boardData.reduce((sum, col) => sum + col.tasks.length, 0);

    const taskByPriority = {
      high: 0,
      medium: 0,
      low: 0
    };

    boardData.forEach(column => {
      column.tasks.forEach(task => {
        taskByPriority[task.priority]++;
      });
    });

    const columnsInfo = boardData.map(col =>
      `${col.title}: ${col.tasks.length}个任务`
    ).join('\n');

    const summary = `📊 看板概览：

📈 统计数据：
• 总任务数：${totalTasks}
• 高优先级：${taskByPriority.high}个
• 中优先级：${taskByPriority.medium}个
• 低优先级：${taskByPriority.low}个

📋 各列状态：
${columnsInfo}

💡 建议：
${taskByPriority.high > 0 ? '• 有高优先级任务需要关注' : ''}
${totalTasks > 20 ? '• 任务较多，建议优先处理重要事项' : ''}
${taskByPriority.low > totalTasks * 0.6 ? '• 低优先级任务较多，可考虑批量处理' : ''}`;

    return summary;
  }

  // 分析工作负载
  static analyzeWorkload(boardData: BoardData): string {
    const today = new Date();
    const overdueTasks: Task[] = [];
    const upcomingTasks: Task[] = [];

    boardData.forEach(column => {
      column.tasks.forEach(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (dueDate < today && column.title !== '已完成') {
            overdueTasks.push(task);
          } else if (dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
            upcomingTasks.push(task);
          }
        }
      });
    });

    let analysis = `📅 工作负载分析：

`;

    if (overdueTasks.length > 0) {
      analysis += `⚠️ 逾期任务 (${overdueTasks.length}个):\n`;
      overdueTasks.forEach(task => {
        analysis += `• ${task.content} (逾期${Math.floor((today.getTime() - new Date(task.dueDate!).getTime()) / (24 * 60 * 60 * 1000))}天)\n`;
      });
      analysis += '\n';
    }

    if (upcomingTasks.length > 0) {
      analysis += `🔔 即将到期 (${upcomingTasks.length}个):\n`;
      upcomingTasks.forEach(task => {
        analysis += `• ${task.content} (${task.dueDate})\n`;
      });
    }

    if (overdueTasks.length === 0 && upcomingTasks.length === 0) {
      analysis += '✅ 暂无紧急到期任务，工作节奏良好！';
    }

    return analysis;
  }

  // 智能任务建议
  static generateTaskSuggestions(boardData: BoardData): string {
    const todoColumn = boardData.find(col =>
      col.title.includes('待办') || col.title.toLowerCase().includes('todo')
    );

    const inProgressColumn = boardData.find(col =>
      col.title.includes('进行') || col.title.includes('开发') ||
      col.title.toLowerCase().includes('doing') || col.title.toLowerCase().includes('progress')
    );

    let suggestions = `💡 智能建议：

`;

    if (todoColumn && todoColumn.tasks.length > 5) {
      suggestions += `• 待办列有${todoColumn.tasks.length}个任务，建议优先处理高优先级项目
`;
    }

    if (inProgressColumn && inProgressColumn.tasks.length > 3) {
      suggestions += `• 进行中有${inProgressColumn.tasks.length}个任务，建议专注完成一些任务后再开始新的
`;
    }

    const highPriorityTasks = boardData.reduce((count, col) =>
      count + col.tasks.filter(task => task.priority === 'high').length, 0
    );

    if (highPriorityTasks > 0) {
      suggestions += `• 发现${highPriorityTasks}个高优先级任务，建议优先处理
`;
    }

    if (suggestions === `💡 智能建议：

`) {
      suggestions += '✨ 当前任务分配合理，继续保持！';
    }

    return suggestions;
  }
}