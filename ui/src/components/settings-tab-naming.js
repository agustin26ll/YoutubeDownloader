import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/settings-tab-naming.css?inline";
import { t } from "../i18n/index.js";

import { previewFilename, updateNamingExpression } from "../services/api-bridge.js";

const AVAILABLE_TOKENS = [
    { token: "{title}", desc: "Título limpio" },
    { token: "{original_title}", desc: "Título original de YouTube" },
    { token: "{artist}", desc: "Artista (o canal si no hay artista)" },
    { token: "{channel}", desc: "Nombre del canal" },
    { token: "{duration}", desc: "Duración (m:ss)" },
];

const MODIFIERS = [
    { mod: ":upper", desc: "MAYÚSCULAS" },
    { mod: ":lower", desc: "minúsculas" },
    { mod: ":title", desc: "Primera Mayúscula" },
];

const PREVIEW_DEBOUNCE_MS = 300;
const SAVE_CONFIRMATION_DISPLAY_MS = 2000;

export class SettingsTabNaming extends LitElement {
    static properties = {
        expression: { type: String },
        preview: { type: String, state: true },
        saved: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.expression = "";
        this.preview = "";
        this.saved = false;
        this._debounceTimer = null;
    }

    updated(changedProps) {
        if (changedProps.has("expression") && this.expression) {
            this._updatePreview();
        }
    }

    _handleInput(e) {
        this.expression = e.target.value;
        this.saved = false;
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this._updatePreview(), PREVIEW_DEBOUNCE_MS);
    }

    async _updatePreview() {
        const result = await previewFilename(this.expression);
        this.preview = result.filename;
    }

    async _handleSave() {
        await updateNamingExpression(this.expression);
        this.saved = true;
        setTimeout(() => (this.saved = false), SAVE_CONFIRMATION_DISPLAY_MS);
    }

    _insertToken(token) {
        this.expression = `${this.expression}${token}`;
        this.saved = false;
        this._updatePreview();
    }

    render() {
        return html`
            <div class="tab-content">
                <label>${t("settings.naming.label")}</label>
                <input
                    type="text"
                    .value=${this.expression}
                    @input=${this._handleInput}
                    placeholder="{artist} - {title:title}"
                />

                <div class="preview">
                    <span class="preview-label">${t("settings.naming.preview_label")}</span>
                    <span class="preview-value">${this.preview || "..."}.mp4</span>
                </div>

                <div class="tokens-section">
                    <p class="section-title">${t("settings.naming.tokens_title")}</p>
                    <div class="chips">
                        ${AVAILABLE_TOKENS.map(
                            (t) => html`
                                <button class="chip" title=${t.desc} @click=${() => this._insertToken(t.token)}>
                                    ${t.token}
                                </button>
                            `
                        )}
                    </div>
                </div>

                <div class="tokens-section">
                    <p class="section-title">${t("settings.naming.modifiers_title")}</p>
                    <div class="chips">
                        ${MODIFIERS.map(
                            (m) => html`<span class="chip static" title=${m.desc}>${m.mod}</span>`
                        )}
                    </div>
                </div>

                <button class="save-btn" @click=${this._handleSave}>
                    ${this.saved ? t("settings.naming.saved") : t("settings.naming.save")}
                </button>
            </div>
        `;
    }
}

customElements.define("settings-tab-naming", SettingsTabNaming);