import { LitElement, html, css } from "lit";
import styles from "../styles/views/help-view.css?inline";

export class HelpView extends LitElement {
    static styles = css([styles]);

    render() {
        return html`<h1>Ayuda</h1>`;
    }
}

customElements.define("help-view", HelpView);