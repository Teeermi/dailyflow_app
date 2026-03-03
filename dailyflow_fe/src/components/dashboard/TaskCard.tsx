import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AsanaTask } from '@/types/api';
import { locales } from '@/lib/locales';

interface TaskCardProps {
  task: AsanaTask;
  checked: boolean;
  onToggle: (gid: string) => void;
}

export function TaskCard({ task, checked, onToggle }: TaskCardProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onToggle(task.gid)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(task.gid)}
        className="mt-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{task.name}</p>
        {task.projects && task.projects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.projects.map((p) => (
              <Badge key={p.name} variant="secondary" className="text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        )}
        {task.due_on && (
          <p className="text-xs text-muted-foreground mt-1">{locales.taskCard.due(task.due_on!)}</p>
        )}
      </div>
    </div>
  );
}
