# Решения реализации

Журнал принятых проектных решений по реализации COIL Playground (coil-ide):

- архитектура фронтенда,
- интеграция с coil-runtime,
- редактор и визуализация.

## Как ведётся этот журнал

Каждое решение получает сквозной номер `I-NNNN`.

| Статус | Значение |
|---|---|
| `принят` | Решение зафиксировано, реализация следует ему. |
| `принят как направление` | Выбор сделан, детали уточняются по ходу реализации. |
| `заменён I-NNNN` | Решение заменено указанным. |

Процесс:
1. Принять решение → присвоить следующий `I-NNNN`, записать мотивацию, статус `принят`.
2. Заменить решение → старому присвоить `заменён I-NNNN`, новому — свой `I-NNNN`.

---

## I-0001 — Git-зависимости: coil-runtime и coil через github:

| | |
|---|---|
| **Статус** | принят |
| **Решено** | 2026-03-25 |
| **Контекст** | Playground импортирует из coil-runtime (лексер, парсер, валидатор через `browser` entry point) и использует диалектные JSON-таблицы из coil. Нужен способ подключения обоих пакетов. Аналогичное решение уже принято для coil-runtime: R-0013 фиксирует `"coil": "github:animata-systems/coil"` как git-зависимость. |
| **Решение** | Оба пакета — git-зависимости: `"coil-runtime": "github:animata-systems/coil-runtime"` в `dependencies`, `"coil": "github:animata-systems/coil"` в `dependencies`. coil-runtime используется как библиотека (импорт из `coil-runtime/browser`). coil используется как источник диалектных JSON (Vite JSON import из `node_modules/coil/dialects/`). |
| **Последствия** | `npm install` клонирует оба публичных репозитория. coil-ide собирается автономно, без зависимости от структуры umbrella. Паттерн единообразен с coil-runtime (R-0013). Пиннинг на main; при стабилизации — перейти на теги. При обновлении runtime или диалектов: `npm update coil-runtime coil`. |

---

## I-0002 — Test runner: vitest

| | |
|---|---|
| **Статус** | принят |
| **Решено** | 2026-03-27 |
| **Scope** | coil-ide/package.json, coil-ide/vitest.config.ts |

**Контекст.** COIL-H маппинг нуждается в unit-тестах. В coil-ide нет test runner. coil-runtime использует vitest ^3.0.0.

**Решение.** Использовать vitest — тот же runner, что в coil-runtime. Единообразие снижает когнитивную нагрузку и позволяет переиспользовать конфиг-паттерны.

**Цена.** Новая devDependency. Минимальная.

---

## I-0003 — Порядок модификаторов ДУМАЙ в COIL-H

| | |
|---|---|
| **Статус** | принят |
| **Решено** | 2026-03-27 |
| **Scope** | coil-ide/src/coil/coil-h.ts (buildThinkBody) |

**Контекст.** ThinkNode имеет анонимное тело `body: TemplateNode | null` (D-0032). Нужно определить позицию `body` в COIL-H маппинге. D-0032 фиксирует порядок в COIL-C: `...оснащение → РЕЗУЛЬТАТ → << тело >> → КОНЕЦ`.

**Решение.** COIL-H отображает модификаторы ДУМАЙ в том же порядке, что COIL-C:
1. Оснащение: ЧЕРЕЗ, КАК, ИСПОЛЬЗУЯ
2. Постановка: ЦЕЛЬ, ВХОД, КОНТЕКСТ
3. РЕЗУЛЬТАТ (pre-блок)
4. Анонимное тело (`<< текст >>`)

Порядок чтения идентичен COIL-C. Нет расхождения между двумя представлениями.

**Цена.** Нет. Решение следует принципу наименьшего удивления.

---

## I-0004 — Плоская раскладка coil-ide: библиотека в корне, playground в подпапке

| | |
|---|---|
| **Статус** | принят как направление |
| **Решено** | 2026-04-09 |
| **Scope** | coil-ide/package.json, coil-ide/src/**, coil-ide/playground/**, coil-ide/vite.config.ts |
| **Связан с** | никаких `../` путей наружу |

**Контекст.** Компоненты coil-ide должны стать доступны внешнему потребителю (coil-sandbox) для показа кода агентов. Запрещается `../` пути между модулями — единственный способ подключения — git-зависимость в `package.json` (как сейчас `coil` и `coil-runtime` через I-0001/R-0013).

Рассматривались три варианта раскладки:
- **A.** Монорепо с workspaces (`packages/coil-ide-components` + `apps/playground`). Проблема: `npm install github:animata-systems/coil-ide` не умеет ставить sub-package из git-репо. pnpm/yarn поддерживают нестандартными расширениями, что привязывает потребителя к конкретному менеджеру пакетов.
- **B.** Выделить библиотеку в отдельный публичный подмодуль `coil-ide-components`. Чисто архитектурно, но — новый git-репо, новый submodule, новый пункт в confidentiality-аудите. Цена высока для первой итерации.
- **C.** Плоская раскладка: корневой `package.json` coil-ide = публичный пакет с `exports`, библиотечные исходники в `src/`, playground-специфичный код (main entry, layout, example data, theme toggle) переезжает в `playground/`. Playground импортирует `coil-ide` по относительному пути через Vite alias или через самоимпорт (`import { … } from 'coil-ide'`, Node resolves локально).

**Решение.** Вариант C.

Раскладка:
```
coil-ide/
  package.json          — name: "coil-ide", не private, exports, peerDeps react/monaco
  src/                  — библиотечный код (pipeline, CoilHTable, EditorPanel, dialects, coil-h, monarch, languages, themes)
  playground/
    index.html
    main.tsx            — bootstrap Playground-специфичного приложения
    App.tsx
    components/         — Header, Layout, LeftSidebar, EditorTabs, NewFileDialog, ExampleProvider, ThemeProvider
    coil/examples.ts, template-translations.ts
  vite.config.ts        — конфиг playground (root: 'playground')
  vite.lib.config.ts    — конфиг библиотечной сборки (build.lib, emit в dist/)
  tsconfig.lib.json     — tsconfig для библиотеки (с declaration: true, emit в dist/)
  tsconfig.playground.json
```

`package.json` библиотеки экспортирует две точки входа:
- `"."` — публичный React/headless API целиком;
- `"./headless"` — только pipeline и `astToCoilH`, без React. Для серверных/vanilla-потребителей.

`peerDependencies`: `react`, `react-dom`, `@monaco-editor/react`, `monaco-editor`.
`dependencies`: `coil` (для dialect JSON), `coil-runtime`.

Playground использует уже опубликованный пакет через Node self-reference (`import { PipelineProvider } from 'coil-ide'`) — Node резолвит это на корневой `package.json` в том же проекте. Никаких рабочих пространств и `../` алиасов не требуется.

**Граница библиотека ↔ playground.** В библиотеку попадает то, что имеет смысл вне playground:
- `PipelineProvider` + `usePipeline` hook
- `CoilHTable` (новый рендер, см. I-0005)
- `EditorPanel` (Monaco-редактор с подсветкой)
- `dialectRegistry` и `DEFAULT_DIALECT`
- `astToCoilH` + новые типы `CoilHRow*` (см. I-0005)
- `monarch`, `languages`, `themes`, `monaco-utils` (поддержка Monaco)

В playground остаётся:
- `Layout`, `Header`, `LeftSidebar`, `LeftToolbar`, `RightSidebar`, `RightToolbar`, `StatusBar`, `EditorTabs`, `NewFileDialog`, `EmptyEditor` (UI-оболочка playground)
- `ExampleProvider`, `ThemeProvider` (стейт-менеджмент приложения playground)
- `examples.ts`, `template-translations.ts` (playground-специфичные данные)
- `ValidationPanel`, `CoilHPanel` (обёртки над библиотечными компонентами с playground-специфичной интеграцией — switch диалекта, перевод шаблонов)

Если позже окажется, что `ValidationPanel` / `CoilHPanel` переиспользуемы без playground-контекста — их перенесут в библиотеку (это дешевле, чем обратное).

**Почему.**
- Минимальная перестройка существующего кода: большая часть `src/` не переезжает, просто выделяется playground-шелл.
- Нулевая привязка к менеджеру пакетов: работает с любым npm-совместимым клиентом.
- Паттерн потребления sandbox'ом единообразен с тем, как sandbox уже подключает `coil` и `coil-runtime` (I-0001, R-0013).
- Нет нового публичного репозитория и нового submodule.

**Цена.**
- Два конфига Vite (lib + playground) и два tsconfig. Усложнение сборки.
- Отсутствие ясной границы «это публичный API, это внутреннее» внутри одного `src/` — дисциплина держится через `exports` в `package.json`.
- Node self-reference требует, чтобы у пакета был валидный `exports`, иначе playground не импортирует собственный библиотечный код.

---

## I-0005 — COIL-H: структурное представление `CoilHRow.body`

| | |
|---|---|
| **Статус** | принят как направление |
| **Решено** | 2026-04-09 |
| **Scope** | coil-ide/src/coil/coil-h.ts, coil-ide/src/components/RightSidebar.tsx (CoilHTable), coil-ide/src/coil/coil-h*.test.ts |
| **Связан с** | `coil/spec/11-coil-h.md` §11.5 |

**Контекст.** Текущая модель `CoilHRow.body: string` (`coil-h.ts:20`) — плоский текст, куда `astToCoilH` склеивает модификаторы через `\n` и буквально вставляет маркеры шаблона `<< … >>`. Визуальные следствия:
- пользователь видит физические `<<` и `>>` вокруг шаблонов;
- ключевые слова модификаторов (`ЦЕЛЬ`, `ВХОД`, `РЕЗУЛЬТАТ`, `КУДА`, `КОМУ`, `НА` и т.д.) визуально не отделены от значений;
- структурный блок `РЕЗУЛЬТАТ` (список полей с типами) не отличается от обычного текста.

Спека COIL-H §11.5 требует:
- для ДУМАЙ: «каждый модификатор — метка + значение. Шаблоны — в блочном формате. РЕЗУЛЬТАТ — как структурный блок»;
- для НАПИШИ: «модификаторы (`КУДА`, `КОМУ`, `ОТВЕТ НА`, `ЖДАТЬ`, `НЕ БОЛЕЕ`) + шаблон сообщения»;
- для ЖДИ: «`НА` + список обещаний, `РЕЖИМ`, `НЕ БОЛЕЕ`».

«Метка + значение» подразумевает визуальное разделение: лейбл как chip/бейдж, значение — как текст или блок. Плоская строка это требование удовлетворить не может.

**Решение.** Перепроектировать `CoilHRow`:

```ts
type CoilHCell =
  | { kind: 'modifier'; label: string; value: CoilHValue }
  | { kind: 'template'; text: string }             // без маркеров <<>>, рендер добавляет их визуально
  | { kind: 'result-block'; fields: ResultFieldRow[] }
  | { kind: 'args-block'; args: { key: string; value: string }[] }
  | { kind: 'text'; text: string };                // для УЧАСТНИКИ/ИНСТРУМЕНТЫ/condition и т.п.

type CoilHValue =
  | { kind: 'plain'; text: string }                // ссылки, числа, строки, channel refs
  | { kind: 'template'; text: string };            // шаблон — рендер оборачивает стилем

interface CoilHRow {
  step: number[] | null;
  operatorId: string;
  cells: CoilHCell[];                              // было: body: string
  name: string;
  mode: 'full' | 'degraded' | 'divider';
  templates: string[];                             // остаётся для translation matching
}
```

`degraded`-режим сохраняет одну `text`-ячейку с сырым фрагментом. `divider` (комментарии) — одну `text`-ячейку, как сейчас.

Рендер `CoilHTable` (новый компонент в библиотеке) получает список ячеек и рендерит:
- `modifier` — лейбл как chip/бейдж + значение (plain текст или шаблон-блок);
- `template` — курсив/блок без физических `<<>>`;
- `result-block` — таблица внутри ячейки: имя, тип, описание;
- `args-block` — список `key: value`;
- `text` — plain текст.

Перевод шаблонов через `translateTemplate` работает на уровне `CoilHValue.kind='template'` / `CoilHCell.kind='template'` — т.е. точечно, без `string.replace` по склеенному body.

**Почему.**
- Единственный способ выполнить §11.5 — передать в рендер структуру, а не форматированный текст.
- Разделение «модель данных COIL-H» ↔ «визуальный рендер» делает модель переиспользуемой: headless-потребители (sandbox сервер, потенциальные экспортёры в Markdown/HTML) могут брать те же ячейки и рендерить их по-своему.
- Тесты COIL-H становятся прозрачнее: проверяется структура ячеек, не длинная склеенная строка.
- Перевод шаблонов в диалекте перестаёт быть строковой заменой по склеенному body — он становится локальной заменой в нужной ячейке.

**Цена.**
- Перепишутся `buildSendBody`, `buildReceiveBody`, `buildThinkBody`, `buildExecuteBody`, `buildWaitBody`, `buildIfBody`, `buildRepeatBody`, `buildEachBody` и `convertNodes` в `coil-h.ts` — целиком.
- Перепишутся `coil-h.test.ts` и `coil-h-examples.test.ts` под новую структуру.
- Перепишется `CoilHPanel` / `CoilHTable` (`RightSidebar.tsx` строки 83–229) под новый рендер ячеек.
- `translateBody` в playground переписывается под ячейки.
- Сохранение совместимости невозможно: `body: string` удаляется. Потребителей `CoilHRow` снаружи пакета пока нет — ломающих внешних последствий нет.

**Что НЕ меняется.**
- Четыре колонки таблицы (§11.3): №, Оператор, Тело, Имя — остаются. Структурной становится только колонка «Тело».
- Нумерация шагов (§11.4), секционные заголовки (§11.6) — без изменений.
- Режимы `full` / `degraded` / `divider` — без изменений.

---

## I-0006 — Встраивание компонентов coil-ide в sandbox через React-«остров»

| | |
|---|---|
| **Статус** | принят как направление |
| **Решено** | 2026-04-09 |
| **Scope** | coil-sandbox/src/web/**, coil-sandbox/package.json, coil-sandbox/vite.config.ts (новый) |
| **Связан с** | I-0004 |

**Контекст.** Sandbox web-UI (`coil-sandbox/src/web/public/index.html`) — vanilla JS, сервится статикой через Express. React, Vite, Monaco в sandbox отсутствуют. Компоненты coil-ide — React 19 + Monaco + Tailwind v4. Прямое подключение через `<script>` невозможно.

Варианты:
- **A.** Полный перевод sandbox web-UI на React/Vite. Переписывается весь `index.html` (каналы, посты, threads, server switcher). Большой объём не по теме задачи интеграции.
- **B.** React-«остров»: отдельный Vite-bundle, подключаемый к существующему vanilla index.html как `<script type="module">`, React монтируется в конкретный DOM-узел, остальная страница остаётся vanilla.
- **C.** Использовать только headless-часть пакета (`astToCoilH`, parse, validate), рендерить таблицу и подсветку на vanilla с нуля. Теряется одна из целей задачи — переиспользование UI-компонентов.

**Решение.** Вариант B.

Структура:
```
coil-sandbox/
  src/web/
    public/
      index.html            — существующий vanilla-UI
      agent-viewer.js       — собранный bundle (артефакт Vite)
      agent-viewer.css
    viewer/                 — новый TS/TSX код viewer'а
      main.tsx              — entry, монтирует React в #agent-viewer-root
      AgentViewer.tsx       — использует CoilHTable и EditorPanel из пакета coil-ide
    vite.viewer.config.ts   — Vite-конфиг только для viewer-бандла
```

Сборка: добавляется npm-скрипт `build:viewer` → `vite build --config src/web/vite.viewer.config.ts`. Артефакт складывается в `src/web/public/` и раздаётся тем же Express.

Интеграция в текущий UI:
- в `index.html` добавляется `<div id="agent-viewer-root"></div>` (панель/модалка рядом с текущим контентом);
- клик на имени агента в левом sidebar (уже есть событие в vanilla JS) диспатчит кастомное событие/вызывает глобальную функцию, экспортированную из viewer-бандла, с именем агента;
- viewer запрашивает код через socket-событие `get-agent-source` (серверный контракт — в `coil-sandbox/src/web/server.ts`) и рендерит через `CoilHTable` / `EditorPanel` из пакета.

Sandbox подключает пакет coil-ide как git-зависимость в `package.json`:
```json
"coil-ide": "github:animata-systems/coil-ide"
```
Паттерн единообразен с тем, как sandbox уже потребляет `coil` и `coil-runtime`.

**Почему.**
- Не трогаем работающий vanilla-UI: минимальный риск регрессий в sandbox.
- Весь React-код изолирован одним бандлом с явной точкой входа — понятно, где кончается одно и начинается другое.
- Даёт немедленную проверку, что граница библиотеки coil-ide из I-0004 корректна: viewer — первый внешний потребитель.

**Цена.**
- В sandbox появляется второй билд-путь (Vite для viewer поверх tsc для сервера). Новый npm-скрипт, новые devDeps (`vite`, `@vitejs/plugin-react`, `tailwindcss` если viewer тянет стили из пакета).
- Размер бандла. Monaco — тяжёлый. Mitigate: ленивая загрузка viewer'а только когда пользователь открыл панель агента.
- Дисциплина: ничего не должно попадать из vanilla-страницы в React-бандл и обратно, кроме согласованного протокола событий.

---

## I-0007 — Граница библиотека ↔ playground: ядро на props, playground-обёртки на контекстах

| | |
|---|---|
| **Статус** | принят как направление |
| **Решено** | 2026-04-09 |
| **Scope** | coil-ide/src/components/EditorPanel.tsx, coil-ide/src/components/PipelineProvider.tsx, coil-ide/playground/components/** |
| **Связан с** | I-0004, I-0006, S-0001 |

**Контекст.** I-0004 декларирует, что `EditorPanel` и `PipelineProvider` попадают в библиотеку (`src/`), а `ThemeProvider`, `ExampleProvider`, `EditorTabs`, `EmptyEditor` — в playground (`playground/`). Текущая реализация этому противоречит:

- `src/components/EditorPanel.tsx:4-11` импортирует `useTheme`, `useExample`, `EditorTabs`, `EmptyEditor` — четыре playground-сущности.
- `src/components/PipelineProvider.tsx:23` импортирует `useExample` и читает `activeExample.content` / `activeExample.dialect` для автопереключения pipeline на смену примера.

Если физически переложить файлы по I-0004 без правок формы компонентов, библиотека начнёт импортировать из `../playground/`. Это (1) инверсия зависимости, (2) ломает `exports` пакета, (3) делает невозможным потребление библиотеки из sandbox (I-0006, S-0001), потому что sandbox не имеет `ExampleProvider` / `ThemeProvider` и не будет их заводить.

Дополнительное требование из I-0006: sandbox показывает код агента read-only, получает source готовой строкой через socket-событие. Ему не нужен дебаунс-pipeline, подписка на редактор и reveal-диагностик — нужен только один прогон `runPipeline` для получения `ast` → `CoilHTable` и Monaco в режиме read-only.

**Решение.** Расщепить `EditorPanel` и `PipelineProvider` по паттерну «ядро в библиотеке принимает данные через props → тонкая playground-обёртка снабжает props из playground-контекстов»:

1. **`EditorView` (библиотека, новый компонент).** Чистый Monaco-редактор. Props:
   ```ts
   interface EditorViewProps {
     value: string;
     onChange?: (value: string) => void;
     readOnly?: boolean;
     dialect: DialectTable;
     theme: 'light' | 'dark';
     diagnostics?: ValidationDiagnostic[];
     onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
   }
   ```
   Знает только: как настроить Monaco, как применить тему, как сконвертировать диагностики в markers, как переключить language при смене `dialect`. Не знает ни о вкладках, ни о примерах, ни о `PipelineProvider`.

2. **`EditorPanel` (playground, переезжает из `src/`).** Тонкая обёртка над `EditorView`. Читает `useTheme`, `useExample`, `usePipeline`. Рендерит `<EditorTabs />`, если есть открытые вкладки, иначе `<EmptyEditor />`. Передаёт `value={activeExample.content}`, `dialect=...`, `theme=resolvedTheme`, `diagnostics={pipeline.diagnostics}`, `onChange={pipeline.updateSource}`, `onMount={(ed) => pipeline.registerEditor(ed)}` в `EditorView`.

3. **`PipelineProvider` (библиотека, форма меняется).** Контекст-провайдер с core-логикой tokenize→parse→validate + debounce + registerEditor/revealDiagnostic. Больше не импортирует `useExample`. Новый API:
   ```ts
   interface PipelineProviderProps {
     source: string;
     dialect: DialectTable;
     debounceMs?: number;
     children: ReactNode;
   }
   ```
   Внутри: state инициализируется из `runPipeline(source, index, dialect)`, `useEffect` на `[source, dialect]` триггерит повторный прогон (дебаунсом). `updateSource` из `usePipeline()` остаётся для случая, когда контроллер находится внутри провайдера (playground-редактор) — он вызывает debounced-прогон и локально меняет state.

   Тонкость: «контролируемый `source` через props» + «внутренний state, меняемый через `updateSource`» — не конфликтуют, если договориться, что prop `source` задаёт **базовый** источник (например, содержимое активного примера), а `updateSource` делает локальные правки поверх. На смену `source` prop провайдер сбрасывает внутреннее значение на новое. Это ровно та модель, что работает сейчас в `useEffect([activeExample])`, только управление владельцем вынесено наружу.

4. **`PlaygroundPipelineBridge` (playground, новый, тонкий).** Читает `useExample`, рендерит `<PipelineProvider source={activeExample?.content ?? ''} dialect={...}>{children}</PipelineProvider>`. Единственный файл, который связывает playground-специфичное состояние примеров с библиотечным pipeline.

5. **Headless-путь для sandbox.** Sandbox **не использует** `PipelineProvider`. Вместо этого — чистый вызов `runPipeline(source, index, dialect)` из `coil-ide/headless` (один раз на загрузку агента), результат хранится в локальном state React-«острова». `CoilHTable` получает `rows` как prop. `EditorView` получает `value`, `readOnly=true`, `dialect`, `theme` — без `onChange`, без `onMount`, без diagnostics.

**Раскладка после расщепления (уточнение к I-0004).**

Библиотека (`coil-ide/src/`):
- `components/EditorView.tsx` (новый)
- `components/PipelineProvider.tsx` (переписан, props-based)
- `components/CoilHTable.tsx` (извлекается из `RightSidebar.tsx` отдельным шагом)
- `coil/*.ts` — pipeline utilities, coil-h, dialects, monarch, languages, themes, monaco-utils
- `index.ts`, `headless.ts` — публичные entry points

Playground (`coil-ide/playground/`):
- `components/EditorPanel.tsx` (обёртка над `EditorView`)
- `components/PlaygroundPipelineBridge.tsx` (новый)
- `components/Layout.tsx`, `Header.tsx`, `LeftSidebar.tsx`, `LeftToolbar.tsx`, `RightSidebar.tsx`, `RightToolbar.tsx`, `StatusBar.tsx`, `EditorTabs.tsx`, `NewFileDialog.tsx`, `EmptyEditor.tsx`
- `components/ExampleProvider.tsx`, `ThemeProvider.tsx`
- `components/ValidationPanel.tsx`, `CoilHPanel.tsx` (остаются в playground как обёртки над библиотечными компонентами)
- `coil/examples.ts`, `template-translations.ts`
- `App.tsx`, `main.tsx`, `index.html`

**Почему.**
- Единственный вариант, который одновременно удовлетворяет I-0004 («библиотека переиспользуема вне playground»), I-0006 / S-0001 (sandbox рендерит компоненты, не тащит playground-контексты) и не переписывает playground заново.
- Паттерн «ядро на props + тонкий bridge-компонент» стандартен для библиотечных React-компонентов и легко читаемый.
- Sandbox получает максимально простой контракт: `value` строкой, `dialect` объектом, `readOnly=true` — никакого жизненного цикла pipeline.
- Core-логика pipeline перестаёт знать про «примеры» — это чище концептуально: «пример» — playground-понятие, pipeline про него знать не должен.

**Цена.**
- Два новых файла в рамках расщепления: `EditorView.tsx` (библиотека) и `PlaygroundPipelineBridge.tsx` (playground).
- `PipelineProvider` переписывается: уходит `useExample`, появляется пара props `source` + `dialect`. Существующее поведение сохраняется, но это всё же переписывание public API провайдера.
- `EditorPanel` переписывается как тонкая обёртка. Старый effect на `activeExample` превращается в передачу `value` в `EditorView`, логика `setModelLanguage` переезжает внутрь `EditorView`.
- Визуальная регрессия playground — основной риск. Mitigate: визуальная проверка после перекладки, до расщепления `CoilHPanel` (следующий шаг).

**Что НЕ меняется.**
- Раскладка файлов, `exports`, peerDeps, vite-конфиги — по I-0004 без изменений.
- Тесты `coil-h*.test.ts` — они не зависят от React-компонентов.
- Поведение pipeline: те же tokenize→parse→validate, тот же debounce, тот же revealDiagnostic.

**Уточнение (2026-04-09, по итогам ревью расщепления).** Контракт `EditorView.dialect` сужен со `DialectTable` до `string`. Компонент использует диалект только как ключ для `ensureLanguage(key, monaco)` и `setModelLanguage(model, languageId(key))` — ни то, ни другое не нуждается в полной таблице. Выгоды: (а) потребитель передаёт просто `"ru-standard"` вместо импорта `dialectRegistry` ради одного prop'а, что критично для sandbox-остров (I-0006, S-0001); (б) контракт концептуально честнее — «имя языка для Monaco» ≠ «таблица диалекта для парсера». Цена: `EditorView` опосредованно зависит от глобального `dialectRegistry` (внутри `ensureLanguage`); расширение до кастомных диалектов, зарегистрированных потребителем, потребует либо опционального `dialectTable?: DialectTable` prop'а, либо явного параметра на `ensureLanguage`. Отложено как задача на момент, когда кастомные диалекты появятся вне библиотеки.

---

## I-0008 — Экспорт темы библиотеки через `coil-ide/theme.css`

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-09 |
| **Scope** | `src/styles/theme.css` (новый), `package.json` (exports + files), `playground/index.css`, внешние потребители (`coil-sandbox` viewer) |
| **Связан с** | I-0004, I-0005, I-0006, I-0007, S-0001 |

**Контекст.** `CoilHTable` и другие будущие библиотечные компоненты активно используют тематические Tailwind-классы (`text-foreground`, `text-primary`, `bg-primary/15`, `text-muted-foreground`, `bg-ide-panel`, `divide-foreground/5` и т.д.). В Tailwind v4 эти классы резолвятся только при наличии `@theme inline` блока, который маппит токены на CSS-переменные `--primary`, `--color-foreground`, `--color-ide-panel`. Сейчас этот блок вместе с определениями переменных живёт только в `playground/index.css` — то есть является частью **приложения playground**, а не **библиотеки coil-ide**.

Это делает библиотеку невидимо зависимой от инфраструктуры playground'а: внешний потребитель (sandbox viewer) подключает `CoilHTable` и получает компонент, у которого все классы разрешаются в «нет стиля» — визуально компонент рендерится пустым или сломанным. Обнаружилось при ревью плана интеграции sandbox viewer'а.

**Решение.** coil-ide экспортирует свою тему как отдельный CSS-файл через subpath `./theme.css`. Потребитель подключает его одной строкой из своего CSS.

**Контракт файла `coil-ide/theme.css` (новый `src/styles/theme.css`).** Содержит **только** то, что нужно, чтобы Tailwind v4 в потребителе корректно отрендерил библиотечные компоненты:

1. Определения CSS-переменных темы — `:root` (light) и `.dark` (dark). Структура — зеркало текущего `playground/index.css` (цветовая палитра, `--radius`, IDE-токены `--ide-toolbar/--ide-panel/--ide-editor/--ide-active`, semantic `--error/--warning/--info/--success`).
2. `@theme inline { ... }` блок, маппящий `--color-*`, `--font-*`, `--radius-*` на переменные — то же содержание, что уже есть в `playground/index.css`.
3. `@custom-variant dark (&:where(.dark, .dark *));` — чтобы потребитель мог активировать dark-палитру, поставив `className="dark"` на контейнер React root, не затрагивая остальную страницу.
4. **НЕ содержит** `@import 'tailwindcss'` (tailwind подключается потребителем отдельно), `@layer base { body { ... } }` (playground-специфичный body-фон), никакой playground-специфичной вёрстки.
5. Содержит `@source` директивы, указывающие Tailwind v4 JIT, где искать классы, используемые библиотечными компонентами: `@source '../components/**/*.tsx';` (sources относительно расположения `src/styles/theme.css`). После сборки библиотеки скриптом `prepare` файл копируется в `dist/theme.css`, а `@source` переписывается на `../chunks/*.js`, `../components/*.js` (или аналог — детали раскладки dist уточняются при реализации; важно, что после сборки `@source` покрывает именно то, что реально ставится в `node_modules/coil-ide/dist`).

**Экспорт в `package.json`:**
```json
"exports": {
  ".":          { "types": "./dist/index.d.ts",    "import": "./dist/index.js" },
  "./headless": { "types": "./dist/headless.d.ts", "import": "./dist/headless.js" },
  "./theme.css": "./dist/theme.css"
}
```
`files` должен включать `dist/theme.css` (если не весь `dist/` — тогда явно).

**Использование playground'ом.** `playground/index.css` перестаёт содержать дубликат переменных/`@theme inline`; вместо этого делает `@import 'coil-ide/theme.css';` после `@import 'tailwindcss';`. Playground-специфичные стили (`@layer base { body { ... } }`, body-градиент) остаются в `playground/index.css`. Эта правка — часть этой же задачи I-0008: playground и библиотека используют **один и тот же** источник темы, иначе гарантии «что playground показывает — то и sandbox покажет» нет.

**Использование потребителем (sandbox viewer).** В `coil-sandbox/src/web/viewer/viewer.css`:
```css
@import "tailwindcss";
@import "coil-ide/theme.css";
```
Контейнер React root (`<div id="agent-viewer-root">`) получает `className="dark"` при монтировании — sandbox однотемный dark, и это активирует dark-палитру только в пределах viewer-поддерева, не затрагивая vanilla-страницу sandbox'а.

**Почему.**

- *Концептуальная цельность.* Тема компонентов — неотъемлемая часть библиотеки, а не инфраструктуры приложения. Без темы компоненты не работают — значит тема должна ехать с ними. Сейчас тема живёт в playground из исторических причин (до появления первого внешнего потребителя такой необходимости не было), это технический долг.
- *Минимальная правка contract-surface.* Один новый subpath export, один импорт у потребителя, один рефакторинг playground'а. Никаких изменений в React API компонентов.
- *Единый источник истины.* Playground и sandbox рендерят `CoilHTable` из одной палитры. Любое изменение темы в будущем — одна правка в `src/styles/theme.css`, оба потребителя получают обновление автоматически.
- *Tailwind v4 `@source` механика снимает необходимость в config-файлах потребителя.* Потребителю не нужно знать путь до `node_modules/coil-ide/dist` и руками прописывать content paths — `@source` в самом theme.css делает это изнутри.

**Цена.**

- Нужна небольшая доработка build-пайплайна coil-ide, чтобы `src/styles/theme.css` попал в `dist/theme.css` с правильным `@source` путём. Варианты: (а) vite-плагин `copy`, (б) npm-скрипт `cp src/styles/theme.css dist/theme.css` в `build:lib`, (в) два разных файла — source-копия для playground dev (`@source '../components/**/*.tsx'`) и dist-копия для production (`@source './chunks/*.js'`). Рекомендуемый путь — (б)+(в): проще всего держать два файла — `src/styles/theme.dev.css` (для playground `@import '../../src/styles/theme.dev.css'`) и `src/styles/theme.css` (для потребителей, с `@source` на `./**/*.js` — резолвится относительно финального места в `dist/`). Финальное решение принимается при реализации, главное что контракт subpath-экспорта соблюдён.
- Playground тоже трогаем — это риск визуальной регрессии. Mitigate: после правки playground `npm run dev` + визуальная проверка.
- Интеграция sandbox-потребителя блокируется до того момента, пока coil-ide не закоммитил и не запушил новую версию и sandbox `package.json` не подтянул обновлённый git ref.

**Альтернативы, которые отвергнуты.**

- *Дубликат темы в `coil-sandbox/src/web/viewer/viewer.css`.* Просто скопировать `:root`/`.dark`/`@theme inline` из `playground/index.css`. Минус: жёсткое дублирование, любое изменение палитры в coil-ide молча расходится с sandbox, никто не заметит до визуальной регрессии. Концептуально неверно — sandbox не должен знать внутренние токены библиотеки.
- *Переписать компоненты coil-ide на инлайн-стили / CSS-модули.* Правильный архитектурный рефакторинг, но масштаб сильно больше — трогает каждый компонент, лишает Tailwind-утилит. Вне scope этой задачи.
- *Компонентная инициализация темы через JS (компонент сам инжектит `<style>` в `document.head`).* Работает, но ломает серверный рендеринг, конфликтует с Vite CSS-обработкой и делает невозможным статический анализ используемых классов. Отвергнуто.

**Что должно остаться истинным после применения.**

- Playground визуально идентичен тому, что был до правки (палитра, фон, отступы).
- sandbox viewer рендерит `CoilHTable` и другие библиотечные компоненты в dark-теме без визуальных регрессий.
- Сторонний потребитель библиотеки может подключить тему одной строкой `@import 'coil-ide/theme.css';` без знания внутреннего устройства `node_modules/coil-ide/dist`.
- `.dark` scope локализован через `&:where(.dark, .dark *)` и не затрагивает ДОМ за пределами элемента с классом.

---

## I-0009 — Markdown-рендеринг шаблонов в COIL-H через `marked` + `DOMPurify`

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/components/CoilHTable.tsx`, `coil-ide/package.json` |
| **Связан с** | I-0005 |

**Контекст.** Шаблоны в COIL часто содержат промпты и сообщения для агентов/людей. Эти тексты естественно используют Markdown: списки инструкций, `code`-фрагменты, **акценты**, ссылки. COIL-H рендерит ячейки `{ kind: 'template' }` и `{ value.kind: 'template' }` (I-0005) как plain-text — пользователь видит сырую разметку вместо форматированного контента, что снижает читаемость.

Рассмотрены три варианта:

- **A. `marked` + `DOMPurify`** (~12KB + 8KB gzip). MD→HTML строка, санитайз, `dangerouslySetInnerHTML`. Быстрый, лёгкий, production-grade.
- **B. `react-markdown`** (~50KB gzip). MD→React-элементы напрямую. Нативный для React, но в 2.5 раза тяжелее и тянет remark + unified + rehype. Для ячеек IDE-таблицы — избыточен.
- **C. Custom subset-парсер** (0 deps). Ручной MD-парсер для базового подмножества. Tech debt: поддержка своего парсера, неизбежные баги на edge cases.

**Решение.** Вариант A.

Новые `dependencies` в `package.json`: `marked`, `dompurify`. Типы: `@types/dompurify` в `devDependencies`.

Пайплайн рендеринга в `TemplateBlock`:
```
text → renderTemplate(text) → marked.parse(translated) → DOMPurify.sanitize(html) → dangerouslySetInnerHTML
```

`CoilHTable` получает новый необязательный prop `markdownTemplates?: boolean` (default `true`). При `false` — текущее plain-text поведение. Переключатель живёт в playground-обёртке `CoilHPanel`, не в библиотечном компоненте.

CSS для MD-контента внутри ячеек: Tailwind prose-классы не используются (избыточны, тянут `@tailwindcss/typography`). Вместо этого — scoped CSS через класс `.coil-h-md` с минимальными стилями для `h1`–`h6`, `ul`/`ol`, `code`, `pre`, `a`, `strong`, `em`. Стили добавляются в `src/styles/theme.css` (I-0008), чтобы потребители автоматически их получили.

**Почему.**

- Минимальный размер бандла — критично для sandbox React-острова (I-0006).
- `DOMPurify` обязателен: шаблоны содержат пользовательский текст, XSS-вектор реален.
- `dangerouslySetInnerHTML` безопасен в паре с DOMPurify — стандартный паттерн.
- Prop `markdownTemplates` даёт потребителю контроль: sandbox может рендерить MD, headless-потребитель игнорирует (он не рендерит React вообще).

**Цена.**

- Две новые runtime-зависимости. Это первые внешние deps помимо `coil`/`coil-runtime`. Допустимо: оба пакета стабильны, без транзитивов.
- `dangerouslySetInnerHTML` — точка аудита. Mitigation: DOMPurify + JSDoc-комментарий на компоненте.
- CSS для `.coil-h-md` нужно поддерживать в sync с темой (I-0008).

---

## I-0010 — COIL-H: сегментированные ссылки и навигация по декларациям

| | |
|---|---|
| **Статус** | принят как направление |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/coil/coil-h.ts`, `coil-ide/src/components/CoilHTable.tsx`, `coil-ide/src/styles/theme.css` |
| **Связан с** | I-0005, I-0009 |

**Контекст.** COIL-H маппинг (I-0005) проектирует структурные ячейки (`modifier`, `template`, `result-block`, `args-block`, `text`), но внутри ячеек ссылки сведены к плоским строкам: `templateToText()` объединяет `TextPart` и `RefPart` в одну строку; `buildSendCells` форматирует `@name` как `plain('@name')`. Рендерер `CoilHTable` не различает текст и ссылки — кликнуть и перейти к декларации невозможно.

AST полностью сохраняет типизацию: `RefPart` в шаблонах, `ParticipantRef`/`ToolRef`/`ChannelRef`/`PromiseRef`/`StreamRef` вне шаблонов, `TypedRef { kind: 'literal' | 'dynamic' }` для статических и динамических ссылок. Информация теряется при маппинге в `CoilHCell`.

**Решение.** Добавить сегментированное представление содержимого ячеек и индекс деклараций.

### Новые типы

```typescript
export interface CoilHRef {
  sigil: '$' | '@' | '!' | '#' | '?' | '~';
  name: string;
  path: string[];
  dynamic: boolean;               // @$name → true
  targetStep: number[] | null;    // step where declared; null = unresolved/external
}

export type CoilHSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; ref: CoilHRef };
```

### Изменения в существующих типах

| Тип | Было | Стало |
|---|---|---|
| `CoilHCell.kind='template'` | `{ text: string }` | `{ segments: CoilHSegment[] }` |
| `CoilHValue.kind='template'` | `{ text: string }` | `{ segments: CoilHSegment[] }` |
| `CoilHValue` | `'plain' \| 'template'` | `'plain' \| 'template' \| 'ref'` (новый: типизированная ссылка) |
| `CoilHCell.kind='args-block'` | `args: { key: string; value: string }[]` | `args: { key: string; value: CoilHSegment[] }[]` |

Новый `CoilHValue.kind='ref'` — для типизированных ссылок в модификаторах вне шаблонов (`КОМУ @analyst`, `ЧЕРЕЗ $model`, `НА ?result`, `ИСПОЛЬЗУЯ !search`).

### Индекс деклараций

`astToCoilH()` в первом проходе строит `Map<string, number[]>`:

| Источник | Ключ |
|---|---|
| Оператор с `name` | `$<name>` |
| `ActorsNode.names[]` | `@<name>` |
| `ToolsNode.names[]` | `!<name>` |
| `DefineNode.name` | `$<name>` |
| `SetNode.target` | `$<target.name>` |
| `WaitNode.name` (если есть) | оператор, на чей результат ждут |

`CoilHRef.targetStep` заполняется из индекса. Вложенные операторы получают иерархический step (`[5, 2]`).

### Динамические ссылки

`@$assignee` → `CoilHRef { sigil: '@', name: 'assignee', dynamic: true, targetStep: [step где $assignee объявлен] }`.

Рендер: статический `@` badge + кликабельный `$assignee` (ведёт к декларации переменной). Штриховой underline — индикатор «цель определяется в runtime».

`#channel/$segment` → два сегмента: literal `channel` (нелинкуемый текст `#channel/`) + dynamic `$segment` (линк на переменную).

### Навигация в CoilHTable

- Строки таблицы получают `id="step-{step.join('.')}"`.
- Ref-сегменты рендерятся как `<a href="#step-N.M" class="coil-h-ref coil-h-ref--{kind}">`.
- CSS: `:target` pseudo-class подсвечивает строку-цель.
- `onClick` на ссылке вызывает `scrollIntoView({ behavior: 'smooth', block: 'center' })` для плавной навигации.

### Взаимодействие с I-0009 (Markdown)

MD рендерится только на текстовых сегментах. Чтобы не терять markdown-контекст на границе ref-сегмента (пример: `**bold $ref bold**`), используется двухпроходный рендер: полный текст с UUID-placeholder'ами для ссылок → `marked.parse` → замена placeholder'ов на `<a>` HTML.

### Помощник обратной совместимости

```typescript
export function segmentsToText(segments: CoilHSegment[]): string {
  return segments.map(s => s.kind === 'text' ? s.text : `${s.ref.sigil}${s.ref.name}${s.ref.path.map(f => `.${f}`).join('')}`).join('');
}
```

Заменяет старый `templateToText()` для потребителей, которым нужна плоская строка. Поле `CoilHRow.templates` (для translation matching) строится через `segmentsToText`.

**Почему.**

- Единственный способ сделать ссылки кликабельными — передать их структуру из AST через COIL-H в рендерер. Плоские строки этого не позволяют.
- Индекс деклараций — проекция AST, не runtime-состояние. Соответствует принципу «COIL-H — проекция для чтения».
- Headless-потребители получают `CoilHRef` и могут строить свою навигацию (Markdown-экспорт с `[link](#anchor)`, accessibility, etc.).
- `segmentsToText` обеспечивает обратную совместимость для translation matching.

**Цена.**

- Все `build*Cells` функции в `coil-h.ts` переписываются: от `plain(text)` / `templateToText()` к сегментированному представлению. ~15 функций.
- Тесты `coil-h.test.ts` (777 строк) и `coil-h-examples.test.ts` (161 строк) переписываются под сегменты. Механически, но объёмно.
- `CoilHTable.tsx` усложняется: `TemplateBlock`, `ValueView`, `ArgsBlock` рендерят сегменты вместо строк. Новые компоненты `RefLink` и `SegmentView`.
- CSS для ref-стилей и `:target` — новые стили в `theme.css` (I-0008).
- **I-0009 (MD) зависит от I-0010**: markdown-рендеринг проектируется под сегментированную модель, не под плоские строки. Порядок реализации: сначала I-0010, потом I-0009.

---

## I-0011 — COIL-H: уточнения к I-0010 после Фазы 1

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/coil/coil-h.ts`, `coil-ide/src/components/CoilHTable.tsx`, `coil-ide/src/coil/coil-h*.test.ts` |
| **Связан с** | I-0005, I-0010 |

**Контекст.** Фаза 1 STORY-018 реализовала сегментированные ссылки по I-0010. В ходе работы всплыло несколько точек, которые I-0010 прямо не фиксирует: как представлять модификаторы с **массивом** типизированных ссылок (`FOR @a, @b`, `USING !x, !y`, `AS $p1, $p2`, `ON ?a, ?b`), как представлять **литеральные каналы** без декларации, и каким должен быть формат `row.name` для именованных операторов, чтобы инвариант `targetStep` оставался состоятельным.

I-0010 задал `CoilHValue.kind='ref'` только для одиночных типизированных ссылок (`КОМУ @analyst`, `ЧЕРЕЗ $model`). Попытка представить массив через `kind='template'` с `, `-разделителями смешивала семантики: templates в I-0005 — это блоки свободного текста с подстановками, которые в I-0009 получают Markdown-рендер. Списки ссылок — не шаблоны; MD над ними бессмысленен, а двухпроходный MD-рендер в Фазе 3 потерял бы структуру.

**Решение.**

1. **Новый вид `CoilHValue.kind='refs'`:**
   ```ts
   export type CoilHValue =
     | { kind: 'plain'; text: string }
     | { kind: 'template'; segments: CoilHSegment[] }
     | { kind: 'ref'; ref: CoilHRef }
     | { kind: 'refs'; refs: CoilHRef[] };
   ```

2. **Правило применения (маппинг AST → `CoilHValue`):**

   | AST-поле | Вид значения |
   |---|---|
   | `ValueRef`, `ToolRef`, `ParticipantRef`, `PromiseRef`, `StreamRef` (одиночный) | `kind='ref'` |
   | `ValueRef[]`, `ToolRef[]`, `ParticipantRef[]`, `PromiseRef[]` (массив, даже из одного) | `kind='refs'` |
   | `TemplateNode` | `kind='template'` |
   | Scalar / policy / duration / literal channel | `kind='plain'` |

   «Single collapses to ref» для multi-ref полей **отменяется**: один элемент в массиве — это всё равно `refs` с одним элементом. Это сохраняет форму AST и даёт унифицированный путь рендера.

3. **Поля-одиночки остаются `kind='ref'`:**
   - `ThinkNode.via` → `ref`
   - `ExecuteNode.tool` → `ref`
   - `EachNode.from` → `ref`

4. **Литеральный `ChannelRef` → `kind='plain'` временно:**
   Пока в языке нет оператора декларации каналов, `TO #main` резолвить некуда. Литеральный канал идёт как `plain('#main')`. Каналы с динамическими сегментами (`TO #$route/$sub`) остаются `kind='template'` с сегментами — `$var` часть должна оставаться кликабельной. В `buildSendCells` стоит TODO: когда появится декларация каналов, перевести на `kind='ref'` с `sigil='#'` и заполненным `targetStep`.

5. **Формат `row.name` — унифицированный префикс-сигил:**
   Все именованные операторы кладут в `row.name` строку вида `<sigil><name>` (`$step`, `~updates`, `$config.mode`). Затрагивает: `Op.Receive`, `Op.Send` (если name задан), `Op.Wait` (если name задан) — ранее у них `row.name` был без префикса. Для анонимных операторов `row.name === ''`.

   Это необходимо для инварианта I-0010: при резолве ссылки `targetStep` указывает на row, в котором `row.name` должен совпадать с `<sigil><name>` ссылки. Без префикса сопоставление ломается на первой же `RECEIVE` / именованной `SEND`.

6. **Индексация деклараций — правила для граничных случаев:**
   - `Op.Each` регистрирует `$element` на **своей** row — вложенные операторы резолвят `$item` в step EACH. Альтернатива «на первой nested row» семантически неверна: переменная цикла объявляется в заголовке.
   - `Op.Set` регистрирует `$target.name` **только если имя ещё не в индексе** (first-wins). Настоящую декларацию делает `DEFINE`; `SET` мутирует существующую привязку.
   - `Op.Signal` регистрирует `~stream.name` (first-wins). Повторные `SIGNAL` на тот же стрим считаются эмиссиями, не декларациями.
   - Path `ValueRef` при индексации игнорируется: `SET $config.mode` индексирует `$config`, а не `$config.mode`. Ссылка `$config.mode` в шаблоне всё равно резолвится через ключ `$config`.

**Почему.**

- **`refs` vs `template`**: сохраняет концептуальную цельность (I-0005 — ячейка несёт одну семантику; шаблон с MD и список ссылок — разные семантики). Упрощает Фазу 3: MD рендерится только над `template`; `refs` рендерятся отдельным путём (`refs.map(<RefLink/>)`, разделитель локализуется в рендере).
- **Single → `refs` без коллапса**: убирает скрытую ветку в рендере и тестах, совпадает с формой AST (всегда массив).
- **Channel literal → `plain`**: декларация каналов не существует, `targetStep` был бы всегда `null` — отдельный `kind='ref'` добавил бы веткление без выгоды. Переход на `ref` — отдельное решение, когда появится `CHANNEL`.
- **Унифицированный `row.name` с сигилом**: инвариант I-0010 требует симметрии между ключом индекса (`$name`, `~name`, `@name`) и `row.name` row'а-цели. Без этого нельзя валидировать правильность навигации через тесты.
- **EACH в индексе на своей row**: `$item` существует в scope цикла и объявляется в заголовке EACH — row EACH является правильной целью декларации.
- **SET first-wins**: соответствует семантике «SET — мутация, DEFINE — декларация». Переопределение скрыло бы точку объявления.

**Цена.**

- Расширение `CoilHValue` с трёх видов до четырёх: потребителям нужна новая ветка. Сейчас это `CoilHTable.ValueView` (добавлена) и тесты (обновлены).
- `refs`-семантика для полей с одним участником (`FOR @user`) визуально немного избыточна — в рендере Фазы 2 нужен дополнительный путь, хотя и простой.
- `row.name` с сигилом — лёгкое breaking-изменение внутреннего формата: `Op.Receive.name` теперь `$name`, что повлияло бы на потребителей, сравнивающих `row.name` с голыми именами. На текущий момент таких потребителей нет.
- TODO по каналам-литералам требует не забыть перевести их на `ref`, когда/если появится `CHANNEL`. Риск мал — TODO стоит в `buildSendCells`.

---

## I-0012 — CoilHTable: рендер ref-сегментов и naming convention CSS

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/components/CoilHTable.tsx`, `coil-ide/src/styles/theme.css` |
| **Связан с** | I-0008, I-0010, I-0011 |

**Контекст.** I-0010 проектирует кликабельные ref-ссылки в COIL-H, но не фиксирует, как рендерить три краевых случая, которые всплыли при декомпозиции Фазы 2 STORY-018:

1. **Unresolved-ссылки** (`targetStep === null`). Возникают для имён, которые не объявлены (форвард-ref, опечатка автора, внешние ссылки в фрагментарных примерах).
2. **Динамические ссылки** (`@$assignee`, `!$tool`). I-0010 говорит «статический `@` badge + кликабельный `$assignee`» — это можно реализовать как один `<a>` или как два визуальных элемента.
3. **CSS-классы по типу ссылки.** Естественное именование `.coil-h-ref--$` / `--@` / `--!` использует символы sigil напрямую. В CSS такие имена требуют экранирования (`.coil-h-ref--\\$`), плохо ищутся в коде и DevTools, и легко ломаются при копировании через инструменты, не сохраняющие escape.

**Решение.**

1. **Unresolved → `<span class="coil-h-ref coil-h-ref--unresolved">`** (без anchor). Текст визуально отличим (например, серый), но элемент не имеет ссылочной семантики и не кликается. `<a>` без `href` отвергнут — теряется a11y. `<a href="#" onClick={preventDefault}>` отвергнут — лишний поведенческий слой и ложная affordance клика.

2. **Dynamic → один `<a>` с двойным классом** (`coil-h-ref coil-h-ref--{kind} coil-h-ref--dynamic`). Текст ссылки целый (`@$assignee`), `href` указывает на декларацию `$assignee` (через `targetStep`, который для динамической ссылки резолвится через `$`-имя — см. I-0010 § Динамические ссылки). Визуальное отличие — штриховой `text-decoration` через CSS на `--dynamic`. Split на badge + link отвергнут: больше DOM, два tab-стопа, тот же UX.

3. **Naming convention CSS-классов** — смысловые имена по типу ссылки, не sigil-символы:

   | Sigil | Class suffix |
   |---|---|
   | `$` | `--ref` |
   | `@` | `--participant` |
   | `!` | `--tool` |
   | `#` | `--channel` |
   | `?` | `--promise` |
   | `~` | `--stream` |

   Модификаторы: `--dynamic` (штриховой underline), `--unresolved` (серый, без underline и без клика).

**Почему.**

- **Unresolved как `<span>`**: рендер не должен врать о наличии цели. Если `targetStep === null`, то клик никуда не ведёт — корректнее не показывать affordance ссылки совсем. Семантически это «упомянутое имя без места объявления».
- **Dynamic как один `<a>`**: I-0010 описывает визуальный эффект (штриховой underline на `$`-части) — это достижимо CSS поверх единого элемента. Меньше DOM, проще навигация с клавиатуры, тот же визуальный результат.
- **Смысловые имена классов**: `.coil-h-ref--participant` ищется в коде через grep, читается в DevTools без расшифровки, не требует CSS-escape. Связь sigil → суффикс однозначна и описана в данной DESIGN-записи.

**Цена.**

- Дополнительный mapping `Sigil → classSuffix` в `RefLink` — небольшая таблица (6 строк).
- Документация связи sigil → suffix живёт здесь, не в коде. При добавлении нового sigil (если когда-нибудь) — обновить и mapping, и таблицу выше.
- Smoke-тесты `CoilHTable.test.tsx` (зависят от наличия `@testing-library/react`) — если библиотека не подключена, нужна новая `devDependency`. Цена минимальна, но фиксирует потребителя для коллег.

---

## I-0013 — COIL-H: индексация promise-имён (`?<name>`)

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/coil/coil-h.ts` (`buildDeclarationIndex`) |
| **Связан с** | I-0010, I-0011 |

**Контекст.** В Фазе 2 STORY-018 визуальная проверка обнаружила, что ссылки `?promise` в `WAIT ON ?security_review` рендерятся как unresolved, хотя `?security_review` — это handle для уже задекларированного `Op.Think $security_review`. Индекс по правилам I-0011 пишет только `$<name>`, не `?<name>` — поэтому лукап `?security_review` промахивается.

В семантике COIL у именованного оператора есть **два** связанных идентификатора:

- `$<name>` — значение результата (доступно после завершения операции);
- `?<name>` — promise/handle (то, на что можно ждать в `WAIT ON`, и то, чей `<name>` совпадает с именем породившего оператора).

Индекс должен отражать обе стороны.

**Решение.** При индексации операторов, которые имеют поле `name` и тем самым декларируют именованную операцию, добавлять одновременно ключи `$<name>` **и** `?<name>` (оба на ту же row).

Касается:
- `Op.Receive` (всегда имеет `name`);
- `Op.Think` (всегда имеет `name`);
- `Op.Execute` (всегда имеет `name`);
- `Op.Send` (только если `name` присутствует);
- `Op.Wait` (только если `name` присутствует).

Не меняет:
- `Op.Define`, `Op.Set` — `$`-имена-данные, без promise-стороны.
- `Op.Signal` — индексирует `~<name>` (стрим), отдельный namespace.
- `Op.Actors`, `Op.Tools` — индексируют `@<name>` / `!<name>`, отдельные namespaces.

Правило first-wins из I-0011 сохраняется: повторное упоминание имени не перезаписывает первое.

**Почему.**

- Соответствует ментальной модели COIL: именованная операция — это «значение + promise», у обоих один источник, на который и ведёт навигация.
- Делает `WAIT ON ?ref` навигируемым в COIL-H, что было исходной целью I-0010.
- Стоимость минимальна — одна доп. строка на каждый case в `indexNodes`.
- Альтернатива «оставить `?ref` unresolved» отвергнута: визуально честно, но прагматически бесполезно — пользователь видит `?ref` и хочет перейти к породившему `THINK`/`EXECUTE`. Других целей у promise-ссылки в COIL-H нет.

**Цена.**

- Дублирование ключей на одну row — `Map` хранит обе записи, обе указывают на одинаковый `step[]`. Память — пренебрежимо.
- Если в будущем появится оператор с самостоятельной декларацией promise (не привязанной к именованной операции) — правило придётся пересмотреть. Сейчас такого нет.

---

## I-0014 — COIL-H: segment-aware translation hook (вместо `renderTemplate`)

| | |
|---|---|
| **Статус** | принят |
| **Дата** | 2026-04-14 |
| **Scope** | `coil-ide/src/components/CoilHTable.tsx`, `coil-ide/src/utils/render-markdown.ts` (Фаза 3) |
| **Связан с** | I-0007, I-0009, I-0010 |

**Контекст.** До Фазы 2 `CoilHTableProps` имел prop `renderTemplate?: (text: string) => string` — string-level transform для перевода mock-фрагментов на текущий диалект (см. I-0007). После перехода шаблонов на `CoilHSegment[]` (I-0010) string-level callback несовместим: применить его к плоскому тексту = уничтожить границы ref-сегментов. В Фазе 2 prop сохранён в типе для backward compat, но фактически игнорируется в `TemplateBlock` — это регрессия playground-перевода.

**Решение.** В Фазе 3, одновременно с введением Markdown-рендера (I-0009), заменить API на segment-aware вариант:

```ts
interface CoilHTableProps {
  /** @deprecated since Phase 2 — use renderTextSegment instead. */
  renderTemplate?: (text: string) => string;

  /** Applied to each text-segment before rendering / Markdown processing.
   *  Identity by default. */
  renderTextSegment?: (text: string) => string;
}
```

Поведение:
- `SegmentView` пропускает `text`-сегменты через `renderTextSegment` перед выводом.
- В Markdown-pipeline (I-0009) `renderTextSegment` применяется к плоской строке **до** `marked.parse`, по тем же правилам что и translation-hook сегодня (text → text).
- Старый `renderTemplate` сохраняется в типе один цикл (deprecation), не вызывается. Удаляется после миграции playground (отдельная задача).

**Почему.**

- Переводы и MD одинаково работают на text-сегментах — единый pipeline.
- Ref-границы сохраняются: hook не видит ref-сегментов, и не может их повредить.
- Единое решение для I-0009 и регрессии I-0007 — один пункт миграции в Фазе 3.

**Цена.**

- Playground (`CoilHPanel`) нужно мигрировать: переименовать `renderTemplate` → `renderTextSegment`. Mock-логика та же.
- В переходный период два prop'а в типе — нагрузка на чтение API. Удаление `renderTemplate` после миграции — отдельный коммит.
