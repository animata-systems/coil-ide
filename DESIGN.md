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
| **Связан с** | STORY-015, правило `.claude/rules/submodule-autonomy.md` |

**Контекст.** STORY-015 требует, чтобы компоненты coil-ide были доступны из coil-sandbox для показа кода агентов. Правило `submodule-autonomy.md` запрещает `../` пути между подмодулями — единственный способ подключения — git-зависимость в `package.json` (как сейчас `coil` и `coil-runtime` через I-0001/R-0013).

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
| **Связан с** | STORY-015 фаза 3, `coil/spec/11-coil-h.md` §11.5 |

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
| **Связан с** | STORY-015 фаза 5, I-0004 |

**Контекст.** Sandbox web-UI (`coil-sandbox/src/web/public/index.html`) — vanilla JS, сервится статикой через Express. React, Vite, Monaco в sandbox отсутствуют. Компоненты coil-ide — React 19 + Monaco + Tailwind v4. Прямое подключение через `<script>` невозможно.

Варианты:
- **A.** Полный перевод sandbox web-UI на React/Vite. Переписывается весь `index.html` (каналы, посты, threads, server switcher). Большой объём не по теме story.
- **B.** React-«остров»: отдельный Vite-bundle, подключаемый к существующему vanilla index.html как `<script type="module">`, React монтируется в конкретный DOM-узел, остальная страница остаётся vanilla.
- **C.** Использовать только headless-часть пакета (`astToCoilH`, parse, validate), рендерить таблицу и подсветку на vanilla с нуля. Теряется одна из целей story — переиспользование UI-компонентов.

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
- viewer запрашивает код через новое socket-событие `get-agent-source` (фаза 4) и рендерит через `CoilHTable` / `EditorPanel` из пакета.

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
| **Связан с** | STORY-015 фаза 2, I-0004, I-0006, S-0001 |

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
- `components/CoilHTable.tsx` (извлечь из `RightSidebar.tsx` в Фазе 3)
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
- Два новых файла в Фазе 2: `EditorView.tsx` (библиотека) и `PlaygroundPipelineBridge.tsx` (playground).
- `PipelineProvider` переписывается: уходит `useExample`, появляется пара props `source` + `dialect`. Существующее поведение сохраняется, но это всё же переписывание public API провайдера.
- `EditorPanel` переписывается как тонкая обёртка. Старый effect на `activeExample` превращается в передачу `value` в `EditorView`, логика `setModelLanguage` переезжает внутрь `EditorView`.
- Визуальная регрессия playground — основной риск. Mitigate: визуальная проверка после перекладки, до расщепления `CoilHPanel` (Фаза 3).

**Что НЕ меняется.**
- Раскладка файлов, `exports`, peerDeps, vite-конфиги — по I-0004 без изменений.
- Тесты `coil-h*.test.ts` — они не зависят от React-компонентов.
- Поведение pipeline: те же tokenize→parse→validate, тот же debounce, тот же revealDiagnostic.

**Уточнение (2026-04-09, по итогам Фазы 2 ревью).** Контракт `EditorView.dialect` сужен со `DialectTable` до `string`. Компонент использует диалект только как ключ для `ensureLanguage(key, monaco)` и `setModelLanguage(model, languageId(key))` — ни то, ни другое не нуждается в полной таблице. Выгоды: (а) потребитель передаёт просто `"ru-standard"` вместо импорта `dialectRegistry` ради одного prop'а, что критично для sandbox-остров (I-0006, S-0001); (б) контракт концептуально честнее — «имя языка для Monaco» ≠ «таблица диалекта для парсера». Цена: `EditorView` опосредованно зависит от глобального `dialectRegistry` (внутри `ensureLanguage`); расширение до кастомных диалектов, зарегистрированных потребителем, потребует либо опционального `dialectTable?: DialectTable` prop'а, либо явного параметра на `ensureLanguage`. Отложено как задача на момент, когда кастомные диалекты появятся вне библиотеки.
