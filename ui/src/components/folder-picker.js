import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/folder-picker.css?inline";
import { pickFolder, openFolder, checkFolderExists, createFolder } from "../services/api-bridge.js";

export class FolderPicker extends LitElement {
    static properties = {
        path: { type: String },
        folderMissing: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.folderMissing = false;
    }

    async checkNow() {
        const result = await checkFolderExists(this.path);
        this.folderMissing = !result.exists;
        this._notifyReadiness();
        return !this.folderMissing;
    }

    updated(changedProps) {
        if (changedProps.has("path") && this.path) {
            this.checkNow();
        }
    }

    _notifyReadiness() {
        this.dispatchEvent(
            new CustomEvent("folder-status", {
                detail: { ready: !this.folderMissing },
                bubbles: true,
                composed: true,
            })
        );
    }

    async _handleBrowse() {
        const result = await pickFolder();
        if (!result.success) return;

        this.path = result.path;
        this.folderMissing = false;
        this._notifyReadiness();
        this.dispatchEvent(
            new CustomEvent("folder-changed", {
                detail: { path: this.path },
                bubbles: true,
                composed: true,
            })
        );
    }

    async _handleRecreate() {
        const result = await createFolder(this.path);
        if (!result.success) return;

        this.folderMissing = false;
        this._notifyReadiness();
    }

    async _handleOpenFolder() {
        if (!this.path || this.folderMissing) return;
        await openFolder(this.path);
    }

    render() {
        return html`
            <div class="picker">
                <span class="folder-icon">📁</span>
                <span class="path" title="Abrir en el Explorador" @click=${this._handleOpenFolder}>
                    ${this.path || "Selecciona una carpeta"}
                </span>
                <button @click=${this._handleBrowse}>Examinar</button>
            </div>
            ${this.folderMissing
                ? html`
                      <p class="warning">
                          ⚠ Esta carpeta ya no existe.
                          <a @click=${this._handleRecreate}>Crearla de nuevo</a>
                          o selecciona otra.
                      </p>
                  `
                : ""}
        `;
    }
}

customElements.define("folder-picker", FolderPicker);