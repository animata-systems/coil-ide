import { Code2 } from 'lucide-react';

export function EmptyEditor() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-4">
      <Code2 className="h-16 w-16 opacity-20" />
      <div className="text-center">
        <p className="text-sm">Нет открытых файлов</p>
        <p className="text-xs mt-1 opacity-70">Кликните по файлу в Explorer чтобы открыть</p>
      </div>
    </div>
  );
}
