import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/download-options-panel.css?inline";
import { t } from "../i18n/index.js";

export class DownloadOptionsPanel extends LitElement {
    static properties = {
        options: { type: Array },
        selectedIndex: { type: Number },
        disabled: { type: Boolean },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.options = [];
        this.selectedIndex = 0;
        this.disabled = false;
    }

    _handleSelect(index) {
        if (this.disabled) return;

        this.selectedIndex = index;
        this.dispatchEvent(
            new CustomEvent("option-selected", {
                detail: { index },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        if (!this.options.length) return html``;

        return html`
            <div class="panel">
                <p class="title">
                    ${t("home.quality_title")} ${this.disabled ? t("home.quality_auto_suffix") : ""}
                </p>
                <div class="options ${this.disabled ? "disabled" : ""}">
                    ${this.options.map(
                        (option, index) => html`
                            <button
                                class="option ${this.selectedIndex === index ? "selected" : ""}"
                                ?disabled=${this.disabled}
                                @click=${() => this._handleSelect(index)}
                            >
                                ${option.label}
                            </button>
                        `
                    )}
                </div>
            </div>
        `;
    }
}

customElements.define("download-options-panel", DownloadOptionsPanel);