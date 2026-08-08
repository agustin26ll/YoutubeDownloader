import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/history-view.css?inline";
import interactiveStyles from "/src/styles/shared/interactive.css?inline";
import "../components/app-icon.js";
import { formatDuration } from "../utils/duration.js";
import { createActionLock } from "../utils/action-lock.js";
import {
    getHistory,
    checkHistoryItemExists,
    openHistoryFile,
    openHistoryFolder,
    redownloadFromHistory,
} from "../services/api-bridge.js";

const FOUND_BADGE_DISPLAY_MS = 2000;
const SHAKE_ANIMATION_MS = 350;
const COPIED_LABEL_DISPLAY_MS = 1500;

export class HistoryView extends LitElement {
    static properties = {
        entries: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        redownloadingId: { type: String, state: true },
        shakeId: { type: String, state: true },
        foundId: { type: String, state: true },
        copiedId: { type: String, state: true },
        error: { type: String, state: true },
    };

    static styles = [css([styles]), css([interactiveStyles])];

    constructor() {
        super();
        this.entries = [];
        this.loading = true;
        this.redownloadingId = null;
        this.shakeId = null;
        this.foundId = null;
        this.copiedId = null;
        this.error = null;
        this._lock = createActionLock(800);
    }

    connectedCallback() {
        super.connectedCallback();
        this._load();
    }

    async _load() {
        this.loading = true;
        const result = await getHistory();

        const withStatus = await Promise.all(
            result.entries.map(async (entry) => {
                const status = await checkHistoryItemExists(entry.id);
                return { ...entry, missing: !status.exists };
            })
        );

        this.entries = withStatus;
        this.loading = false;
    }

    _updateEntry(id, patch) {
        this.entries = this.entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    }

    _formatDate(iso) {
        return new Date(iso).toLocaleString();
    }

    _handleOpen(entry) {
        this._lock.run(`open-${entry.id}`, async () => {
            const result = await openHistoryFile(entry.id);

            if (result.success) {
                if (entry.missing) {
                    this._updateEntry(entry.id, { missing: false });
                    this.foundId = entry.id;
                    setTimeout(() => (this.foundId = null), FOUND_BADGE_DISPLAY_MS);
                }
                return;
            }

            if (result.missing) {
                this._updateEntry(entry.id, { missing: true });
                this.shakeId = entry.id;
                setTimeout(() => (this.shakeId = null), SHAKE_ANIMATION_MS);
            }
        });
        this.requestUpdate();
    }

    _handleOpenFolder(entry) {
        this._lock.run(`folder-${entry.id}`, () => openHistoryFolder(entry.id));
        this.requestUpdate();
    }

    _handleCopyUrl(entry) {
        this._lock.run(`copy-${entry.id}`, async () => {
            await navigator.clipboard.writeText(entry.url);
            this.copiedId = entry.id;
            setTimeout(() => (this.copiedId = null), COPIED_LABEL_DISPLAY_MS);
        });
        this.requestUpdate();
    }

    _handleRedownload(entry) {
        this._lock.run(`redownload-${entry.id}`, async () => {
            this.redownloadingId = entry.id;
            this.error = null;

            const result = await redownloadFromHistory(entry.id);
            this.redownloadingId = null;

            if (!result.success) {
                this.error = result.error;
                return;
            }
            await this._load();
        });
        this.requestUpdate();
    }

    render() {
        if (this.loading) return html`<p class="hint">Cargando...</p>`;

        return html`
            <h1>Historial</h1>
            ${this.error ? html`<p class="error">${this.error}</p>` : ""}
            ${!this.entries.length
                ? html`<p class="hint">Aún no hay descargas.</p>`
                : html`
                      <div class="list">
                          ${this.entries.map(
                              (entry) => html`
                                  <div class="item">
                                      <img src=${entry.thumbnail} alt="" />

                                      <div class="info">
                                          <div class="title-row">
                                              <p class="title">${entry.title}</p>
                                              ${entry.missing
                                                  ? html`<span class="badge badge-missing">
                                                        <app-icon name="alert-triangle" size="12"></app-icon>
                                                        Eliminado
                                                    </span>`
                                                  : ""}
                                              ${this.foundId === entry.id
                                                  ? html`<span class="badge badge-found">
                                                        <app-icon name="check" size="12"></app-icon>
                                                        Encontrado
                                                    </span>`
                                                  : ""}
                                          </div>

                                          <div class="tags-row">
                                              <span class="tag">${entry.uploader}</span>
                                              <span class="tag">${entry.is_audio ? "Audio" : "Video"}</span>
                                              <span class="tag tag-quality">${entry.quality_label}</span>
                                              <span class="tag">${formatDuration(entry.duration_seconds)}</span>
                                          </div>

                                          <p class="date">Descargado: ${this._formatDate(entry.downloaded_at)}</p>
                                      </div>

                                      <div class="actions">
                                          <button
                                              class="icon-btn"
                                              data-tooltip="Abrir archivo"
                                              ?disabled=${this._lock.isLocked(`open-${entry.id}`)}
                                              @click=${() => this._handleOpen(entry)}
                                          >
                                              <app-icon name="external-link"></app-icon>
                                          </button>
                                          <button
                                              class="icon-btn"
                                              data-tooltip="Ir a la carpeta"
                                              ?disabled=${this._lock.isLocked(`folder-${entry.id}`)}
                                              @click=${() => this._handleOpenFolder(entry)}
                                          >
                                              <app-icon name="folder-open"></app-icon>
                                          </button>
                                          <button
                                              class="icon-btn"
                                              data-tooltip=${this.copiedId === entry.id ? "¡Copiado!" : "Copiar enlace"}
                                              ?disabled=${this._lock.isLocked(`copy-${entry.id}`)}
                                              @click=${() => this._handleCopyUrl(entry)}
                                          >
                                              <app-icon name=${this.copiedId === entry.id ? "check" : "link"}></app-icon>
                                          </button>
                                          <button
                                              class="icon-btn ${this.shakeId === entry.id ? "shake" : ""}"
                                              data-tooltip="Descargar de nuevo"
                                              ?disabled=${this.redownloadingId === entry.id || this._lock.isLocked(`redownload-${entry.id}`)}
                                              @click=${() => this._handleRedownload(entry)}
                                          >
                                              <app-icon name="refresh-cw"></app-icon>
                                          </button>
                                      </div>
                                  </div>
                              `
                          )}
                      </div>
                  `}
        `;
    }
}

customElements.define("history-view", HistoryView);