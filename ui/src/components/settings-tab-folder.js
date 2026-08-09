import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/settings-tab-folder.css?inline";
import { t } from "../i18n/index.js";

import {
    updateFolderMode,
    updateCreateSubfolder,
    getDefaultDirectory,
    previewSubfolder,
    openFolder,
} from "../services/api-bridge.js";

export class SettingsTabFolder extends LitElement {
    static properties = {
        folderMode: { type: String },
        createSubfolder: { type: Boolean },
        videoDefaultPath: { type: String, state: true },
        audioDefaultPath: { type: String, state: true },
        subfolderName: { type: String, state: true },
    };

    static styles = css([styles]);

    async connectedCallback() {
        super.connectedCallback();
        const video = await getDefaultDirectory(false);
        const audio = await getDefaultDirectory(true);
        this.videoDefaultPath = video.path;
        this.audioDefaultPath = audio.path;
        await this._refreshSubfolderPreview();
    }

    async _refreshSubfolderPreview() {
        const result = await previewSubfolder();
        this.subfolderName = result.name;
    }

    async _select(mode) {
        if (mode === this.folderMode) return;
        this.folderMode = mode;
        await updateFolderMode(mode);
        window.dispatchEvent(new CustomEvent("settings-updated", { detail: { folder_mode: mode } }));
    }

    async _handleSubfolderToggle(e) {
        this.createSubfolder = e.target.checked;
        await updateCreateSubfolder(this.createSubfolder);
        window.dispatchEvent(new CustomEvent("settings-updated", { detail: { create_subfolder: this.createSubfolder } }));
    }

    _openPath(path) {
        openFolder(path);
    }

    get _baseForPreview() {
        return this.folderMode === "manual" ? "carpeta seleccionada" : "Videos / Música";
    }

    render() {
        return html`
            <div class="options">
                <label class="option ${this.folderMode === "default" ? "selected" : ""}">
                    <input type="radio" name="folder-mode" ?checked=${this.folderMode === "default"} @change=${() => this._select("default")} />
                    <div class="option-body">
                        <p class="option-title">${t("settings.folder.default_title")}</p>
                        <p class="path-row">${t("settings.folder.videos_label")} <a @click=${() => this._openPath(this.videoDefaultPath)}>${this.videoDefaultPath}</a></p>
                        <p class="path-row">${t("settings.folder.audios_label")} <a @click=${() => this._openPath(this.audioDefaultPath)}>${this.audioDefaultPath}</a></p>
                    </div>
                </label>

                <label class="option ${this.folderMode === "manual" ? "selected" : ""}">
                    <input type="radio" name="folder-mode" ?checked=${this.folderMode === "manual"} @change=${() => this._select("manual")} />
                    <div class="option-body">
                        <p class="option-title">${t("settings.folder.manual_title")}</p>
                        <p class="option-desc">${t("settings.folder.manual_desc")}</p>
                    </div>
                </label>
            </div>

            <label class="checkbox-row">
                <input type="checkbox" ?checked=${this.createSubfolder} @change=${this._handleSubfolderToggle} />
                <span>${t("settings.folder.subfolder_checkbox")}</span>
            </label>

            ${this.createSubfolder ? html
                `<p class="subfolder-preview">
                    ${t("settings.folder.subfolder_preview_prefix")} ${this._baseForPreview} / <strong>${this.subfolderName}</strong> /
                </p>` : ""
            }
        `;
    }
}

customElements.define("settings-tab-folder", SettingsTabFolder);