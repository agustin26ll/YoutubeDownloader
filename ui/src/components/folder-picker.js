import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/folder-picker.css?inline";
import { t } from "../i18n/index.js";

import {
    pickFolder,
    openFolder,
    checkFolderExists,
    createFolder
} from "../services/api-bridge.js";

export class FolderPicker extends LitElement {
    static properties = {
        path: { type: String },
        editable: { type: Boolean },
        folderMissing: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.editable = true;
        this.folderMissing = false;
    }

    updated(changedProps) {
        if (changedProps.has("path") && this.path) {
            this.checkNow();
        }
    }

    async checkNow() {
        const result = await checkFolderExists(this.path);
        this.folderMissing = !result.exists;
        this._notifyReadiness();
        return !this.folderMissing;
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
                <span class="path" title=${t("folder_picker.open_tooltip")} @click=${this._handleOpenFolder}>
                    ${this.path || t("folder_picker.select_hint")}
                </span>
                ${this.editable ? html`<button @click=${this._handleBrowse}>${t("folder_picker.browse")}</button>` : ""}
            </div>
            ${this.folderMissing
                ? html`
          <p class="warning">
              ⚠ ${t("folder_picker.missing_warning")}
              <a @click=${this._handleRecreate}>${t("folder_picker.recreate_link")}</a>
              ${this.editable ? t("folder_picker.or_select_other") : ""}
          </p>`
                : ""}
        `;
    }
}

customElements.define("folder-picker", FolderPicker);