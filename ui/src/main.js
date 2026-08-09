import "./styles/global.css";
import "./app-root.js";
import { pywebviewReady } from "./services/bridge-ready.js";
import { setLocale } from "./i18n/index.js";

async function bootstrap() {
    await pywebviewReady();

    try {
        const settings = await window.pywebview.api.get_settings();
        setLocale(settings.resolved_locale);
    } catch {
       
    }

    const root = document.createElement("app-root");
    document.getElementById("app").appendChild(root);
}

bootstrap();