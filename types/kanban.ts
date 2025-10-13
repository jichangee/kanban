export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string; // Changed from number
  content: string;
  description?: string;
  priority: Priority;
  tags?: string[];
  dueDate?: string | null;
  order: number;
  links?: string[];
  columnId: string; // Added columnId for easier reference
}

export interface Column {
  id: string; // Changed from number
  title: string;
  tasks: Task[];
  hide?: boolean;
}

export type BoardData = Column[]; 