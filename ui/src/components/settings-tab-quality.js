import { LitElement, html } from "lit";
import "./settings-toggle-option.js";
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
    }

    render() {
        return html`
            <settings-toggle-option
                .value=${this.autoMaxQuality}
                optionOffLabel="Seleccionar siempre"
                optionOffDesc="Muestra el panel de calidades para elegir en cada descarga."
                optionOnLabel="Máxima calidad automática"
                optionOnDesc="Descarga directo en la mejor calidad disponible, sin preguntar."
                @value-changed=${this._handleChange}
            ></settings-toggle-option>
        `;
    }
}

customElements.define("settings-tab-quality", SettingsTabQuality);