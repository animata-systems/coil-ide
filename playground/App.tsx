import { ThemeProvider } from './components/ThemeProvider';
import { ExampleProvider } from './components/ExampleProvider';
import { PlaygroundPipelineBridge } from './components/PlaygroundPipelineBridge';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ThemeProvider>
      <ExampleProvider>
        <PlaygroundPipelineBridge>
          <Layout />
        </PlaygroundPipelineBridge>
      </ExampleProvider>
    </ThemeProvider>
  );
}
