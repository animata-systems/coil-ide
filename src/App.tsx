import { ThemeProvider } from './components/ThemeProvider';
import { ExampleProvider } from './components/ExampleProvider';
import { Layout } from './components/Layout';

export function App() {
  return (
    <ThemeProvider>
      <ExampleProvider>
        <Layout />
      </ExampleProvider>
    </ThemeProvider>
  );
}
