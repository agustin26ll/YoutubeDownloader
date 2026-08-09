import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/home-view.css?inline";
import "../components/url-search-bar.js";
import "../components/video-preview-card.js";
import "../components/download-options-panel.js";
import "../components/folder-picker.js";
import "../components/format-toggle.js";
import "../components/download-progress-bar.js";
import "../components/filename-input.js";
import { t } from "../i18n/index.js";

import {
    getVideoInfo,
    getSettings,
    getDefaultDirectory,
    downloadVideo,
    previewFilename,
    previewSubfolder
} from "../services/api-bridge.js";
import { pywebviewReady } from "../services/bridge-ready.js";

const SUCCESS_DISPLAY_DELAY_MS = 700;

export class HomeView extends LitElement {
    static properties = {
        loading: { type: Boolean, state: true },
        downloading: { type: Boolean, state: true },
        error: { type: String, state: true },
        downloadSuccess: { type: Boolean, state: true },
        video: { type: Object, state: true },
        videoOptions: { type: Array, state: true },
        audioOptions: { type: Array, state: true },
        mode: { type: String, state: true },
        selectedIndex: { type: Number, state: true },
        folderMode: { type: String, state: true },
        customDirectory: { type: String, state: true },
        defaultDirectory: { type: String, state: true },
        autoMaxQuality: { type: Boolean, state: true },
        customFilename: { type: String, state: true },
        subfolderPreview: { type: String, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.loading = false;
        this.downloading = false;
        this.error = null;
        this.downloadSuccess = false;
        this.video = null;
        this.videoOptions = [];
        this.audioOptions = [];
        this.mode = "video";
        this.selectedIndex = 0;
        this.folderMode = "default";
        this.customDirectory = "";
        this.defaultDirectory = "";
        this.autoMaxQuality = false;
        this._handleSettingsUpdated = this._handleSettingsUpdated.bind(this);
        this.customFilename = "";
        this.subfolderPreview = null;
    }

    async connectedCallback() {
        super.connectedCallback();
        this.addEventListener("search", this._handleSearch);
        this.addEventListener("option-selected", this._handleOptionSelected);
        this.addEventListener("folder-changed", this._handleFolderChanged);
        this.addEventListener("mode-changed", this._handleModeChanged);
        window.addEventListener("settings-updated", this._handleSettingsUpdated);
        this.addEventListener("filename-changed", this._handleFilenameChanged);

        this._loadSettings();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("search", this._handleSearch);
        this.removeEventListener("option-selected", this._handleOptionSelected);
        this.removeEventListener("folder-changed", this._handleFolderChanged);
        this.removeEventListener("mode-changed", this._handleModeChanged);
        window.removeEventListener("settings-updated", this._handleSettingsUpdated);
        this.removeEventListener("filename-changed", this._handleFilenameChanged);
    }

    // HANDLERS

    // Handler de actualización de configuración, para actualizar el estado de la vista cuando se cambian las configuraciones globales.

    async _handleSettingsUpdated(e) {
        const { folder_mode, auto_max_quality, create_subfolder } = e.detail;

        if (folder_mode !== undefined) {
            this.folderMode = folder_mode;
            await this._refreshDefaultDirectory();
        }

        if (auto_max_quality !== undefined) {
            this.autoMaxQuality = auto_max_quality;
            this._applyQualityDefault();
        }

        if (create_subfolder !== undefined) {
            await this._refreshSubfolderPreview();
        }
    }

    // Carga de configuración inicial

    async _loadSettings() {
        await pywebviewReady();
        const settings = await getSettings();
        this.folderMode = settings.folder_mode;
        this.customDirectory = settings.custom_directory;
        this.autoMaxQuality = settings.auto_max_quality;
        this._applyQualityDefault();
        await this._refreshDefaultDirectory();
    }

    // Actualiza el directorio por defecto si el modo de carpeta es "default"

    async _refreshDefaultDirectory() {
        if (this.folderMode !== "default") return;
        const result = await getDefaultDirectory(this.mode === "audio");
        this.defaultDirectory = result.path;
    }

    async _refreshSubfolderPreview() {
        if (!this.video) {
            this.subfolderPreview = null;
            return;
        }
        const result = await previewSubfolder();
        this.subfolderPreview = result.enabled ? result.name : null;
    }

    // Handler de búsqueda de video, que se activa cuando el usuario ingresa una URL y presiona Enter.

    _handleSearch = async (e) => {
        this.loading = true;
        this.error = null;
        this.downloadSuccess = false;
        this.video = null;

        const result = await getVideoInfo(e.detail.url);

        this.loading = false;

        if (!result.success) {
            this.error = result.error;
            return;
        }

        this.video = result.video;
        this.videoOptions = result.video_options;
        this.audioOptions = result.audio_options;
        this.mode = "video";
        this._applyQualityDefault();

        const preview = await previewFilename(null);
        this.customFilename = preview.filename;
        await this._refreshSubfolderPreview();
    };

    _handleOptionSelected = (e) => {
        this.selectedIndex = e.detail.index;
    };

    _handleModeChanged = async (e) => {
        this.mode = e.detail.mode;
        this._applyQualityDefault();
        await this._refreshDefaultDirectory();
    };

    _handleFolderChanged = (e) => {
        this.customDirectory = e.detail.path;
    };

    _handleDownload = async () => {
        const picker = this.renderRoot.querySelector("folder-picker");
        const ready = picker ? await picker.checkNow() : true;
        if (!ready) return;

        this.downloading = true;
        this.error = null;
        this.downloadSuccess = false;

        const result = await downloadVideo(
            this.selectedIndex,
            this._outputDirectory,
            this.mode === "audio",
            this.customFilename.trim()
        );

        if (!result.success) {
            this.downloading = false;
            this.error = result.error;
            return;
        }

        setTimeout(() => {
            this.downloading = false;
            this.downloadSuccess = true;
        }, SUCCESS_DISPLAY_DELAY_MS);
    };

    _applyQualityDefault() {
        if (this.mode !== "video" || !this.videoOptions.length) return;
        this.selectedIndex = this.autoMaxQuality ? this.videoOptions.length - 1 : 0;
    }

    get _outputDirectory() {
        return this.folderMode === "manual" ? this.customDirectory : this.defaultDirectory;
    }

    get _currentOptions() {
        return this.mode === "audio" ? this.audioOptions : this.videoOptions;
    }

    render() {
        return html`
        <url-search-bar .loading=${this.loading}></url-search-bar>

        ${this.video
                ? html`
                  <video-preview-card .video=${this.video}></video-preview-card>
                  <format-toggle .mode=${this.mode}></format-toggle>

                  <download-options-panel
                      .options=${this._currentOptions}
                      .selectedIndex=${this.selectedIndex}
                      .disabled=${this.autoMaxQuality && this.mode === "video"}
                  ></download-options-panel>

                  <filename-input
                      .value=${this.customFilename}
                      placeholder=${t("home.filename_placeholder")}
                  ></filename-input>

                  ${this.subfolderPreview
                        ? html`<p class="subfolder-hint">📁 Se guardará en: ${this._outputDirectory}/${this.subfolderPreview}/</p>`
                        : ""}

                  <folder-picker
                      .path=${this._outputDirectory}
                      .editable=${this.folderMode === "manual"}
                  ></folder-picker>

                  ${this.downloading || this.downloadSuccess
                        ? html`<download-progress-bar .active=${this.downloading}></download-progress-bar>`
                        : ""}

                  ${this.error ? html`<p class="error">${this.error}</p>` : ""}
                  ${this.downloadSuccess ? html`<p class="success">${t("home.download_success")}</p>` : ""}

                  <button
                      class="download-btn"
                      @click=${this._handleDownload}
                      ?disabled=${this.downloading || !this._currentOptions.length}
                  >
                        ${this.downloading ? t("home.downloading") : t("home.download_button")}
                  </button>
              `
                : ""}
    `;
    }
}

customElements.define("home-view", HomeView);