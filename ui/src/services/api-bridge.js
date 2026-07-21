export async function getVideoInfo(url) {
    return await window.pywebview.api.get_video(url);
}

export async function getSettings() {
    return await window.pywebview.api.get_settings();
}

export async function pickFolder() {
    return await window.pywebview.api.pick_folder();
}

export async function downloadVideo(optionIndex, outputDirectory) {
    return await window.pywebview.api.download(optionIndex, outputDirectory);
}