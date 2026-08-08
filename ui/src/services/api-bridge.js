// VIDEOS 

export async function getVideoInfo(url) {
    return await window.pywebview.api.get_video(url);
}

export async function getSettings() {
    return await window.pywebview.api.get_settings();
}

export async function downloadVideo(optionIndex, outputDirectory, isAudio, customFilename) {
    return await window.pywebview.api.download(optionIndex, outputDirectory, isAudio,  customFilename || null);
}

// CONFIGURACION DE NOMENCLATURA Y PREVISUALIZACION DE NOMBRE DE ARCHIVO

export async function updateNamingExpression(expression) {
    return await window.pywebview.api.update_naming_expression(expression);
}

export async function previewFilename(expression) {
    return await window.pywebview.api.preview_filename(expression);
}

export async function updateAutoMaxQuality(value) {
    return await window.pywebview.api.update_auto_max_quality(value);
}

// CARPETAS

export async function updateCreateSubfolder(value) {
    return await window.pywebview.api.update_create_subfolder(value);
}

export async function previewSubfolder() {
    return await window.pywebview.api.preview_subfolder();
}

export async function updateFolderMode(mode) {
    return await window.pywebview.api.update_folder_mode(mode);
}

export async function getDefaultDirectory(isAudio) {
    return await window.pywebview.api.get_default_directory(isAudio);
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

// HISTORIAL

export async function getHistory() {
    return await window.pywebview.api.get_history();
}

export async function checkHistoryItemExists(id) {
    return await window.pywebview.api.check_history_item_exists(id);
}

export async function openHistoryFile(id) {
    return await window.pywebview.api.open_history_file(id);
}

export async function openHistoryFolder(id) {
    return await window.pywebview.api.open_history_folder(id);
}

export async function redownloadFromHistory(id) {
    return await window.pywebview.api.redownload_from_history(id);
}

export async function deleteHistoryItem(id) {
    return await window.pywebview.api.delete_history_item(id);
}

export async function clearHistory() {
    return await window.pywebview.api.clear_history();
}