import es from "./es.json";

const LOCALES = { es };
const DEFAULT_LOCALE = "es";

export function t(key, locale = DEFAULT_LOCALE) {
    const messages = LOCALES[locale] ?? {};
    const value = key.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), messages);
    return typeof value === "string" ? value : key;
}