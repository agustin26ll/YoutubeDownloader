import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/history-view.css?inline";
import { getHistory, openHistoryItem, redownloadFromHistory } from "../services/api-bridge.js";

export class HistoryView extends LitElement {
    static properties = {
        entries: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        redownloadingId: { type: String, state: true },
        error: { type: String, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.entries = [];
        this.loading = true;
        this.redownloadingId = null;
        this.error = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._load();
    }

    async _load() {
        this.loading = true;
        const result = await getHistory();
        this.entries = result.entries;
        this.loading = false;
    }

    _formatDate(iso) {
        return new Date(iso).toLocaleString();
    }

    async _handleOpen(id) {
        await openHistoryItem(id);
    }

    async _handleRedownload(id) {
        this.redownloadingId = id;
        this.error = null;

        const result = await redownloadFromHistory(id);
        this.redownloadingId = null;

        if (!result.success) {
            this.error = result.error;
            return;
        }
        await this._load();
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
                                          <p class="title">${entry.title}</p>
                                          <p class="meta">
                                              ${entry.uploader} · ${entry.is_audio ? "Audio" : "Video"} ·
                                              ${this._formatDate(entry.downloaded_at)}
                                          </p>
                                      </div>
                                      <div class="actions">
                                          <button @click=${() => this._handleOpen(entry.id)}>Abrir</button>
                                          <button
                                              ?disabled=${this.redownloadingId === entry.id}
                                              @click=${() => this._handleRedownload(entry.id)}
                                          >
                                              ${this.redownloadingId === entry.id ? "Descargando..." : "Descargar de nuevo"}
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