import { LitElement, html, css } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import iconExternalLink from "lucide-static/icons/external-link.svg?raw";
import iconFolderOpen from "lucide-static/icons/folder-open.svg?raw";
import iconRefreshCw from "lucide-static/icons/refresh-cw.svg?raw";
import iconAlertTriangle from "lucide-static/icons/alert-triangle.svg?raw";
import iconLink from "lucide-static/icons/link.svg?raw";
import iconCheck from "lucide-static/icons/check.svg?raw";
import iconTrash2 from "lucide-static/icons/trash-2.svg?raw";
import iconTrash from "lucide-static/icons/trash.svg?raw";

const ICONS = {
    "external-link": iconExternalLink,
    "folder-open": iconFolderOpen,
    "refresh-cw": iconRefreshCw,
    "alert-triangle": iconAlertTriangle,
    "link": iconLink,
    "check": iconCheck,
    "trash-2": iconTrash2,
    "trash": iconTrash,
};

export class AppIcon extends LitElement {
    static properties = {
        name: { type: String },
        size: { type: Number },
    };

    static styles = css`
        :host {
            display: inline-flex;
        }
        svg {
            display: block;
            stroke: currentColor;
        }
    `;

    constructor() {
        super();
        this.size = 16;
    }

    updated() {
        const svg = this.renderRoot.querySelector("svg");
        if (svg) {
            svg.setAttribute("width", this.size);
            svg.setAttribute("height", this.size);
        }
    }

    render() {
        const raw = ICONS[this.name];
        return raw ? html`${unsafeSVG(raw)}` : html``;
    }
}

customElements.define("app-icon", AppIcon);