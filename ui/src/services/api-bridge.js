export async function getVideoInfo(url) {
    return await window.pywebview.api.get_video(url);
}

export async function getSettings() {
    return await window.pywebview.api.get_settings();
}

export async function updateNamingExpression(expression) {
    return await window.pywebview.api.update_naming_expression(expression);
}

export async function previewFilename(expression) {
    return await window.pywebview.api.preview_filename(expression);
}

export async function updateFolderMode(mode) {
    return await window.pywebview.api.update_folder_mode(mode);
}

export async function getDefaultDirectory(isAudio) {
    return await window.pywebview.api.get_default_directory(isAudio);
}

export async function updateAutoMaxQuality(value) {
    return await window.pywebview.api.update_auto_max_quality(value);
}

export async function createFolder(path) {previewFilename
    return await window.pywebview.api.create_folder(path);
}

export async function checkFolderExists(path) {
    return await window.pywebview.api.check_folder_exists(path);
}

export async function openFolder(path) {
    return await window.pywebview.api.open_folder(path);
}

export async function pickFolder() {
    return await window.pywebview.api.pick_folder();
}

export async function downloadVideo(optionIndex, outputDirectory, isAudio) {
    return await window.pywebview.api.download(optionIndex, outputDirectory, isAudio);
}