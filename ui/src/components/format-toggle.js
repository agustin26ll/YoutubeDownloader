import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/format-toggle.css?inline";

export class FormatToggle extends LitElement {
    static properties = {
        mode: { type: String },
    };

    static styles = css([styles]);

    _select(mode) {
        if (mode === this.mode) return;
        this.mode = mode;
        this.dispatchEvent(
            new CustomEvent("mode-changed", {
                detail: { mode },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        return html`
            <div class="toggle">
                <button class=${this.mode === "video" ? "active" : ""} @click=${() => this._select("video")}>
                    Video (MP4)
                </button>
                <button class=${this.mode === "audio" ? "active" : ""} @click=${() => this._select("audio")}>
                    Audio (MP3)
                </button>
            </div>
        `;
    }
}

customElements.define("format-toggle", FormatToggle);