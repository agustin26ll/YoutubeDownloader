import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/advanced-settings-modal.css?inline";
import "./settings-tab-naming.js";
import "./settings-tab-folder.js";
import "./settings-tab-quality.js";
import { t } from "../i18n/index.js";

import { getSettings } from "../services/api-bridge.js";

const TABS = [
    { id: "naming", label: t("settings.tabs.naming") },
    { id: "folder", label: t("settings.tabs.folder") },
    { id: "quality", label: t("settings.tabs.quality") },
];

export class AdvancedSettingsModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        activeTab: { type: String, state: true },
        namingExpression: { type: String, state: true },
        folderMode: { type: String, state: true },
        autoMaxQuality: { type: Boolean, state: true },
        createSubfolder: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.open = false;
        this.activeTab = "naming";
        this.namingExpression = "";
        this._handleKeydown = this._handleKeydown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener("keydown", this._handleKeydown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener("keydown", this._handleKeydown);
    }

    _handleKeydown(e) {
        if (e.key === "Escape" && this.open) this.close();
    }

    async show() {
        const settings = await getSettings();
        this.namingExpression = settings.naming_expression;
        this.folderMode = settings.folder_mode;
        this.createSubfolder = settings.create_subfolder;
        this.autoMaxQuality = settings.auto_max_quality;
        this.open = true;
    }

    close() {
        this.open = false;
    }

    _selectTab(id) {
        this.activeTab = id;
    }

    _renderTab() {
        switch (this.activeTab) {
            case "naming":
                return html`<settings-tab-naming .expression=${this.namingExpression}></settings-tab-naming>`;
            case "folder":
                return html`<settings-tab-folder .folderMode=${this.folderMode} .createSubfolder=${this.createSubfolder}></settings-tab-folder>`;
            case "quality":
                return html`<settings-tab-quality .autoMaxQuality=${this.autoMaxQuality}></settings-tab-quality>`;
        }
    }

    render() {
        if (!this.open) return html``;

        return html`
            <div class="overlay" @click=${this.close}>
                <div class="modal" @click=${(e) => e.stopPropagation()}>
                    <div class="header">
                        <h2>${t("settings.tabs.title")}</h2>
                        <button class="close-btn" @click=${this.close}>✕</button>
                    </div>
                    <div class="body">
                        <nav class="tabs">
                            ${TABS.map((tab) =>
                                html` <button
                                        class="tab ${this.activeTab === tab.id ? "active" : ""}"
                                        @click=${() => this._selectTab(tab.id)}
                                    >
                                        ${tab.label}
                                    </button>`
                                )}
                        </nav>
                        <div class="tab-panel">${this._renderTab()}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("advanced-settings-modal", AdvancedSettingsModal);