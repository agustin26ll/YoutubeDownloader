import { LitElement, html, css } from "lit";
import styles from "../styles/views/donate-view.css?inline";

export class DonateView extends LitElement {
    static styles = css([styles]);

    render() {
        return html`<h1>Donar</h1>`;
    }
}

customElements.define("donate-view", DonateView);