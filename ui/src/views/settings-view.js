import { LitElement, html, css } from "lit";
import styles from "../styles/views/settings-view.css?inline";

export class SettingsView extends LitElement {
    static styles = css([styles]);

    render() {
        return html`<h1>Configuración</h1>`;
    }
}

customElements.define("settings-view", SettingsView);