import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/connection-toast.css?inline";
import { startConnectionMonitor } from "../services/connection-monitor.js";

export class ConnectionToast extends LitElement {
    static properties = {
        visible: { type: Boolean, state: true },
        online: { type: Boolean, state: true }
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.visible = false;
        this.online = true;
        this._stopMonitor = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._stopMonitor = startConnectionMonitor(this._handleStatusChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._stopMonitor) this._stopMonitor();
    }

    _handleStatusChange = (isOnline) => {
        const wasOffline = !this.online;
        this.online = isOnline;

        if (!isOnline) {
            this.visible = true;
            return;
        }

        if (wasOffline) {
            this.visible = true;
            setTimeout(() => (this.visible = false), 3000);
        } else {
            this.visible = false;
        }
    };

    render() {
        if (!this.visible) return html``;

        return html`
            <div class="toast ${this.online ? "online" : "offline"}">
                ${this.online ? "✓ Conexión restablecida" : "⚠ Sin conexión a internet"}
            </div>
        `;
    }
}

customElements.define("connection-toast", ConnectionToast);