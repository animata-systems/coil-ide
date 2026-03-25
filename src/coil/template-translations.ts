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
    '$response.answer\n\nКлассификация: $classification.type ($classification.reasoning)': {
      en: '$response.answer\n\nClassification: $classification.type ($classification.reasoning)',
      ru: '$response.answer\n\nКлассификация: $classification.type ($classification.reasoning)',
    },
  },

  // ── prompt-chaining (ru-standard) ─────────────────────
  'prompt-chaining': {
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
    '$summary.summary\n\nДействия: $summary.action_items': {
      en: '$summary.summary\n\nActions: $summary.action_items',
      ru: '$summary.summary\n\nДействия: $summary.action_items',
    },
  },

  // ── evaluator-optimizer (ru-standard) ──────────────────
  // Only template: "$current_translation" — pure variable, no translatable text

  // ── internal-delegation (ru-standard) ──────────────────
  'internal-delegation': {
    'План: $plan\nРеализация завершена.': {
      en: 'Plan: $plan\nImplementation complete.',
      ru: 'План: $plan\nРеализация завершена.',
    },
  },

  // ── multi-agent-orchestration (ru-standard) ────────────
  'multi-agent-orchestration': {
    'Реализация завершена.\nПлан: $parsed_plan': {
      en: 'Implementation complete.\nPlan: $parsed_plan',
      ru: 'Реализация завершена.\nПлан: $parsed_plan',
    },
  },

  // ── everything-in-one-think (en-standard) ──────────────
  // Only template: "$everything.answer" — pure variable, no translatable text

  // ── missing-wait (en-standard) ─────────────────────────
  'missing-wait': {
    'Here is your plan: $plan.steps\nTimeline: $plan.timeline': {
      en: 'Here is your plan: $plan.steps\nTimeline: $plan.timeline',
      ru: 'Вот ваш план: $plan.steps\nСроки: $plan.timeline',
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
