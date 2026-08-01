import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/home-view.css?inline";
import "../components/url-search-bar.js";
import "../components/video-preview-card.js";
import "../components/download-options-panel.js";
import "../components/folder-picker.js";
import "../components/format-toggle.js";
import {
    getVideoInfo,
    getSettings,
    getDefaultDirectory,
    downloadVideo,
} from "../services/api-bridge.js";

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
        this._handleSettingsUpdated = this._loadSettings.bind(this);
    }

    async connectedCallback() {
        super.connectedCallback();
        this.addEventListener("search", this._handleSearch);
        this.addEventListener("option-selected", this._handleOptionSelected);
        this.addEventListener("folder-changed", this._handleFolderChanged);
        this.addEventListener("mode-changed", this._handleModeChanged);
        this.addEventListener("folder-status", () => { });
        window.addEventListener("settings-updated", this._handleSettingsUpdated);

        await this._loadSettings();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("search", this._handleSearch);
        this.removeEventListener("option-selected", this._handleOptionSelected);
        this.removeEventListener("folder-changed", this._handleFolderChanged);
        this.removeEventListener("mode-changed", this._handleModeChanged);
        window.removeEventListener("settings-updated", this._handleSettingsUpdated);
    }

    async _loadSettings() {
        const settings = await getSettings();
        this.folderMode = settings.folder_mode;
        this.customDirectory = settings.custom_directory;
        this.autoMaxQuality = settings.auto_max_quality;
        this._applyQualityDefault();
        await this._refreshDefaultDirectory();
    }

    async _refreshDefaultDirectory() {
        if (this.folderMode !== "default") return;
        const result = await getDefaultDirectory(this.mode === "audio");
        this.defaultDirectory = result.path;
    }

    get _outputDirectory() {
        return this.folderMode === "manual" ? this.customDirectory : this.defaultDirectory;
    }

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
    };

    _handleOptionSelected = (e) => {
        this.selectedIndex = e.detail.index;
    };

    _handleFolderChanged = (e) => {
        this.customDirectory = e.detail.path;
    };

    _handleModeChanged = async (e) => {
        this.mode = e.detail.mode;
        this._applyQualityDefault();
        await this._refreshDefaultDirectory();
    };

    _applyQualityDefault() {
        if (this.mode !== "video" || !this.videoOptions.length) return;
        this.selectedIndex = this.autoMaxQuality ? this.videoOptions.length - 1 : 0;
    }

    get _currentOptions() {
        return this.mode === "audio" ? this.audioOptions : this.videoOptions;
    }

    _handleDownload = async () => {
        const picker = this.renderRoot.querySelector("folder-picker");
        const ready = picker ? await picker.checkNow() : true;
        if (!ready) return;

        this.downloading = true;
        this.error = null;
        this.downloadSuccess = false;

        const result = await downloadVideo(this.selectedIndex, this._outputDirectory, this.mode === "audio");

        this.downloading = false;

        if (!result.success) {
            this.error = result.error;
            return;
        }

        this.downloadSuccess = true;
    };

    render() {
        return html`
            <url-search-bar .loading=${this.loading}></url-search-bar>

            ${this.video
                ? html`
                      <video-preview-card .video=${this.video}></video-preview-card>
                      <format-toggle .mode=${this.mode}></format-toggle>

                      ${html`<download-options-panel
                                .options=${this._currentOptions}
                                .selectedIndex=${this.selectedIndex}
                                .disabled=${this.autoMaxQuality && this.mode === "video"}
                            ></download-options-panel>`}

                      <folder-picker
                          .path=${this._outputDirectory}
                          .editable=${this.folderMode === "manual"}
                      ></folder-picker>

                      ${this.error ? html`<p class="error">${this.error}</p>` : ""}
                      ${this.downloadSuccess ? html`<p class="success">Descarga completada.</p>` : ""}

                      <button
                          class="download-btn"
                          @click=${this._handleDownload}
                          ?disabled=${this.downloading || !this._currentOptions.length}
                      >
                          ${this.downloading ? "Descargando..." : "Descargar"}
                      </button>
                  `
                : ""}
        `;
    }
}

customElements.define("home-view", HomeView);