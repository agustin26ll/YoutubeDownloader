import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/folder-picker.css?inline";
import { pickFolder } from "../services/api-bridge.js";

export class FolderPicker extends LitElement {
    static properties = {
        path: { type: String },
    };

    static styles = css([styles]);

    async _handleBrowse() {
        const result = await pickFolder();

        if (!result.success) return;

        this.path = result.path;
        this.dispatchEvent(
            new CustomEvent("folder-changed", {
                detail: { path: this.path },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        return html`
            <div class="picker">
                <span class="folder-icon">📁</span>
                <span class="path" title=${this.path}>${this.path || "Selecciona una carpeta"}</span>
                <button @click=${this._handleBrowse}>Examinar</button>
            </div>
        `;
    }
}

customElements.define("folder-picker", FolderPicker);