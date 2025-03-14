import { Task } from '@/types/kanban';

export interface TaskModalProps {
  task?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
  mode: 'add' | 'edit';
}

declare const TaskModal: React.FC<TaskModalProps>;
export default TaskModal; 