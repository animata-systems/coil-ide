import { Sun, Moon, HelpCircle } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const iconBtnClass = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/8 transition-colors';

export function Header() {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <header className="flex h-12 items-center justify-between bg-transparent px-2">
      <div className="flex items-center gap-2.5">
        <div className="relative h-7 w-7">
          <svg
            viewBox="0 0 135 135"
            className="h-full w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="67.5" cy="67.5" r="67.5" fill="#1a1a1a" />
            <circle cx="67.5" cy="67.5" r="62.5" fill="#D9D9D9" />
            <circle cx="68" cy="68" r="20" fill="#1a1a1a" />
          </svg>
        </div>
        <h1 className="text-base font-medium tracking-tight text-foreground">
          Coil Playground
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <a
          href="https://deepwiki.com/animata-systems/coil"
          target="_blank"
          rel="noopener noreferrer"
          className={iconBtnClass}
          title="Documentation"
        >
          <HelpCircle className="h-4 w-4" />
        </a>

        <a
          href="https://github.com/animata-systems/coil"
          target="_blank"
          rel="noopener noreferrer"
          className={iconBtnClass}
          title="GitHub"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        <div className="w-px h-4 bg-foreground/10 mx-1" />

        <button
          onClick={toggle}
          className={iconBtnClass}
          title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
