import { LitElement, html, css } from "lit";
import "./components/index.js";
import "./views/index.js";

export class AppRoot extends LitElement {
    static properties = {
        currentView: { type: String, state: true },
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
    `;

    constructor() {
        super();
        this.currentView = "home";
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
        if (e.detail.itemId === "settings") {
            this.renderRoot.querySelector("advanced-settings-modal")?.show();
            return;
        }
        this.currentView = e.detail.itemId;
    };

    _renderView() {
        switch (this.currentView) {
            case "home": return html`<home-view></home-view>`;
            case "donate": return html`<donate-view></donate-view>`;
            case "help": return html`<help-view></help-view>`;
            default: return html`<home-view></home-view>`;
        }
    }

    render() {
        return html`
            <sidebar-menu></sidebar-menu>
            <div class="content">${this._renderView()}</div>
            <connection-toast></connection-toast>
            <advanced-settings-modal></advanced-settings-modal>
        `;
    }
}

customElements.define("app-root", AppRoot);