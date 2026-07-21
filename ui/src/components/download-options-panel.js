import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/download-options-panel.css?inline";

export class DownloadOptionsPanel extends LitElement {
    static properties = {
        options: { type: Array },
        selectedIndex: { type: Number, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.options = [];
        this.selectedIndex = 0;
    }

    _handleSelect(index) {
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
                <p class="title">Calidad</p>
                <div class="options">
                    ${this.options.map(
                        (option, index) => html`
                            <button
                                class="option ${this.selectedIndex === index ? "selected" : ""}"
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