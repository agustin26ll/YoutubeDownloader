import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/settings-toggle-option.css?inline";

export class SettingsToggleOption extends LitElement {
    static properties = {
        value: { type: Boolean },
        optionOffLabel: { type: String },
        optionOffDesc: { type: String },
        optionOnLabel: { type: String },
        optionOnDesc: { type: String },
        saved: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.value = false;
        this.saved = false;
    }

    _select(newValue) {
        if (newValue === this.value) return;
        this.value = newValue;
        this.dispatchEvent(
            new CustomEvent("value-changed", {
                detail: { value: newValue },
                bubbles: true,
                composed: true,
            })
        );
        this.saved = true;
        setTimeout(() => (this.saved = false), 1500);
    }

    render() {
        return html`
            <div class="options">
                <label class="option ${!this.value ? "selected" : ""}">
                    <input type="radio" ?checked=${!this.value} @change=${() => this._select(false)} />
                    <div>
                        <p class="option-title">${this.optionOffLabel}</p>
                        <p class="option-desc">${this.optionOffDesc}</p>
                    </div>
                </label>
                <label class="option ${this.value ? "selected" : ""}">
                    <input type="radio" ?checked=${this.value} @change=${() => this._select(true)} />
                    <div>
                        <p class="option-title">${this.optionOnLabel}</p>
                        <p class="option-desc">${this.optionOnDesc}</p>
                    </div>
                </label>
            </div>
            ${this.saved ? html`<p class="saved-hint">✓ Guardado</p>` : ""}
        `;
    }
}

customElements.define("settings-toggle-option", SettingsToggleOption);