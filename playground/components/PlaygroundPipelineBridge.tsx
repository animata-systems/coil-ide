import { type ReactNode } from 'react';
import { PipelineProvider, dialectRegistry, DEFAULT_DIALECT } from 'coil-ide';
import { useExample } from './ExampleProvider';

/**
 * Playground-level bridge between the example state and the library
 * PipelineProvider. The only place where `useExample()` is wired into the
 * pipeline; keeps the library itself free of playground concepts.
 */
export function PlaygroundPipelineBridge({ children }: { children: ReactNode }) {
  const { activeExample } = useExample();
  const dialectKey = activeExample?.dialect ?? DEFAULT_DIALECT;
  const dialect = dialectRegistry.get(dialectKey);
  if (!dialect) throw new Error(`Unknown dialect: ${dialectKey}`);
  const source = activeExample?.content ?? '';

  return (
    <PipelineProvider source={source} dialect={dialect}>
      {children}
    </PipelineProvider>
  );
}
