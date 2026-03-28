import { useState, useRef, useEffect } from 'react';
import { File } from 'lucide-react';

interface DialectOption {
  id: string;
  name: string;
  extension: string;
  description: string;
}

const DIALECT_OPTIONS: DialectOption[] = [
  { id: 'en-standard', name: 'en-standard', extension: '.en.coil', description: 'Standard English' },
  { id: 'en-profanity', name: 'en-profanity', extension: '.en.coil', description: 'Profanity English' },
  { id: 'ru-standard', name: 'ru-standard', extension: '.ru.coil', description: 'Стандартный русский' },
  { id: 'ru-matrix', name: 'ru-matrix', extension: '.ru.coil', description: 'Красная таблетка' },
  { id: 'ru-mat', name: 'ru-mat', extension: '.ru.coil', description: 'Мат' },
];

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFile: (name: string, dialect: string) => void;
}

export function NewFileDialog({ open, onOpenChange, onCreateFile }: NewFileDialogProps) {
  const [fileName, setFileName] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<DialectOption>(DIALECT_OPTIONS[0]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setFileName('');
      setSelectedDialect(DIALECT_OPTIONS[0]);
      dialog.showModal();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onOpenChange(false);
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onOpenChange]);

  const handleCreate = () => {
    if (!fileName.trim()) return;
    let finalName = fileName.trim();
    if (!finalName.includes('.')) {
      finalName = finalName + selectedDialect.extension;
    }
    onCreateFile(finalName, selectedDialect.id);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const previewName = fileName.trim()
    ? (fileName.includes('.') ? fileName : fileName + selectedDialect.extension)
    : `untitled${selectedDialect.extension}`;

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0 w-full max-w-md rounded-lg border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === dialogRef.current) onOpenChange(false);
      }}
    >
      <div className="p-6">
        {/* Header */}
        <h2 className="text-base font-semibold">Create New File</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a file name and select a dialect for your new Coil file.
        </p>

        <div className="mt-4 space-y-4">
          {/* File name input */}
          <div className="space-y-1.5">
            <label htmlFor="new-file-name" className="text-sm text-muted-foreground">
              File name
            </label>
            <input
              ref={inputRef}
              id="new-file-name"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="my-agent"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Dialect selection */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Dialect</label>
            <div className="grid grid-cols-2 gap-2">
              {DIALECT_OPTIONS.map((dialect) => (
                <button
                  key={dialect.id}
                  type="button"
                  onClick={() => setSelectedDialect(dialect)}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors hover:bg-foreground/5 ${
                    selectedDialect.id === dialect.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <File className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{dialect.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{dialect.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{previewName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-md border border-border px-3 text-sm transition-colors hover:bg-foreground/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!fileName.trim()}
            className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create
          </button>
        </div>
      </div>
    </dialog>
  );
}
