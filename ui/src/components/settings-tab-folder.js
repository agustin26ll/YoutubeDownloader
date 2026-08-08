import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/settings-tab-folder.css?inline";
import { updateFolderMode, getDefaultDirectory, openFolder } from "../services/api-bridge.js";

export class SettingsTabFolder extends LitElement {
    static properties = {
        folderMode: { type: String },
        videoDefaultPath: { type: String, state: true },
        audioDefaultPath: { type: String, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.videoDefaultPath = "";
        this.audioDefaultPath = "";
    }

    async connectedCallback() {
        super.connectedCallback();
        const video = await getDefaultDirectory(false);
        const audio = await getDefaultDirectory(true);
        this.videoDefaultPath = video.path;
        this.audioDefaultPath = audio.path;
    }

    async _select(mode) {
        if (mode === this.folderMode) return;

        this.folderMode = mode;
        await updateFolderMode(mode);

        window.dispatchEvent(
            new CustomEvent("settings-updated", { detail: { folder_mode: mode } })
        );
    }

    _openPath(path) {
        openFolder(path);
    }

    render() {
        return html`
            <div class="options">
                <label class="option ${this.folderMode === "default" ? "selected" : ""}">
                    <input
                        type="radio"ked
                        name="folder-mode"
                        ?checked=${this.folderMode === "default"}
                        @change=${() => this._select("default")}
                    />
                    <div class="option-body">
                        <p class="option-title">Carpeta predeterminada</p>
                        <p class="path-row">
                            Los videos se guardan en:
                            <a @click=${() => this._openPath(this.videoDefaultPath)}>${this.videoDefaultPath}</a>
                        </p>
                        <p class="path-row">
                            Los audios se guardan en:
                            <a @click=${() => this._openPath(this.audioDefaultPath)}>${this.audioDefaultPath}</a>
                        </p>
                    </div>
                </label>

                <label class="option ${this.folderMode === "manual" ? "selected" : ""}">
                    <input
                        type="radio"
                        name="folder-mode"
                        ?checked=${this.folderMode === "manual"}
                        @change=${() => this._select("manual")}
                    />
                    <div class="option-body">
                        <p class="option-title">Seleccionar carpeta</p>
                        <p class="option-desc">
                            Elige la carpeta manualmente desde el botón "Examinar" en el inicio de la app.
                        </p>
                    </div>
                </label>
            </div>
        `;
    }
}

customElements.define("settings-tab-folder", SettingsTabFolder);