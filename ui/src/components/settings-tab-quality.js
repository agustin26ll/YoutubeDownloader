import { LitElement, html } from "lit";
import "./settings-toggle-option.js";
import { t } from "../i18n/index.js";

import { updateAutoMaxQuality } from "../services/api-bridge.js";

export class SettingsTabQuality extends LitElement {
    static properties = {
        autoMaxQuality: { type: Boolean },
    };

    createRenderRoot() {
        return this;
    }

    async _handleChange(e) {
        await updateAutoMaxQuality(e.detail.value);
        window.dispatchEvent(
            new CustomEvent("settings-updated", { detail: { auto_max_quality: e.detail.value } })
        );
    }

    render() {
        return html`
            <settings-toggle-option
                .value=${this.autoMaxQuality}
                optionOffLabel=${t("settings.quality.manual_title")}
                optionOffDesc=${t("settings.quality.manual_desc")}
                optionOnLabel=${t("settings.quality.auto_title")}
                optionOnDesc=${t("settings.quality.auto_desc")}
                @value-changed=${this._handleChange}
            ></settings-toggle-option>
        `;
    }
}

customElements.define("settings-tab-quality", SettingsTabQuality);