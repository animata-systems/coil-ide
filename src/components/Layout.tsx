import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { EditorPanel } from './EditorPanel';
import { RightSidebar } from './RightSidebar';

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-x-auto">
        <LeftSidebar />
        <EditorPanel />
        <RightSidebar />
      </div>
    </div>
  );
}
