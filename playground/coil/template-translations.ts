/**
 * Mocked template translations for built-in examples.
 * Key: trimmed plain-text of template (templateToText(tpl).trim()).
 * Language determined by dialect prefix: ru-* → ru, en-* → en.
 * If no translation found → show original text.
 */

export interface TemplateLang {
  en: string;
  ru: string;
}

export type TranslationMap = Record<string, Record<string, TemplateLang>>;

export const TEMPLATE_TRANSLATIONS: TranslationMap = {
  // ── hello (en-standard) ───────────────────────────────
  hello: {
    'What is your name?': {
      en: 'What is your name?',
      ru: 'Как тебя зовут?',
    },
    'Hello, $name!': {
      en: 'Hello, $name!',
      ru: 'Привет, $name!',
    },
  },

  // ── hello-ru (ru-matrix) ──────────────────────────────
  'hello-ru': {
    'Как тебя зовут?': {
      en: 'What is your name?',
      ru: 'Как тебя зовут?',
    },
    'Привет, $имя!': {
      en: 'Hello, $имя!',
      ru: 'Привет, $имя!',
    },
  },

  // ── routing (ru-standard) ─────────────────────────────
  routing: {
    'Опишите ваш запрос.': {
      en: 'Describe your request.',
      ru: 'Опишите ваш запрос.',
    },
    'Вы опытный специалист по обслуживанию клиентов,\nзанимающийся общими запросами.': {
      en: 'You are an experienced customer service specialist\nhandling general inquiries.',
      ru: 'Вы опытный специалист по обслуживанию клиентов,\nзанимающийся общими запросами.',
    },
    'Вы специалист по обслуживанию клиентов, специализирующийся\nна запросах на возврат средств. Следуйте политике компании\nи собирайте необходимую информацию.': {
      en: 'You are a customer service specialist specializing\nin refund requests. Follow company policy\nand collect the necessary information.',
      ru: 'Вы специалист по обслуживанию клиентов, специализирующийся\nна запросах на возврат средств. Следуйте политике компании\nи собирайте необходимую информацию.',
    },
    'Вы специалист технической поддержки с глубокими знаниями продукта.\nСосредоточьтесь на чётком пошаговом устранении неполадок.': {
      en: 'You are a technical support specialist with deep product knowledge.\nFocus on clear step-by-step troubleshooting.',
      ru: 'Вы специалист технической поддержки с глубокими знаниями продукта.\nСосредоточьтесь на чётком пошаговом устранении неполадок.',
    },
    'Классифицируйте запрос клиента.': {
      en: 'Classify the customer request.',
      ru: 'Классифицируйте запрос клиента.',
    },
    '$response.answer\n\nКлассификация: $classification.type ($classification.reasoning)': {
      en: '$response.answer\n\nClassification: $classification.type ($classification.reasoning)',
      ru: '$response.answer\n\nКлассификация: $classification.type ($classification.reasoning)',
    },
  },

  // ── prompt-chaining (ru-standard) ─────────────────────
  'prompt-chaining': {
    'Опишите продукт или услугу для маркетингового текста.': {
      en: 'Describe the product or service for marketing copy.',
      ru: 'Опишите продукт или услугу для маркетингового текста.',
    },
    'Ты маркетолог по контенту. Создавай тексты, которые продают:\nпосты, лендинги, рекламные объявления. Пиши ясно, убедительно\nи ориентируясь на целевую аудиторию.': {
      en: 'You are a content marketer. Create texts that sell:\nposts, landing pages, ads. Write clearly, persuasively\nand targeting the audience.',
      ru: 'Ты маркетолог по контенту. Создавай тексты, которые продают:\nпосты, лендинги, рекламные объявления. Пиши ясно, убедительно\nи ориентируясь на целевую аудиторию.',
    },
    'Ты специалист по сравнительной лингвистике. Объясняй различия\nмежду языками, переводами и языковыми конструкциями.': {
      en: 'You are a comparative linguistics specialist. Explain differences\nbetween languages, translations, and linguistic structures.',
      ru: 'Ты специалист по сравнительной лингвистике. Объясняй различия\nмежду языками, переводами и языковыми конструкциями.',
    },
    'Напишите убедительный маркетинговый текст.\nСосредоточьтесь на преимуществах и эмоциональном воздействии.': {
      en: 'Write persuasive marketing copy.\nFocus on benefits and emotional impact.',
      ru: 'Напишите убедительный маркетинговый текст.\nСосредоточьтесь на преимуществах и эмоциональном воздействии.',
    },
    'Оцените рекламный текст по критериям качества.': {
      en: 'Evaluate the ad copy against quality criteria.',
      ru: 'Оцените рекламный текст по критериям качества.',
    },
    'Перепишите маркетинговый текст, устранив слабые места\nпо результатам оценки.': {
      en: 'Rewrite the marketing copy, addressing weaknesses\nidentified in the evaluation.',
      ru: 'Перепишите маркетинговый текст, устранив слабые места\nпо результатам оценки.',
    },
    'Призыв к действию: $quality_metrics.has_call_to_action\nЭмоциональное воздействие: $quality_metrics.emotional_appeal\nЯсность: $quality_metrics.clarity': {
      en: 'Call to action: $quality_metrics.has_call_to_action\nEmotional appeal: $quality_metrics.emotional_appeal\nClarity: $quality_metrics.clarity',
      ru: 'Призыв к действию: $quality_metrics.has_call_to_action\nЭмоциональное воздействие: $quality_metrics.emotional_appeal\nЯсность: $quality_metrics.clarity',
    },
    '$improved.text\n\nМетрики до улучшения:\n- Призыв к действию: $quality_metrics.has_call_to_action\n- Эмоциональное воздействие: $quality_metrics.emotional_appeal\n- Ясность: $quality_metrics.clarity': {
      en: '$improved.text\n\nMetrics before improvement:\n- Call to action: $quality_metrics.has_call_to_action\n- Emotional appeal: $quality_metrics.emotional_appeal\n- Clarity: $quality_metrics.clarity',
      ru: '$improved.text\n\nМетрики до улучшения:\n- Призыв к действию: $quality_metrics.has_call_to_action\n- Эмоциональное воздействие: $quality_metrics.emotional_appeal\n- Ясность: $quality_metrics.clarity',
    },
    '$draft.text\n\nМетрики:\n- Призыв к действию: $quality_metrics.has_call_to_action\n- Эмоциональное воздействие: $quality_metrics.emotional_appeal\n- Ясность: $quality_metrics.clarity': {
      en: '$draft.text\n\nMetrics:\n- Call to action: $quality_metrics.has_call_to_action\n- Emotional appeal: $quality_metrics.emotional_appeal\n- Clarity: $quality_metrics.clarity',
      ru: '$draft.text\n\nМетрики:\n- Призыв к действию: $quality_metrics.has_call_to_action\n- Эмоциональное воздействие: $quality_metrics.emotional_appeal\n- Ясность: $quality_metrics.clarity',
    },
  },

  // ── parallelization (ru-standard) ─────────────────────
  parallelization: {
    'Отправьте код на ревью.': {
      en: 'Submit code for review.',
      ru: 'Отправьте код на ревью.',
    },
    'Вы эксперт в области безопасности кода. Сосредоточьтесь на выявлении\nуязвимостей безопасности, рисков внедрения кода и проблем аутентификации.': {
      en: 'You are a code security expert. Focus on identifying\nsecurity vulnerabilities, injection risks, and authentication issues.',
      ru: 'Вы эксперт в области безопасности кода. Сосредоточьтесь на выявлении\nуязвимостей безопасности, рисков внедрения кода и проблем аутентификации.',
    },
    'Вы эксперт в области производительности кода. Сосредоточьтесь на выявлении\nузких мест производительности, утечек памяти и возможностей оптимизации.': {
      en: 'You are a code performance expert. Focus on identifying\nperformance bottlenecks, memory leaks, and optimization opportunities.',
      ru: 'Вы эксперт в области производительности кода. Сосредоточьтесь на выявлении\nузких мест производительности, утечек памяти и возможностей оптимизации.',
    },
    'Вы эксперт в области качества кода. Сосредоточьтесь на структуре кода,\nчитаемости и соблюдении лучших практик.': {
      en: 'You are a code quality expert. Focus on code structure,\nreadability, and adherence to best practices.',
      ru: 'Вы эксперт в области качества кода. Сосредоточьтесь на структуре кода,\nчитаемости и соблюдении лучших практик.',
    },
    'Вы технический руководитель, подводите итоги нескольких проверок кода.': {
      en: 'You are a tech lead, summarizing multiple code reviews.',
      ru: 'Вы технический руководитель, подводите итоги нескольких проверок кода.',
    },
    'Проверьте код на уязвимости безопасности.': {
      en: 'Check the code for security vulnerabilities.',
      ru: 'Проверьте код на уязвимости безопасности.',
    },
    'Проверьте код на проблемы производительности.': {
      en: 'Check the code for performance issues.',
      ru: 'Проверьте код на проблемы производительности.',
    },
    'Проверьте качество кода.': {
      en: 'Check code quality.',
      ru: 'Проверьте качество кода.',
    },
    'Объедините результаты проверок кода в краткое резюме\nс указанием ключевых действий.': {
      en: 'Combine the code review results into a brief summary\nwith key action items.',
      ru: 'Объедините результаты проверок кода в краткое резюме\nс указанием ключевых действий.',
    },
    'Безопасность: $security_review\nПроизводительность: $performance_review\nКачество кода: $quality_review': {
      en: 'Security: $security_review\nPerformance: $performance_review\nCode quality: $quality_review',
      ru: 'Безопасность: $security_review\nПроизводительность: $performance_review\nКачество кода: $quality_review',
    },
    '$summary.summary\n\nДействия: $summary.action_items': {
      en: '$summary.summary\n\nActions: $summary.action_items',
      ru: '$summary.summary\n\nДействия: $summary.action_items',
    },
  },

  // ── evaluator-optimizer (ru-standard) ──────────────────
  'evaluator-optimizer': {
    'Введите текст для перевода.': {
      en: 'Enter text for translation.',
      ru: 'Введите текст для перевода.',
    },
    'На какой язык перевести?': {
      en: 'Which language to translate to?',
      ru: 'На какой язык перевести?',
    },
    'Ты эксперт по литературному переводу.': {
      en: 'You are a literary translation expert.',
      ru: 'Ты эксперт по литературному переводу.',
    },
    'Ты эксперт по оценке литературных переводов.': {
      en: 'You are a literary translation evaluation expert.',
      ru: 'Ты эксперт по оценке литературных переводов.',
    },
    'Переведите текст на $target_language,\nсохраняя тон и культурные нюансы.': {
      en: 'Translate the text into $target_language,\npreserving tone and cultural nuances.',
      ru: 'Переведите текст на $target_language,\nсохраняя тон и культурные нюансы.',
    },
    'Оцените качество перевода.': {
      en: 'Evaluate the translation quality.',
      ru: 'Оцените качество перевода.',
    },
    'Оригинал: $message\nПеревод: $current_translation': {
      en: 'Original: $message\nTranslation: $current_translation',
      ru: 'Оригинал: $message\nПеревод: $current_translation',
    },
    'Улучшите перевод на основе замечаний.': {
      en: 'Improve the translation based on feedback.',
      ru: 'Улучшите перевод на основе замечаний.',
    },
    'Оригинал: $message\nТекущий перевод: $current_translation': {
      en: 'Original: $message\nCurrent translation: $current_translation',
      ru: 'Оригинал: $message\nТекущий перевод: $current_translation',
    },
    'Проблемы: $evaluation.specific_issues\nПредложения: $evaluation.improvement_suggestions': {
      en: 'Issues: $evaluation.specific_issues\nSuggestions: $evaluation.improvement_suggestions',
      ru: 'Проблемы: $evaluation.specific_issues\nПредложения: $evaluation.improvement_suggestions',
    },
  },

  // ── internal-delegation (ru-standard) ──────────────────
  'internal-delegation': {
    'Опишите функцию для реализации.': {
      en: 'Describe the function to implement.',
      ru: 'Опишите функцию для реализации.',
    },
    'Ты старший архитектор ПО. Планируй реализацию функций.': {
      en: 'You are a senior software architect. Plan feature implementations.',
      ru: 'Ты старший архитектор ПО. Планируй реализацию функций.',
    },
    'Ты эксперт по созданию новых файлов.\nСледуй лучшим практикам и паттернам проекта.': {
      en: 'You are an expert in creating new files.\nFollow best practices and project patterns.',
      ru: 'Ты эксперт по созданию новых файлов.\nСледуй лучшим практикам и паттернам проекта.',
    },
    'Ты эксперт по модификации существующего кода.\nСохраняй консистентность и избегай регрессий.': {
      en: 'You are an expert in modifying existing code.\nMaintain consistency and avoid regressions.',
      ru: 'Ты эксперт по модификации существующего кода.\nСохраняй консистентность и избегай регрессий.',
    },
    'Ты эксперт по безопасному удалению кода.\nУбедись, что нет сломанных зависимостей.': {
      en: 'You are an expert in safe code deletion.\nEnsure there are no broken dependencies.',
      ru: 'Ты эксперт по безопасному удалению кода.\nУбедись, что нет сломанных зависимостей.',
    },
    'Проанализируй запрос на реализацию функции\nи создай план реализации.': {
      en: 'Analyze the feature request\nand create an implementation plan.',
      ru: 'Проанализируй запрос на реализацию функции\nи создай план реализации.',
    },
    'Реализуй изменение для файла.': {
      en: 'Implement the file change.',
      ru: 'Реализуй изменение для файла.',
    },
    'Файл: $task.file_path\nНазначение: $task.purpose\nТип изменения: $task.change_type': {
      en: 'File: $task.file_path\nPurpose: $task.purpose\nChange type: $task.change_type',
      ru: 'Файл: $task.file_path\nНазначение: $task.purpose\nТип изменения: $task.change_type',
    },
    'Общая задача: $message\nПлан: $plan': {
      en: 'Overall task: $message\nPlan: $plan',
      ru: 'Общая задача: $message\nПлан: $plan',
    },
    'План: $plan\nРеализация завершена.': {
      en: 'Plan: $plan\nImplementation complete.',
      ru: 'План: $plan\nРеализация завершена.',
    },
  },

  // ── multi-agent-orchestration (ru-standard) ────────────
  'multi-agent-orchestration': {
    'Опишите функцию для реализации.': {
      en: 'Describe the function to implement.',
      ru: 'Опишите функцию для реализации.',
    },
    'Проанализируй запрос на реализацию функции\nи создай план реализации.\n\nЗапрос: $message': {
      en: 'Analyze the feature request\nand create an implementation plan.\n\nRequest: $message',
      ru: 'Проанализируй запрос на реализацию функции\nи создай план реализации.\n\nЗапрос: $message',
    },
    'Извлеки структурированный план из ответа архитектора.': {
      en: 'Extract a structured plan from the architect\'s response.',
      ru: 'Извлеки структурированный план из ответа архитектора.',
    },
    'Создай файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message': {
      en: 'Create file: $task.file_path\nPurpose: $task.purpose\n\nTask context: $message',
      ru: 'Создай файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message',
    },
    'Модифицируй файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message': {
      en: 'Modify file: $task.file_path\nPurpose: $task.purpose\n\nTask context: $message',
      ru: 'Модифицируй файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message',
    },
    'Удали файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message': {
      en: 'Delete file: $task.file_path\nPurpose: $task.purpose\n\nTask context: $message',
      ru: 'Удали файл: $task.file_path\nНазначение: $task.purpose\n\nКонтекст задачи: $message',
    },
    'Реализация завершена.\nПлан: $parsed_plan': {
      en: 'Implementation complete.\nPlan: $parsed_plan',
      ru: 'Реализация завершена.\nПлан: $parsed_plan',
    },
  },

  // ── everything-in-one-think (en-standard) ──────────────
  'everything-in-one-think': {
    'Classify the customer request, pick the right specialist,\ndraft a response, check quality, and if the quality is poor —\nrevise the response. Return only the final answer.': {
      en: 'Classify the customer request, pick the right specialist,\ndraft a response, check quality, and if the quality is poor —\nrevise the response. Return only the final answer.',
      ru: 'Классифицируйте запрос клиента, выберите подходящего специалиста,\nсоставьте ответ, проверьте качество, и если качество низкое —\nпересмотрите ответ. Верните только финальный ответ.',
    },
  },

  // ── missing-wait (en-standard) ─────────────────────────
  'missing-wait': {
    'Here is your plan: $plan.steps\nTimeline: $plan.timeline': {
      en: 'Here is your plan: $plan.steps\nTimeline: $plan.timeline',
      ru: 'Вот ваш план: $plan.steps\nСроки: $plan.timeline',
    },
  },

  // ── think-for-deterministic-check (en-standard) ────────
  'think-for-deterministic-check': {
    'Determine whether the score exceeds 80.': {
      en: 'Determine whether the score exceeds 80.',
      ru: 'Определите, превышает ли оценка 80.',
    },
    'Score: $evaluation.score': {
      en: 'Score: $evaluation.score',
      ru: 'Оценка: $evaluation.score',
    },
  },

  // ── send-when-think-needed (en-standard) ───────────────
  'send-when-think-needed': {
    'Classify this customer request into one of:\nbug, feature, or question.\n\nRequest: $message': {
      en: 'Classify this customer request into one of:\nbug, feature, or question.\n\nRequest: $message',
      ru: 'Классифицируй этот запрос клиента как одно из:\nбаг, фича или вопрос.\n\nЗапрос: $message',
    },
  },
};

/**
 * Get language code from dialect name.
 * ru-* → 'ru', en-* → 'en'.
 */
export function dialectLang(dialectName: string): 'en' | 'ru' {
  return dialectName.startsWith('ru') ? 'ru' : 'en';
}

/**
 * Translate a template text for a given example and dialect.
 * Returns translated text or original if no translation found.
 */
export function translateTemplate(
  exampleId: string,
  originalText: string,
  dialectName: string,
): string {
  const exampleTranslations = TEMPLATE_TRANSLATIONS[exampleId];
  if (!exampleTranslations) return originalText;
  const entry = exampleTranslations[originalText];
  if (!entry) return originalText;
  const lang = dialectLang(dialectName);
  return entry[lang] ?? originalText;
}
