import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/home-view.css?inline";
import "../components/url-search-bar.js";
import "../components/video-preview-card.js";
import "../components/download-options-panel.js";
import "../components/folder-picker.js";
import { getVideoInfo, getSettings, downloadVideo } from "../services/api-bridge.js";


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
        outputDirectory: { type: String, state: true },
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
        this.outputDirectory = "";
    }

    async connectedCallback() {
        super.connectedCallback();
        this.addEventListener("search", this._handleSearch);
        this.addEventListener("option-selected", this._handleOptionSelected);
        this.addEventListener("folder-changed", this._handleFolderChanged);
        this.addEventListener("mode-changed", this._handleModeChanged);

        const settings = await getSettings();
        this.outputDirectory = settings.download_directory;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("search", this._handleSearch);
        this.removeEventListener("option-selected", this._handleOptionSelected);
        this.removeEventListener("folder-changed", this._handleFolderChanged);
        this.removeEventListener("mode-changed", this._handleModeChanged);
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
        this.selectedIndex = 0;
    };

    _handleOptionSelected = (e) => {
        this.selectedIndex = e.detail.index;
    };

    _handleFolderChanged = (e) => {
        this.outputDirectory = e.detail.path;
    };

    _handleModeChanged = (e) => {
        this.mode = e.detail.mode;
        this.selectedIndex = 0;
    };

    get _currentOptions() {
        return this.mode === "audio" ? this.audioOptions : this.videoOptions;
    }

    _handleDownload = async () => {
        this.downloading = true;
        this.error = null;
        this.downloadSuccess = false;

        const result = await downloadVideo(this.selectedIndex, this.outputDirectory, this.mode === "audio");

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

            ${this.error ? html`<p class="error">${this.error}</p>` : ""}
            ${this.downloadSuccess ? html`<p class="success">Descarga completada.</p>` : ""}

            ${this.video
                ? html`
                      <video-preview-card .video=${this.video}></video-preview-card>
                      <format-toggle .mode=${this.mode}></format-toggle>
                      <download-options-panel
                          .options=${this._currentOptions}
                          .selectedIndex=${this.selectedIndex}
                      ></download-options-panel>
                      <folder-picker .path=${this.outputDirectory}></folder-picker>
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