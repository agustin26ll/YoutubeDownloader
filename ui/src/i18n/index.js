import es from "./es.json";
import en from "./en.json";

const LOCALES = { es, en };
let currentLocale = "es";

export function setLocale(locale) {
    if (LOCALES[locale]) currentLocale = locale;
}

export function getLocale() {
    return currentLocale;
}

export function t(key) {
    const messages = LOCALES[currentLocale] ?? {};
    const value = key.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), messages);
    return typeof value === "string" ? value : key;
}