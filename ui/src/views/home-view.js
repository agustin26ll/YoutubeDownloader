import { LitElement, html, css } from "lit";
import styles from "../styles/views/home-view.css?inline";

export class HomeView extends LitElement {
    static styles = css([styles]);

    render() {
        return html`<h1>Inicio</h1>`;
    }
}

customElements.define("home-view", HomeView);