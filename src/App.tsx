import { ThemeProvider } from './components/ThemeProvider';
import { ExampleProvider } from './components/ExampleProvider';
import { PipelineProvider } from './components/PipelineProvider';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ThemeProvider>
      <ExampleProvider>
        <PipelineProvider>
          <Layout />
        </PipelineProvider>
      </ExampleProvider>
    </ThemeProvider>
  );
}
