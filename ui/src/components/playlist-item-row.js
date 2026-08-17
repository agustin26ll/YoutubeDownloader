import { LitElement, html, css } from 'lit';
import styles from "/src/styles/components/playlist-item-row.css?inline";
import interactiveStyles from "/src/styles/shared/interactive.css?inline";
import "./app-icon.js";
import { formatDuration } from "../utils/duration.js";
import { t } from "../i18n/index.js";

export class PlaylistItemRow extends LitElement {
    static properties = {
        item: { type: Object },
        qualityLabel: { type: String },
        resolving: { type: Boolean },
        showManualSelect: { type: Boolean },
    };

    static styles = [css([styles]), css([interactiveStyles])];

    _handleToggle() {
        this.dispatchEvent(
            new CustomEvent("item-toggle", {
                detail: { videoId: this.item.video_id },
                bubbles: true,
                composed: true,
            })
        )
    }

    _handleCopyLink() {
        this.dispatchEvent(
            new CustomEvent("item-copy-link", {
                detail: { url: this.item.url },
                bubbles: true,
                composed: true,
            })
        )
    }

    _handleQualityChange(e) {
        this.dispatchEvent(
            new CustomEvent("item-quality-change", {
                detail: { videoId: this.item.video_id, index: Number(e.target.value) },
                bubbles: true,
                composed: true,
            })
        )
    }

    render() {
        const item = this.item;

        return html`
        <div class="row ${item.error ? "has-error" : ""}">
            <input type="checkbox" .checked=${item.selected} @change=${this._handleToggle} />

            <img src=${item.thumbnail} alt="" />

            <div class="info">
                <p class="title">${item.title}</p>
                <div class="meta-row">
                    <span class="duration">${formatDuration(item.duration_seconds)}</span>
                    ${this.resolving
                ? html`<span class="quality resolving">...</span>`
                : this.showManualSelect && item.options?.length
                    ? html`
                                <select class="quality-select" @change=${this._handleQualityChange}>
                                    ${item.options.map(
                        (opt) => html`<option value=${opt.index} ?selected=${opt.index === item.selectedOptionIndex}>${opt.label}</option>`
                    )}
                                </select>
                            `
                    : this.qualityLabel
                        ? html`<span class="quality">${this.qualityLabel}</span>`
                        : ""}
                </div>
            </div>

            ${item.error
                ? html`<span class="icon-btn error-icon" data-tooltip=${item.error}>
                      <app-icon name="alert-triangle" size="16"></app-icon>
                  </span>`
                : ""}

            <button class="icon-btn" data-tooltip=${t("history.copy_link")} @click=${this._handleCopyLink}>
                <app-icon name="link"></app-icon>
            </button>
        </div>
    `;
    }
}

customElements.define('playlist-item-row', PlaylistItemRow);