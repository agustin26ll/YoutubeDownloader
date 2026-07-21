import { LitElement, html, css } from "lit";
import styles from "/src/styles/components/video-preview-card.css?inline";
import { extractYoutubeId } from "../utils/youtube.js";

export class VideoPreviewCard extends LitElement {
    static properties = {
        video: { type: Object },
        playing: { type: Boolean, state: true },
    };

    static styles = css([styles]);

    constructor() {
        super();
        this.playing = false;
    }

    _formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    _handlePlay() {
        this.playing = true;
    }

    render() {
        if (!this.video) return html``;

        const videoId = extractYoutubeId(this.video.webpage_url);

        return html`
            <div class="card">
                <div class="thumbnail-wrapper">
                    ${this.playing && videoId
                ? html`
                              <iframe
                                  src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                                  frameborder="0"
                                  allow="autoplay; encrypted-media"
                                  allowfullscreen
                              ></iframe>
                          `
                : html`
                              <img src=${this.video.thumbnail} alt="" @click=${this._handlePlay} />
                              <div class="play-overlay" @click=${this._handlePlay}>▶</div>
                          `}
                </div>
                <div class="info">
                    <h3>${this.video.title}</h3>
                    <p class="uploader">${this.video.uploader}</p>
                    <p class="duration">${this._formatDuration(this.video.duration_seconds)}</p>
                </div>
            </div>
        `;
    }
}

customElements.define("video-preview-card", VideoPreviewCard);