import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/settings-tab-language.css?inline";
import { t } from "../i18n/index.js";
import { updateLanguage } from "../services/api-bridge.js";

export class SettingsTabLanguage extends LitElement {
    static properties = {
        language: { type: String },
    };

    static styles = css([styles]);

    async _handleChange(e) {
        await updateLanguage(e.target.value);
        window.location.reload();
    }

    render() {
        return html`
            <label>${t("settings.language.title")}</label>
            <select @change=${this._handleChange}>
                <option value="auto" ?selected=${this.language === "auto"}>${t("settings.language.auto_label")}</option>
                <option value="es" ?selected=${this.language === "es"}>${t("settings.language.es_label")}</option>
                <option value="en" ?selected=${this.language === "en"}>${t("settings.language.en_label")}</option>
            </select>
            <p class="notice">${t("settings.language.reload_notice")}</p>
        `;
    }
}

customElements.define("settings-tab-language", SettingsTabLanguage);