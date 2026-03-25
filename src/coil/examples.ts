import helloEn from '../../../coil/examples/hello.coil?raw';
import helloRu from '../../../coil/examples/hello.ru.coil?raw';
import routing from '../../../coil/examples/patterns/routing.coil?raw';
import promptChaining from '../../../coil/examples/patterns/prompt-chaining.coil?raw';
import parallelization from '../../../coil/examples/patterns/parallelization.coil?raw';
import evaluatorOptimizer from '../../../coil/examples/patterns/evaluator-optimizer.coil?raw';
import internalDelegation from '../../../coil/examples/patterns/internal-delegation.coil?raw';
import multiAgentOrchestration from '../../../coil/examples/patterns/multi-agent-orchestration.coil?raw';
import everythingInOneThink from '../../../coil/examples/anti-patterns/everything-in-one-think.coil?raw';
import thinkForDeterministicCheck from '../../../coil/examples/anti-patterns/think-for-deterministic-check.coil?raw';
import missingWait from '../../../coil/examples/anti-patterns/missing-wait.coil?raw';
import defineInsteadOfSet from '../../../coil/examples/anti-patterns/define-instead-of-set.coil?raw';
import sendWhenThinkNeeded from '../../../coil/examples/anti-patterns/send-when-think-needed.coil?raw';

export type ExampleGroup = 'Hello World' | 'Паттерны' | 'Антипаттерны';

export interface Example {
  id: string;
  name: string;
  group: ExampleGroup;
  dialect: 'en-standard' | 'ru-matrix';
  content: string;
}

export const EXAMPLES: Example[] = [
  // Hello World
  { id: 'hello', name: 'Hello World (EN)', group: 'Hello World', dialect: 'en-standard', content: helloEn },
  { id: 'hello-ru', name: 'Hello World (RU)', group: 'Hello World', dialect: 'ru-matrix', content: helloRu },

  // Паттерны
  { id: 'routing', name: 'Маршрутизация', group: 'Паттерны', dialect: 'ru-matrix', content: routing },
  { id: 'prompt-chaining', name: 'Цепочка промптов', group: 'Паттерны', dialect: 'ru-matrix', content: promptChaining },
  { id: 'parallelization', name: 'Параллелизация', group: 'Паттерны', dialect: 'ru-matrix', content: parallelization },
  { id: 'evaluator-optimizer', name: 'Оценщик-оптимизатор', group: 'Паттерны', dialect: 'ru-matrix', content: evaluatorOptimizer },
  { id: 'internal-delegation', name: 'Внутренняя делегация', group: 'Паттерны', dialect: 'ru-matrix', content: internalDelegation },
  { id: 'multi-agent-orchestration', name: 'Мультиагентная оркестрация', group: 'Паттерны', dialect: 'ru-matrix', content: multiAgentOrchestration },

  // Антипаттерны
  { id: 'everything-in-one-think', name: 'Всё в одном THINK', group: 'Антипаттерны', dialect: 'en-standard', content: everythingInOneThink },
  { id: 'think-for-deterministic-check', name: 'THINK для проверки', group: 'Антипаттерны', dialect: 'en-standard', content: thinkForDeterministicCheck },
  { id: 'missing-wait', name: 'Пропущенный WAIT', group: 'Антипаттерны', dialect: 'en-standard', content: missingWait },
  { id: 'define-instead-of-set', name: 'DEFINE вместо SET', group: 'Антипаттерны', dialect: 'en-standard', content: defineInsteadOfSet },
  { id: 'send-when-think-needed', name: 'SEND вместо THINK', group: 'Антипаттерны', dialect: 'en-standard', content: sendWhenThinkNeeded },
];

export const EXAMPLE_GROUPS: ExampleGroup[] = ['Hello World', 'Паттерны', 'Антипаттерны'];
