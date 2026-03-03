import { AsanaTask } from '@/types/api';
import { locales } from '@/lib/locales';
import { TaskCard } from './TaskCard';
import { Separator } from '@/components/ui/separator';

interface TaskSectionProps {
  title: string;
  tasks: AsanaTask[];
  selectedGids: Set<string>;
  onToggle: (gid: string) => void;
}

export function TaskSection({ title, tasks, selectedGids, onToggle }: TaskSectionProps) {
  return (
    <div>
      <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground px-3">{locales.taskSection.noTasks}</p>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <TaskCard
              key={task.gid}
              task={task}
              checked={selectedGids.has(task.gid)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
      <Separator className="mt-4" />
    </div>
  );
}
