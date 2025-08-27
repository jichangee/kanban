export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  content: string;
  description?: string;
  priority: Priority;
  tags?: string[];
  dueDate?: string | null;
  order: number;
  links?: string[];
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  hide?: boolean;
}

export interface DraggedTask {
  columnId: string;
  taskId: string;
  taskContent: string;
  sourceIndex: number;
} 