/**
 * Skin Resource Pack Generator
 * MCIDからスキンを取得し、リソースパックとしてZipダウンロード
 */

// DOM Elements
const mcidInput = document.getElementById('mcid');
const fetchBtn = document.getElementById('fetch-btn');
const errorMsg = document.getElementById('error-msg');
const previewSection = document.getElementById('preview-section');
const skinPreview = document.getElementById('skin-preview');
const playerName = document.getElementById('player-name');
const downloadBtn = document.getElementById('download-btn');

// State
let currentSkinBlob = null;
let currentPlayerName = '';

// Pack.mcmeta content
const packMcmeta = {
  pack: {
    min_format: 75,
    max_format: 75,
    description: {
      text: "",
      extra: [
        { text: "Skin for RPG", color: "gold" },
        { text: " | " },
        { text: "1.21.11", color: "#ffdd99" }
      ]
    }
  }
};

/**
 * Fetch skin from Minotar API
 * @param {string} username - Minecraft username
 * @returns {Promise<Blob>} - Skin image as Blob
 */
async function fetchSkin(username) {
  const response = await fetch(`https://minotar.net/skin/${username}`);
  
  if (!response.ok) {
    throw new Error('スキンが見つかりませんでした。MCIDを確認してください。');
  }
  
  return await response.blob();
}

/**
 * Generate resource pack zip
 * @param {Blob} skinBlob - Skin image blob
 * @returns {Promise<Blob>} - Zip file as Blob
 */
async function generateResourcePack(skinBlob) {
  const zip = new JSZip();
  
  // Add pack.mcmeta
  zip.file('pack.mcmeta', JSON.stringify(packMcmeta, null, 2));
  
  // Add skin texture
  zip.file('assets/item/textures/item/hands/texture.png', skinBlob);
  
  // Generate zip
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Set loading state on fetch button
 * @param {boolean} loading 
 */
function setLoading(loading) {
  fetchBtn.disabled = loading;
  fetchBtn.classList.toggle('loading', loading);
}

/**
 * Show error message
 * @param {string} message 
 */
function showError(message) {
  errorMsg.textContent = message;
}

/**
 * Clear error message
 */
function clearError() {
  errorMsg.textContent = '';
}

/**
 * Show preview section with skin
 * @param {Blob} skinBlob 
 * @param {string} name 
 */
function showPreview(skinBlob, name) {
  const url = URL.createObjectURL(skinBlob);
  skinPreview.src = url;
  playerName.textContent = name;
  previewSection.classList.remove('hidden');
}

/**
 * Hide preview section
 */
function hidePreview() {
  previewSection.classList.add('hidden');
  currentSkinBlob = null;
  currentPlayerName = '';
}

/**
 * Handle fetch button click
 */
async function handleFetch() {
  const username = mcidInput.value.trim();
  
  if (!username) {
    showError('MCIDを入力してください。');
    return;
  }
  
  // Validate username (3-16 characters, alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    showError('無効なMCIDです。3-16文字の英数字とアンダースコアのみ使用できます。');
    return;
  }
  
  clearError();
  hidePreview();
  setLoading(true);
  
  try {
    const skinBlob = await fetchSkin(username);
    currentSkinBlob = skinBlob;
    currentPlayerName = username;
    showPreview(skinBlob, username);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Handle download button click
 */
async function handleDownload() {
  if (!currentSkinBlob) {
    showError('先にスキンを取得してください。');
    return;
  }
  
  downloadBtn.disabled = true;
  downloadBtn.textContent = '📦 生成中...';
  
  try {
    const zipBlob = await generateResourcePack(currentSkinBlob);
    downloadBlob(zipBlob, 'Skin resourcepack for RPG.zip');
  } catch (error) {
    showError('リソースパックの生成に失敗しました。');
    console.error(error);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '📦 リソースパックをダウンロード';
  }
}

// Event Listeners
fetchBtn.addEventListener('click', handleFetch);
downloadBtn.addEventListener('click', handleDownload);

// Enter key to fetch
mcidInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleFetch();
  }
});

// Clear error on input
mcidInput.addEventListener('input', () => {
  clearError();
});
