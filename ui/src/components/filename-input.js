import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/filename-input.css?inline";
import { t } from "../i18n/index.js";

export class FilenameInput extends LitElement {
    static properties = {
        value: { type: String },
        placeholder: { type: String }
    };

    static styles = css([styles]);

    _handleInput(event) {
        this.value = e.target.value;
        this.dispatchEvent(
            new CustomEvent("filename-changed", {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            })
        )
    }

    render() {
        return html`
            <label>${t("settings.tabs.naming")}</label>
            <input
                type="text"
                .value=${this.value}
                placeholder=${this.placeholder}
                @input=${this._handleInput}
            />
        `;
    }
}

customElements.define("filename-input", FilenameInput);