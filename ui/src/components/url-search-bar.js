import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/url-search-bar.css?inline";
import { t } from "../i18n/index.js";

export class UrlSearchBar extends LitElement {
    static properties = {
        value: { type: String, state: true },
        loading: { type: Boolean }
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.value = "";
        this.loading = false;
    }

    _handleInput(e) {
        this.value = e.target.value;
    }

    _handleSubmit(e) {
        e.preventDefault();
        if (!this.value.trim || this.loading) return;

        this.dispatchEvent(
            new CustomEvent("search", {
                detail: { url: this.value.trim() },
                bubbles: true,
                composed: true
            })
        )
    }

    render() {
        return html`
            <form @submit=${this._handleSubmit}>
                <input
                    type="text"
                    placeholder=${t("home.search_placeholder")}
                    .value=${this.value}
                    @input=${this._handleInput}
                    ?disabled=${this.loading}
                />
                <button type="submit" ?disabled=${this.loading}>
                    ${this.loading ? t("home.searching") : t("home.search_button")}
                </button>
            </form>
        `;
    }
}

customElements.define("url-search-bar", UrlSearchBar);