import { useState, useCallback, useRef } from 'react';
import { Header } from './Header';
import { LeftToolbar } from './LeftToolbar';
import { RightToolbar, type RightPanelView } from './RightToolbar';
import { ResizeHandle } from './ResizeHandle';
import { LeftSidebar } from './LeftSidebar';
import { EditorPanel } from './EditorPanel';
import { ValidationPanel, CoilHPanel } from './RightSidebar';
import { StatusBar } from './StatusBar';

const MIN_PANEL_WIDTH = 40;
const RESIZE_HANDLE_WIDTH = 7;

export function Layout() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('validation');
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLeftPanel = useCallback(() => {
    setLeftPanelOpen(prev => !prev);
  }, []);

  const toggleRightPanel = useCallback((view: RightPanelView) => {
    if (rightPanelOpen && rightPanelView === view) {
      setRightPanelOpen(false);
    } else {
      setRightPanelOpen(true);
      setRightPanelView(view);
    }
  }, [rightPanelOpen, rightPanelView]);

  const handleLeftResize = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const rightWidth = rightPanelOpen ? rightPanelWidth : 0;
    const resizeHandlesWidth = (leftPanelOpen ? RESIZE_HANDLE_WIDTH : 0) + (rightPanelOpen ? RESIZE_HANDLE_WIDTH : 0);
    const maxLeftWidth = containerWidth - rightWidth - MIN_PANEL_WIDTH - resizeHandlesWidth;
    setLeftPanelWidth(w => Math.max(MIN_PANEL_WIDTH, Math.min(maxLeftWidth, w + delta)));
  }, [rightPanelOpen, rightPanelWidth, leftPanelOpen]);

  const handleRightResize = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const leftWidth = leftPanelOpen ? leftPanelWidth : 0;
    const resizeHandlesWidth = (leftPanelOpen ? RESIZE_HANDLE_WIDTH : 0) + (rightPanelOpen ? RESIZE_HANDLE_WIDTH : 0);
    const maxRightWidth = containerWidth - leftWidth - MIN_PANEL_WIDTH - resizeHandlesWidth;
    setRightPanelWidth(w => Math.max(MIN_PANEL_WIDTH, Math.min(maxRightWidth, w + delta)));
  }, [leftPanelOpen, leftPanelWidth, rightPanelOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar isOpen={leftPanelOpen} onToggle={toggleLeftPanel} />

        <div ref={containerRef} className="flex flex-1 p-1.5 pl-0 gap-0 overflow-hidden">
          {leftPanelOpen && (
            <>
              <div
                className="h-full rounded-lg bg-ide-panel overflow-hidden flex-shrink-0"
                style={{ width: leftPanelWidth, minWidth: MIN_PANEL_WIDTH }}
              >
                <LeftSidebar />
              </div>
              <ResizeHandle onResize={handleLeftResize} side="left" />
            </>
          )}

          <div className="flex-1 h-full rounded-lg bg-ide-editor overflow-hidden" style={{ minWidth: MIN_PANEL_WIDTH }}>
            <EditorPanel />
          </div>

          {rightPanelOpen && (
            <>
              <ResizeHandle onResize={handleRightResize} side="right" />
              <div
                className="h-full rounded-lg bg-ide-panel overflow-hidden flex-shrink-0"
                style={{ width: rightPanelWidth, minWidth: MIN_PANEL_WIDTH }}
              >
                {rightPanelView === 'validation' ? <ValidationPanel /> : <CoilHPanel />}
              </div>
            </>
          )}
        </div>

        <RightToolbar
          activeView={rightPanelView}
          isPanelOpen={rightPanelOpen}
          onToggle={toggleRightPanel}
        />
      </div>

      <StatusBar />
    </div>
  );
}
