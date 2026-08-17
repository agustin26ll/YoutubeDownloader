import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/home-view.css?inline";
import "../components/url-search-bar.js";
import "../components/video-preview-card.js";
import "../components/download-options-panel.js";
import "../components/folder-picker.js";
import "../components/format-toggle.js";
import "../components/download-progress-bar.js";
import "../components/filename-input.js";
import "../components/playlist-panel.js";
import { runWithConcurrency, resolveConcurrency } from "../utils/concurrency-pool.js";
import { t } from "../i18n/index.js";

import {
    getVideoInfo,
    getSettings,
    getDefaultDirectory,
    downloadVideo,
    previewFilename,
    previewSubfolder,
    checkIsPlaylist,
    getPlaylist,
    resolvePlaylistItem,
    downloadPlaylist
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
        isPlaylistMode: { type: Boolean, state: true },
        playlistTitle: { type: String, state: true },
        playlistItems: { type: Array, state: true },
        playlistMode: { type: String, state: true },
        playlistManualSelect: { type: Boolean, state: true },
        playlistQualityLabels: { type: Object, state: true },
        playlistResolvingIds: { type: Object, state: true }
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
        this.isPlaylistMode = false;
        this.playlistTitle = "";
        this.playlistItems = [];

        this.playlistMode = "video";
        this.playlistManualSelect = false,
            this.playlistQualityLabels = {},
            this.playlistResolvingIds = new Set();
    }

    async connectedCallback() {
        super.connectedCallback();
        this.addEventListener("search", this._handleSearch);
        this.addEventListener("option-selected", this._handleOptionSelected);
        this.addEventListener("folder-changed", this._handleFolderChanged);
        this.addEventListener("mode-changed", this._handleModeChanged);
        window.addEventListener("settings-updated", this._handleSettingsUpdated);
        this.addEventListener("filename-changed", this._handleFilenameChanged);
        this.addEventListener("item-toggle", this._handleToggleItem);
        this.addEventListener("toggle-all", this._handleToggleAll);
        this.addEventListener("item-copy-link", this._handleCopyLink);
        this.addEventListener("manual-mode-change", this._handlePlaylistManualToggle);
        this.addEventListener("item-quality-change", this._handlePlaylistQualityChange);

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
        this.removeEventListener("item-toggle", this._handleToggleItem);
        this.removeEventListener("toggle-all", this._handleToggleAll);
        this.removeEventListener("item-copy-link", this._handleCopyLink);
        this.removeEventListener("manual-mode-change", this._handlePlaylistManualToggle);
        this.removeEventListener("item-quality-change", this._handlePlaylistQualityChange);

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

    async _loadSingleVideo(url) {
        const result = await getVideoInfo(url);

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
    }

    async _loadPlaylist(url) {
        const result = await getPlaylist(url);
        this.loading = false;

        if (!result.success) {
            this.error = result.error;
            return;
        }

        this.isPlaylistMode = true;
        this.playlistTitle = result.playlist.title;
        this.playlistItems = result.playlist.items.map((item) => ({
            ...item,
            selected: true,
            error: null,
            options: [],
            selectedOptionIndex: 0
        }));

        await this._resolveAllQualities();
    }

    async _resolveAllQualities() {
        const isAudio = this.playlistMode === "audio";
        const concurrency = resolveConcurrency(this.playlistItems.length);

        await runWithConcurrency(
            this.playlistItems,
            async (item) => {
                this.playlistResolvingIds = new Set(this.playlistResolvingIds).add(item.video_id);

                const result = await resolvePlaylistItem(item.video_id, item.url, isAudio);

                const next = new Set(this.playlistResolvingIds);
                next.delete(item.video_id);
                this.playlistResolvingIds = next;

                if (!result.success) {
                    this.playlistItems = this.playlistItems.map((i) =>
                        i.video_id === item.video_id ? { ...i, error: result.error, selected: false } : i
                    );
                    return;
                }

                this.playlistQualityLabels = {
                    ...this.playlistQualityLabels,
                    [item.video_id]: result.options[result.default_index]?.label || "",
                };

                this.playlistItems = this.playlistItems.map((i) =>
                    i.video_id === item.video_id
                        ? { ...i, options: result.options, selectedOptionIndex: result.default_index }
                        : i
                );
            },
            concurrency,
            150
        );
    }

    // Handler de búsqueda de video, que se activa cuando el usuario ingresa una URL y presiona Enter.

    _handleSearch = async (e) => {
        const url = e.detail.url;
        this.loading = true;
        this.error = null;
        this.downloadSuccess = false;
        this.video = null;
        this.isPlaylistMode = false;

        const playlistCheck = await checkIsPlaylist(url);

        if (playlistCheck.is_playlist) {
            await this._loadPlaylist(url);
            return;
        }

        await this._loadSingleVideo(url)
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

    _handleToggleItem = (e) => {
        const { videoId } = e.detail;
        this.playlistItems = this.playlistItems.map((item) =>
            item.video_id === videoId ? { ...item, selected: !item.selected } : item
        );
    }

    _handleToggleAll = (e) => {
        const { selected } = e.detail;
        this.playlistItems = this.playlistItems.map((item) => ({ ...item, selected }));
    }

    _handleCopyLink = async (e) => {
        const { url } = e.detail;
        await navigator.clipboard.writeText(url);

        const searchBar = this.renderRoot.querySelector("url-search-bar");

        if (searchBar) searchBar.value = url

        this.isPlaylistMode = false;
        await this._loadSingleVideo(url)
    }

    _handlePlaylistFormatChange = async (e) => {
        e.stopPropagation();
        this.playlistMode = e.detail.mode;
        this.playlistQualityLabels = {};
        await this._resolveAllQualities();
    }

    _handlePlaylistManualToggle = (e) => {
        this.playlistManualSelect = e.detail.manual;
    }

    _handlePlaylistQualityChange = (e) => {
        const { videoId, index } = e.detail;
        this.playlistItems = this.playlistItems.map((item) =>
            item.video_id === videoId ? { ...item, selectedOptionIndex: index } : item
        );

        this.playlistQualityLabels = {
            ...this.playlistQualityLabels,
            [videoId]: this.playlistItems.find((i) => i.video_id === videoId)?.options[index]?.label || "",
        }
    }

    _handlePlaylistDownload = async () => {
        const picker = this.renderRoot.querySelector("folder-picker");
        const ready = picker ? await picker.checkNow() : true;

        if (!ready) return;

        const selectedItems = this.playlistItems.filter((i) => i.selected && !i.error);

        if (!selectedItems.length) return;

        this.downloading = true;
        this.error = null;
        this.downloadSuccess = false;

        const payload = selectedItems.map((item) => ({
            video_id: item.video_id,
            url: item.url,
            option_index: item.selectedOptionIndex,
            is_audio: this.playlistMode === "audio",
            title: item.title,
            thumbnail: item.thumbnail,
            duration__seconds: item.duration__seconds
        }));

        const result = await downloadPlaylist(payload, this._outputDirectory);

        this.downloading = false;

        if (!result.success) {
            this.error = result.error;
            return;
        }

        const failedIds = new Set(result.result.filter((r) => !r.success).map((r) => r.video_id));

        this.playlistItems = this.playlistItems.map((item) =>
            failedIds.has(item.video_id) ? { ...item, error: "No se pudo descargar" } : item
        );

        this.downloadSuccess = true;

    }

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

        ${this.error ? html`<p class="error">${this.error}</p>` : ""}

        ${this.isPlaylistMode
                ? html`
          <h3 class="playlist-title">${this.playlistTitle}</h3>
          <format-toggle .mode=${this.playlistMode} @mode-changed=${this._handlePlaylistFormatChange}></format-toggle>
          <playlist-panel
              .items=${this.playlistItems}
              .qualityLabels=${this.playlistQualityLabels}
              .resolvingIds=${this.playlistResolvingIds}
              .manualMode=${this.playlistManualSelect}
          ></playlist-panel>

          <folder-picker .path=${this._outputDirectory} .editable=${this.folderMode === "manual"}></folder-picker>

          ${this.downloading || this.downloadSuccess
                        ? html`<download-progress-bar .active=${this.downloading}></download-progress-bar>`
                        : ""}

          ${this.error ? html`<p class="error">${this.error}</p>` : ""}
          ${this.downloadSuccess ? html`<p class="success">${t("home.download_success")}</p>` : ""}

          <button
              class="download-btn"
              @click=${this._handlePlaylistDownload}
              ?disabled=${this.downloading || !this.playlistItems.some((i) => i.selected && !i.error)}
          >
              ${this.downloading ? t("home.downloading") : t("home.download_button")}
          </button>
      `
                : this.video
                    ? html`...`
                    : ""}
    `;
    }
}

customElements.define("home-view", HomeView);