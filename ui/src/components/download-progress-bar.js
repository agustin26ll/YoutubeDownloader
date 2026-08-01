import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/download-progress-bar.css?inline";
import { formatMB, formatEta } from "../utils/format-bytes.js";

export class DownloadProgressBar extends LitElement {
    static properties = {
        active: { type: Boolean },
        status: { type: String, state: true },
        percent: { type: Number, state: true },
        downloadedMb: { type: Number, state: true },
        totalMb: { type: Number, state: true },
        speedMbS: { type: Number, state: true },
        etaSeconds: { type: Number, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.active = false;
        this._reset();
        this._handleProgress = this._handleProgress.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("download-progress", this._handleProgress);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("download-progress", this._handleProgress);
    }

    _reset() {
        this.status = "idle";
        this.percent = 0;
        this.downloadedMb = null;
        this.totalMb = null;
        this.speedMbS = null;
        this.etaSeconds = null;
    }

    _handleProgress(e) {
        const d = e.detail;
        this.status = d.status;

        if (d.status === "downloading") {
            this.percent = d.percent;
            this.downloadedMb = d.downloaded_mb;
            this.totalMb = d.total_mb;
            this.speedMbS = d.speed_mb_s;
            this.etaSeconds = d.eta_seconds;
        } else if (d.status === "completed") {
            this.percent = 100;
        }
    }

    updated(changedProps) {
        if (changedProps.has("active") && this.active && !changedProps.get("active")) {
            this._reset();
        }
    }

    render() {
        if (!this.active) return html``;

        return html`
            <div class="wrapper">
                <div class="bar-track">
                    <div class="bar-fill ${this.status}" style="width: ${this.percent}%"></div>
                </div>
                <div class="info">
                    ${this.status === "processing"
                        ? html`<span>Procesando archivo...</span>`
                        : this.status === "completed"
                          ? html`<span class="done">✓ Completado</span>`
                          : this.status === "error"
                            ? html`<span class="error-text">Error en la descarga</span>`
                            : html`
                                  <span>${formatMB(this.downloadedMb)} / ${formatMB(this.totalMb)}</span>
                                  <span>${this.speedMbS ? `${this.speedMbS.toFixed(1)} MB/s` : ""}</span>
                                  <span>${this.etaSeconds ? `ETA ${formatEta(this.etaSeconds)}` : ""}</span>
                                  <span class="percent">${this.percent}%</span>
                              `}
                </div>
            </div>
        `;
    }
}

customElements.define("download-progress-bar", DownloadProgressBar);