import helloWorld from 'coil/examples/hello-world.coil?raw';
import routing from 'coil/examples/patterns/routing.coil?raw';
import promptChaining from 'coil/examples/patterns/prompt-chaining.coil?raw';
import parallelization from 'coil/examples/patterns/parallelization.coil?raw';
import evaluatorOptimizer from 'coil/examples/patterns/evaluator-optimizer.coil?raw';
import internalDelegation from 'coil/examples/patterns/internal-delegation.coil?raw';
import multiAgentOrchestration from 'coil/examples/patterns/multi-agent-orchestration.coil?raw';
import everythingInOneThink from 'coil/examples/anti-patterns/everything-in-one-think.coil?raw';
import thinkForDeterministicCheck from 'coil/examples/anti-patterns/think-for-deterministic-check.coil?raw';
import missingWait from 'coil/examples/anti-patterns/missing-wait.coil?raw';
import defineInsteadOfSet from 'coil/examples/anti-patterns/define-instead-of-set.coil?raw';
import sendWhenThinkNeeded from 'coil/examples/anti-patterns/send-when-think-needed.coil?raw';

export type ExampleGroup = 'Мои файлы' | 'Hello World' | 'Паттерны' | 'Антипаттерны';

export interface Example {
  id: string;
  name: string;
  group: ExampleGroup;
  dialect: string;
  content: string;
}

const DEFAULT_DIALECT = 'en-standard';
const DIALECT_RE = /^'\s*@dialect\s+(\S+)/m;

function extractDialect(source: string): string {
  const match = source.match(DIALECT_RE);
  return match ? match[1] : DEFAULT_DIALECT;
}

function ex(id: string, name: string, group: ExampleGroup, content: string): Example {
  return { id, name, group, dialect: extractDialect(content), content };
}

export const EXAMPLES: Example[] = [
  // Hello World
  ex('hello-world', 'Hello World', 'Hello World', helloWorld),

  // Паттерны
  ex('routing', 'Маршрутизация', 'Паттерны', routing),
  ex('prompt-chaining', 'Цепочка промптов', 'Паттерны', promptChaining),
  ex('parallelization', 'Параллелизация', 'Паттерны', parallelization),
  ex('evaluator-optimizer', 'Оценщик-оптимизатор', 'Паттерны', evaluatorOptimizer),
  ex('internal-delegation', 'Внутренняя делегация', 'Паттерны', internalDelegation),
  ex('multi-agent-orchestration', 'Мультиагентная оркестрация', 'Паттерны', multiAgentOrchestration),

  // Антипаттерны
  ex('everything-in-one-think', 'Всё в одном THINK', 'Антипаттерны', everythingInOneThink),
  ex('think-for-deterministic-check', 'THINK для проверки', 'Антипаттерны', thinkForDeterministicCheck),
  ex('missing-wait', 'Пропущенный WAIT', 'Антипаттерны', missingWait),
  ex('define-instead-of-set', 'DEFINE вместо SET', 'Антипаттерны', defineInsteadOfSet),
  ex('send-when-think-needed', 'SEND вместо THINK', 'Антипаттерны', sendWhenThinkNeeded),
];

export const EXAMPLE_GROUPS: ExampleGroup[] = ['Мои файлы', 'Hello World', 'Паттерны', 'Антипаттерны'];
