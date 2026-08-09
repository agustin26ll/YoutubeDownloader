import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/sidebar-menu.css?inline";
import { t } from "../i18n/index.js";

const MENU_ITEMS = [
    { id: "home", label: t("sidebar.home"), icon: "🏠" },
    { id: "history", label: t("sidebar.history"), icon: "🕓" },
    { id: "donate", label: t("sidebar.donate"), icon: "❤️" },
    { id: "help", label: t("sidebar.help"), icon: "❓" },
    { id: "settings", label: t("sidebar.settings"), icon: "⚙️" },
];

export class SidebarMenu extends LitElement {
    static properties = {
        expanded: { type: Boolean, state: true },
        activeItem: { type: String, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.expanded = false;
        this.activeItem = "home";
    }

    _handleMouseEnter() {
        this.expanded = true;
    }

    _handleMouseLeave() {
        this.expanded = false;
    }

    _selectItem(id) {
        this.activeItem = id;
        this.dispatchEvent(
            new CustomEvent("navigate", {
                detail: { itemId: id },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        return html`
            <nav
                class=${this.expanded ? "expanded" : ""}
                @mouseenter=${this._handleMouseEnter}
                @mouseleave=${this._handleMouseLeave}
            >
                ${MENU_ITEMS.map(
            (item) => html`
                        <div
                            class="item ${this.activeItem === item.id ? "active" : ""}"
                            @click=${() => this._selectItem(item.id)}
                        >
                            <span class="icon">${item.icon}</span>
                            <span class="label">${item.label}</span>
                        </div>
                    `
        )}
            </nav>
        `;
    }
}

customElements.define("sidebar-menu", SidebarMenu);