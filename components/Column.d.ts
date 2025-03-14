import { Column as ColumnType, DraggedTask } from '@/types/kanban';
import { DragEvent } from 'react';

export interface ColumnProps {
  column: ColumnType;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  onDragStart: (columnId: number, taskId: number, taskContent: string) => void;
  onDeleteTask: (columnId: number, taskId: number) => void;
  onEditTask: (columnId: number, task: ColumnType['tasks'][0]) => void;
}

declare const Column: React.FC<ColumnProps>;
export default Column; 