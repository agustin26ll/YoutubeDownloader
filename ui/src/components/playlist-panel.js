import { LitElement, html, css } from 'lit';
import styles from "/src/styles/components/playlist-panel.css?inline";
import "./playlist-item-row.js";
import { t } from "../i18n/index.js";

export class PlaylistPanel extends LitElement {
    static properties = {
        items: { type: Array },
        qualityLabels: { type: Object },
        manualMode: { type: Boolean },
        resolvingIds: { type: Object },
    };

    static styles = [css([styles])];

    constructor() {
        super();
        this.items = [];
        this.qualityLabels = {};
    }

    get _selectedCount() {
        return this.items.filter((i) => i.selected).length;
    }

    get _allSelected() {
        return this.items.length > 0 && this._selectedCount === this.items.length;
    }

    get _someSelected() {
        return this._selectedCount > 0 && !this._allSelected;
    }

    updated() {
        const master = this.renderRoot.querySelector(".select-all-checkbox");
        if (master) master.indeterminate = this._someSelected;
    }

    _handleToggleAll(e) {
        this.dispatchEvent(
            new CustomEvent("toggle-all", {
                detail: { selected: e.target.checked },
                bubbles: true,
                composed: true,
            })
        )
    }

    _handleManualToggle(e) {
        this.dispatchEvent(
            new CustomEvent("manual-mode-change", {
                detail: { manual: e.target.checked },
                bubbles: true,
                composed: true,
            })
        )
    }

    render() {
        return html`
        <div class="header">
            <label class="select-all">
                <input
                    type="checkbox"
                    class="select-all-checkbox"
                    .checked=${this._allSelected}
                    @change=${this._handleToggleAll}
                />
                <span>${t("playlist.select_all")} (${this._selectedCount}/${this.items.length})</span>
            </label>

            <label class="manual-toggle">
                <input type="checkbox" .checked=${this.manualMode} @change=${this._handleManualToggle} />
                <span>${t("playlist.choose_per_item")}</span>
            </label>
        </div>

        <div class="scroll-container">
            ${this.items.map(
            (item) => html`
                    <playlist-item-row
                        .item=${item}
                        .qualityLabel=${this.qualityLabels[item.video_id] || ""}
                        .resolving=${this.resolvingIds?.has(item.video_id) || false}
                        .showManualSelect=${this.manualMode}
                    ></playlist-item-row>
                `
        )}
        </div>
    `;
    }
}

customElements.define('playlist-panel', PlaylistPanel);