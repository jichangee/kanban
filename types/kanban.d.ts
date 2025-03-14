export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  content: string;
  description: string;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  order: number;
  link: string | null;
}

export interface Column {
  id: number;
  title: string;
  tasks: Task[];
  hide?: boolean;
}

export interface DraggedTask {
  columnId: number;
  taskId: number;
  taskContent: string;
  sourceIndex: number;
} 