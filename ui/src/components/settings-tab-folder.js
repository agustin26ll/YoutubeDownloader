import { LitElement, html, css } from "lit";
import "./settings-toggle-option.js";
import { updateAskFolderAlways } from "../services/api-bridge.js";

export class SettingsTabFolder extends LitElement {
    static properties = {
        askFolderAlways: { type: Boolean },
    };

    createRenderRoot() {
        return this;
    }

    async _handleChange(e) {
        await updateAskFolderAlways(e.detail.value);
    }

    render() {
        return html`
            <settings-toggle-option
                .value=${this.askFolderAlways}
                optionOffLabel="Usar carpeta predeterminada"
                optionOffDesc="Descarga siempre en la carpeta configurada, sin preguntar."
                optionOnLabel="Preguntar siempre"
                optionOnDesc="Antes de cada descarga, se abrirá el explorador para elegir carpeta."
                @value-changed=${this._handleChange}
            ></settings-toggle-option>
        `;
    }
}

customElements.define("settings-tab-folder", SettingsTabFolder);