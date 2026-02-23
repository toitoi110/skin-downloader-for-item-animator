/**
 * Skin Resource Pack Generator
 * MCIDからスキンを取得し、リソースパックとしてZipダウンロード
 * 日本語・英語対応
 */

// ========================================
// i18n - 翻訳テーブル
// ========================================
const i18n = {
  ja: {
    subtitle: "Toi's Item Animator用",
    placeholder_mcid: "例: Notch",
    btn_fetch: "取得",
    preview_title: "スキンプレビュー",
    btn_download: "📦 リソースパックをダウンロード",
    btn_downloading: "📦 生成中...",
    err_empty: "MCIDを入力してください。",
    err_invalid: "無効なMCIDです。3-16文字の英数字とアンダースコアのみ使用できます。",
    err_not_found: "スキンが見つかりませんでした。MCIDを確認してください。",
    err_generate: "リソースパックの生成に失敗しました。",
    err_fetch_first: "先にスキンを取得してください。",
  },
  en: {
    subtitle: "For Toi's Item Animator",
    placeholder_mcid: "e.g. Notch",
    btn_fetch: "Fetch",
    preview_title: "Skin Preview",
    btn_download: "📦 Download Resource Pack",
    btn_downloading: "📦 Generating...",
    err_empty: "Please enter a MCID.",
    err_invalid: "Invalid MCID. Only 3-16 alphanumeric characters and underscores are allowed.",
    err_not_found: "Skin not found. Please check the MCID.",
    err_generate: "Failed to generate the resource pack.",
    err_fetch_first: "Please fetch a skin first.",
  }
};

/**
 * Detect language from browser or localStorage
 */
function detectLanguage() {
  const saved = localStorage.getItem('lang');
  if (saved && i18n[saved]) return saved;
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

let currentLang = detectLanguage();

/**
 * Get translated string
 */
function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

/**
 * Apply translations to all elements with data-i18n attributes
 */
function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update toggle button label
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = currentLang === 'ja' ? 'EN' : 'JA';
  }
}

/**
 * Toggle language
 */
function toggleLanguage() {
  currentLang = currentLang === 'ja' ? 'en' : 'ja';
  localStorage.setItem('lang', currentLang);
  applyTranslations();
}

// ========================================
// DOM Elements
// ========================================
const mcidInput = document.getElementById('mcid');
const fetchBtn = document.getElementById('fetch-btn');
const errorMsg = document.getElementById('error-msg');
const previewSection = document.getElementById('preview-section');
const skinPreview = document.getElementById('skin-preview');
const playerName = document.getElementById('player-name');
const downloadBtn = document.getElementById('download-btn');
const langToggle = document.getElementById('lang-toggle');

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

// ========================================
// Core Functions
// ========================================

async function fetchSkin(username) {
  const response = await fetch(`https://minotar.net/skin/${username}`);
  if (!response.ok) {
    throw new Error(t('err_not_found'));
  }
  return await response.blob();
}

async function generateResourcePack(skinBlob) {
  const zip = new JSZip();
  zip.file('pack.mcmeta', JSON.stringify(packMcmeta, null, 2));
  zip.file('assets/item/textures/item/hands/texture.png', skinBlob);
  return await zip.generateAsync({ type: 'blob' });
}

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

function setLoading(loading) {
  fetchBtn.disabled = loading;
  fetchBtn.classList.toggle('loading', loading);
}

function showError(message) {
  errorMsg.textContent = message;
}

function clearError() {
  errorMsg.textContent = '';
}

function showPreview(skinBlob, name) {
  const url = URL.createObjectURL(skinBlob);
  skinPreview.src = url;
  playerName.textContent = name;
  previewSection.classList.remove('hidden');
}

function hidePreview() {
  previewSection.classList.add('hidden');
  currentSkinBlob = null;
  currentPlayerName = '';
}

// ========================================
// Event Handlers
// ========================================

async function handleFetch() {
  const username = mcidInput.value.trim();

  if (!username) {
    showError(t('err_empty'));
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    showError(t('err_invalid'));
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

async function handleDownload() {
  if (!currentSkinBlob) {
    showError(t('err_fetch_first'));
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = t('btn_downloading');

  try {
    const zipBlob = await generateResourcePack(currentSkinBlob);
    downloadBlob(zipBlob, 'Resourcepack for Item Animator.zip');
  } catch (error) {
    showError(t('err_generate'));
    console.error(error);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = t('btn_download');
  }
}

// ========================================
// Event Listeners
// ========================================
fetchBtn.addEventListener('click', handleFetch);
downloadBtn.addEventListener('click', handleDownload);
langToggle.addEventListener('click', toggleLanguage);

mcidInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleFetch();
});

mcidInput.addEventListener('input', () => {
  clearError();
});

// Initialize language on load
applyTranslations();
