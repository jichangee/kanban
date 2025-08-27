import { Column as ColumnType, DraggedTask } from '@/types/kanban';
import { DragEvent } from 'react';

export interface ColumnProps {
  column: ColumnType;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  onDragStart: (columnId: string, taskId: string, taskContent: string) => void;
  onDeleteTask: (columnId: string, taskId: string) => void;
  onEditTask: (columnId: string, task: ColumnType['tasks'][0]) => void;
}

declare const Column: React.FC<ColumnProps>;
export default Column; 