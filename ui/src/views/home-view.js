import { LitElement, html, css } from "lit";
import styles from "/src/styles/views/home-view.css?inline";
import "../components/url-search-bar.js";
import "../components/video-preview-card.js";
import { getVideoInfo } from "../services/api-bridge.js";

export class HomeView extends LitElement {
    static properties = {
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        video: { type: Object, state: true },
        options: { type: Array, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.loading = false;
        this.error = null;
        this.video = null;
        this.options = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("search", this._handleSearch);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("search", this._handleSearch);
    }

    _handleSearch = async (e) => {
        this.loading = true;
        this.error = null;
        this.video = null;

        const result = await getVideoInfo(e.detail.url);

        this.loading = false;

        if (!result.success) {
            this.error = result.error;
            return;
        }

        this.video = result.video;
        this.options = result.options;
    };

    render() {
        return html`
            <url-search-bar .loading=${this.loading}></url-search-bar>

            ${this.error ? html`<p class="error">${this.error}</p>` : ""}

            ${this.video
                ? html`<video-preview-card .video=${this.video}></video-preview-card>`
                : ""}
        `;
    }
}

customElements.define("home-view", HomeView);