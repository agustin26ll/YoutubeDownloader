import { LitElement, html, css } from "lit";
import "./components/index.js";
import "./views/index.js";

export class AppRoot extends LitElement {
    static properties = {
        currentView: { type: String, state: true },
        visitedViews: { type: Object, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            height: 100%;
        }

        .content {
            flex: 1;
            overflow: auto;
            padding: var(--space-lg);
        }

        .view-hidden {
            display: none;
        }
    `;

    constructor() {
        super();
        this.currentView = "home";
        this.visitedViews = new Set(["home"]);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("navigate", this._handleNavigate);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("navigate", this._handleNavigate);
    }

    _handleNavigate = (e) => {
        const id = e.detail.itemId;

        if (id === "settings") {
            this.renderRoot.querySelector("advanced-settings-modal")?.show();
            return;
        }

        if (!this.visitedViews.has(id)) {
            this.visitedViews = new Set(this.visitedViews).add(id);
        }
        this.currentView = id;

        this.updateComplete.then(() => {
            this.renderRoot.querySelector(`${id}-view`)?.dispatchEvent(new CustomEvent("view-activated"));
        });
    };

    _hiddenClass(id) {
        return this.currentView === id ? "" : "view-hidden";
    }

    render() {
        return html`
            <sidebar-menu></sidebar-menu>
            <div class="content">
                ${this.visitedViews.has("home") ? html`<home-view class=${this._hiddenClass("home")}></home-view>` : ""}
                ${this.visitedViews.has("history") ? html`<history-view class=${this._hiddenClass("history")}></history-view>` : ""}
                ${this.visitedViews.has("donate") ? html`<donate-view class=${this._hiddenClass("donate")}></donate-view>` : ""}
                ${this.visitedViews.has("help") ? html`<help-view class=${this._hiddenClass("help")}></help-view>` : ""}
            </div>
            <connection-toast></connection-toast>
            <advanced-settings-modal></advanced-settings-modal>
        `;
    }
}

customElements.define("app-root", AppRoot);