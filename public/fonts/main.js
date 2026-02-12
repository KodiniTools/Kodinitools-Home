/**
 * main.js - Coordinates Player, Recorder, Visualizer, and CanvasManager modules.
 * Final version with dynamic custom fonts and removed Google Drive integration.
 */
import { Visualizers } from './visualizers.js';
import { Player } from './player.js';
import { Recorder } from './recorder.js';
import { CanvasManager } from './canvasManager.js';
// Erweiterte Custom Font Configuration basierend auf Ihrer Serverstruktur
const CUSTOM_FONTS = [
    // Alpino Familie
    { name: 'Alpino Black', file: 'Alpino-Black.woff2' },
    { name: 'Alpino Bold', file: 'Alpino-Bold.woff2' },
    { name: 'Alpino Light', file: 'Alpino-Light.woff2' },
    { name: 'Alpino Medium', file: 'Alpino-Medium.woff2' },
    { name: 'Alpino Regular', file: 'Alpino-Regular.woff2' },
    { name: 'Alpino Thin', file: 'Alpino-Thin.woff2' },
    { name: 'Alpino Variable', file: 'Alpino-Variable.woff2' },
    
    // Author Familie
    { name: 'Author Bold', file: 'Author-Bold.woff2' },
    { name: 'Author Bold Italic', file: 'Author-BoldItalic.woff2' },
    { name: 'Author Extralight', file: 'Author-Extralight.woff2' },
    { name: 'Author Extralight Italic', file: 'Author-ExtralightItalic.woff2' },
    { name: 'Author Italic', file: 'Author-Italic.woff2' },
    { name: 'Author Light', file: 'Author-Light.woff2' },
    { name: 'Author Light Italic', file: 'Author-LightItalic.woff2' },
    { name: 'Author Medium', file: 'Author-Medium.woff2' },
    { name: 'Author Medium Italic', file: 'Author-MediumItalic.woff2' },
    { name: 'Author Regular', file: 'Author-Regular.woff2' },
    { name: 'Author Semibold', file: 'Author-Semibold.woff2' },
    { name: 'Author Semibold Italic', file: 'Author-SemiboldItalic.woff2' },
    { name: 'Author Variable', file: 'Author-Variable.woff2' },
    { name: 'Author Variable Italic', file: 'Author-VariableItalic.woff2' },
    
    // ClashDisplay Familie (bereits vorhanden, aber korrigiert)
    { name: 'ClashDisplay Extralight', file: 'ClashDisplay-Extralight.woff2' },
    { name: 'ClashDisplay Light', file: 'ClashDisplay-Light.woff2' },
    { name: 'ClashDisplay Medium', file: 'ClashDisplay-Medium.woff2' },
    { name: 'ClashDisplay Regular', file: 'ClashDisplay-Regular.woff2' },
    { name: 'ClashDisplay Bold', file: 'ClashDisplay-Bold.woff2' },
    { name: 'ClashDisplay Semibold', file: 'ClashDisplay-Semibold.woff2' },
    { name: 'ClashDisplay Variable', file: 'ClashDisplay-Variable.woff2' },
    
    // GeneralSans Familie
    { name: 'GeneralSans Bold', file: 'GeneralSans-Bold.woff2' },
    { name: 'GeneralSans Bold Italic', file: 'GeneralSans-BoldItalic.woff2' },
    { name: 'GeneralSans Extralight', file: 'GeneralSans-Extralight.woff2' },
    { name: 'GeneralSans Extralight Italic', file: 'GeneralSans-ExtralightItalic.woff2' },
    { name: 'GeneralSans Italic', file: 'GeneralSans-Italic.woff2' },
    { name: 'GeneralSans Light', file: 'GeneralSans-Light.woff2' },
    { name: 'GeneralSans Light Italic', file: 'GeneralSans-LightItalic.woff2' },
    { name: 'GeneralSans Medium', file: 'GeneralSans-Medium.woff2' },
    { name: 'GeneralSans Medium Italic', file: 'GeneralSans-MediumItalic.woff2' },
    { name: 'GeneralSans Regular', file: 'GeneralSans-Regular.woff2' },
    { name: 'GeneralSans Semibold', file: 'GeneralSans-Semibold.woff2' },
    { name: 'GeneralSans Semibold Italic', file: 'GeneralSans-SemiboldItalic.woff2' },
    { name: 'GeneralSans Variable', file: 'GeneralSans-Variable.woff2' },
    { name: 'GeneralSans Variable Italic', file: 'GeneralSans-VariableItalic.woff2' },
    
    // Hind Familie
    { name: 'Hind Bold', file: 'Hind-Bold.woff2' },
    { name: 'Hind Light', file: 'Hind-Light.woff2' },
    { name: 'Hind Medium', file: 'Hind-Medium.woff2' },
    { name: 'Hind Regular', file: 'Hind-Regular.woff2' },
    { name: 'Hind SemiBold', file: 'Hind-SemiBold.woff2' },
    { name: 'Hind Variable', file: 'Hind-Variable.woff2' },
    
    // Satoshi Familie (bereits vorhanden, aber vollständig)
    { name: 'Satoshi Light', file: 'Satoshi-Light.woff2' },
    { name: 'Satoshi LightItalic', file: 'Satoshi-LightItalic.woff2' },
    { name: 'Satoshi Bold', file: 'Satoshi-Bold.woff2' },
    { name: 'Satoshi BoldItalic', file: 'Satoshi-BoldItalic.woff2' },
    { name: 'Satoshi Italic', file: 'Satoshi-Italic.woff2' },
    { name: 'Satoshi Medium', file: 'Satoshi-Medium.woff2' },
    { name: 'Satoshi MediumItalic', file: 'Satoshi-MediumItalic.woff2' },
    { name: 'Satoshi Regular', file: 'Satoshi-Regular.woff2' },
    { name: 'Satoshi Black', file: 'Satoshi-Black.woff2' },
    { name: 'Satoshi BlackItalic', file: 'Satoshi-BlackItalic.woff2' },
    { name: 'Satoshi Variable', file: 'Satoshi-Variable.woff2' },
    { name: 'Satoshi Variable Italic', file: 'Satoshi-VariableItalic.woff2' },
    
    // Supreme Familie (bereits vorhanden, aber erweitert)
    { name: 'Supreme Extralight', file: 'Supreme-Extralight.woff2' },
    { name: 'Supreme Thin', file: 'Supreme-Thin.woff2' },
    { name: 'Supreme ThinItalic', file: 'Supreme-ThinItalic.woff2' },
    { name: 'Supreme ExtralightItalic', file: 'Supreme-ExtralightItalic.woff2' },
    { name: 'Supreme Italic', file: 'Supreme-Italic.woff2' },
    { name: 'Supreme Light', file: 'Supreme-Light.woff2' },
    { name: 'Supreme LightItalic', file: 'Supreme-LightItalic.woff2' },
    { name: 'Supreme Regular', file: 'Supreme-Regular.woff2' },
    { name: 'Supreme Bold', file: 'Supreme-Bold.woff2' },
    { name: 'Supreme BoldItalic', file: 'Supreme-BoldItalic.woff2' },
    { name: 'Supreme Extrabold', file: 'Supreme-Extrabold.woff2' },
    { name: 'Supreme ExtraboldItalic', file: 'Supreme-ExtraboldItalic.woff2' },
    { name: 'Supreme Medium', file: 'Supreme-Medium.woff2' },
    { name: 'Supreme MediumItalic', file: 'Supreme-MediumItalic.woff2' },
    { name: 'Supreme Variable', file: 'Supreme-Variable.woff2' },
    { name: 'Supreme VariableItalic', file: 'Supreme-VariableItalic.woff2' },
    
    // Tanker Familie
    { name: 'Tanker Regular', file: 'Tanker-Regular.woff2' },
    
    // Zodiak Familie
    { name: 'Zodiak Black', file: 'Zodiak-Black.woff2' },
    { name: 'Zodiak Black Italic', file: 'Zodiak-BlackItalic.woff2' },
    { name: 'Zodiak Bold', file: 'Zodiak-Bold.woff2' },
    { name: 'Zodiak Bold Italic', file: 'Zodiak-BoldItalic.woff2' },
    { name: 'Zodiak Extrabold', file: 'Zodiak-Extrabold.woff2' },
    { name: 'Zodiak Extrabold Italic', file: 'Zodiak-ExtraboldItalic.woff2' },
    { name: 'Zodiak Italic', file: 'Zodiak-Italic.woff2' },
    { name: 'Zodiak Light', file: 'Zodiak-Light.woff2' },
    { name: 'Zodiak Light Italic', file: 'Zodiak-LightItalic.woff2' },
    { name: 'Zodiak Regular', file: 'Zodiak-Regular.woff2' },
    { name: 'Zodiak Thin', file: 'Zodiak-Thin.woff2' },
    { name: 'Zodiak Thin Italic', file: 'Zodiak-ThinItalic.woff2' },
    { name: 'Zodiak Variable', file: 'Zodiak-Variable.woff2' },
    { name: 'Zodiak Variable Italic', file: 'Zodiak-VariableItalic.woff2' }
];

function loadAndApplyCustomFonts() {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    let fontFaceRules = '';

    fontSelect.innerHTML = ''; 

    CUSTOM_FONTS.forEach(font => {
        const displayName = font.name;

        fontFaceRules += `
            @font-face {
                font-family: '${displayName}';
                src: url('/fonts/${font.file}') format('woff2');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
        `;
        
        const option = document.createElement('option');
        option.value = displayName;
        option.textContent = displayName;
        fontSelect.appendChild(option);
    });

    styleSheet.textContent = fontFaceRules;
    document.head.appendChild(styleSheet);
    console.log(`${CUSTOM_FONTS.length} custom fonts loaded.`);
}
// --- Translation Data ---
const translations = {
    de: {
        pageTitle: "Audio Visualizer Pro",
        homeIconAriaLabel: "Zur Startseite",
        appTitle: "Audio Visualizer Pro",
        appSubtitle: "Erstelle einzigartige Videos mit spektakulären Audio-Visualisierungen.",
        uploadLabel: "1. Audiodateien hochladen",
        bgImageLabel: "2. Bilder-Galerie",
        bgColorLabel: "Hintergrundfarbe",
        pipetteBtn: "Pipette",
        visualizerLabel: "3. Visualisierung wählen",
        visualizerToggleLabel: "An/Aus",
        visualizerToggleTitle: "Visualizer an- oder ausschalten",
        visualizerColorLabel: "Farbe",
        visualizerColorTitle: "Visualizer-Farbe wählen",
        resolutionLabel: "4. Auflösung wählen",
        res720p: "720p HD",
        res1080p: "1080p Full HD",
        res1440p: "1440p QHD",
        qualityLabel: "5. Videoqualität (Bitrate)",
        qualityStandard: "Standard (4 Mbps)",
        qualityHigh: "Hoch (8 Mbps)",
        qualityUltra: "Ultra (15 Mbps)",
        statusInitial: "Bitte eine oder mehrere Audiodateien hochladen.",
        statusHasTrack: "Audio geladen. Bereit für die Aufnahme.",
        statusReady: (w, h) => `🟡 Aufnahme bereit (${w}x${h}). Player starten...`,
        statusRecording: "🔴 Aufnahme läuft...",
        statusPaused: "⏸️ Aufnahme pausiert. Bearbeiten Sie den Canvas.",
        prepareRecBtn: "Aufnahme vorbereiten",
        pauseRecBtn: "Aufnahme pausieren",
        resumeRecBtn: "Aufnahme fortsetzen",
        stopRecBtn: "Aufnahme stoppen & speichern",
        deleteBtn: "Canvas zurücksetzen",
        noFileLoaded: "Keine Datei geladen",
        previewHeader: "Video-Vorschau",
        downloadBtn: "Video herunterladen",
        closePreviewBtn: "Schliessen",
        deleteTrackTitle: "Diesen Titel aus der Playlist entfernen",
        recStatusUploading: (mb) => `Video wird hochgeladen (${mb}MB)...`,
        recStatusProcessing: "Video wird verarbeitet...",
        recStatusDownloadReady: "Video bereit zum Download!",
        recStatusUploadFailed: "Server-Upload fehlgeschlagen, direkter Download...",
        recMimeInfo: (type, w, h, mb) => `Format: ${type} | Auflösung: ${w}x${h} | Größe: ${mb}MB`,
        uploadButtonDefault: "Dateien auswählen",
        uploadButtonWithFiles: (n) => `${n} Datei(en) ausgewählt`,
        bgImageButtonDefault: "Bild zum Canvas hinzufügen",
        bgImageAddNew: "+ Neue Bilder hochladen",
        bgImageNoImage: "Kein Bild",
        setAsBackgroundTitle: "Als vollflächigen Hintergrund festlegen",
        textSettingsLabel: "Texteinstellungen",
        textInputLabel: "Neuer Text",
        placeholderNewText: "Hier Text eingeben...",
        addTextBtn: "Hinzufügen",
        fontFamilyLabel: "Schriftart",
        textColorLabel: "Textfarbe",
        textOpacityLabel: "Text-Deckkraft",
        fontSizeLabel: "Schriftgrösse",
        shadowColorLabel: "Schattenfarbe",
        shadowBlurLabel: "Schatten-Unschärfe",
        shadowXLabel: "Schatten X-Offset",
        shadowYLabel: "Schatten Y-Offset",
        repeatBtnTitle: "Wiederholung umschalten (Playlist / Einzeln)",
        playlistHeader: "Wiedergabeliste",
        clearPlaylistBtn: "Alles löschen"
    },
    en: {
        pageTitle: "Audio Visualizer Pro",
        homeIconAriaLabel: "Back to Home",
        appTitle: "Audio Visualizer Pro",
        appSubtitle: "Create unique videos with spectacular audio visualizations.",
        uploadLabel: "1. Upload Audio Files",
        bgImageLabel: "2. Image Gallery",
        bgColorLabel: "Background Color",
        pipetteBtn: "Eyedropper",
        visualizerLabel: "3. Choose Visualization",
        visualizerToggleLabel: "On/Off",
        visualizerToggleTitle: "Toggle visualizer on or off",
        visualizerColorLabel: "Color",
        visualizerColorTitle: "Choose visualizer color",
        resolutionLabel: "4. Choose Resolution",
        res720p: "720p HD",
        res1080p: "1080p Full HD",
        res1440p: "1440p QHD",
        qualityLabel: "5. Video Quality (Bitrate)",
        qualityStandard: "Standard (4 Mbps)",
        qualityHigh: "High (8 Mbps)",
        qualityUltra: "Ultra (15 Mbps)",
        statusInitial: "Please upload one or more audio files.",
        statusHasTrack: "Audio loaded. Ready to record.",
        statusReady: (w, h) => `🟡 Ready to record (${w}x${h}). Start the player...`,
        statusRecording: "🔴 Recording in progress...",
        statusPaused: "⏸️ Recording paused. Feel free to edit the canvas.",
        prepareRecBtn: "Prepare Recording",
        pauseRecBtn: "Pause Recording",
        resumeRecBtn: "Resume Recording",
        stopRecBtn: "Stop & Save Recording",
        deleteBtn: "Reset Canvas",
        noFileLoaded: "No file loaded",
        previewHeader: "Video Preview",
        downloadBtn: "Download Video",
        closePreviewBtn: "Close",
        deleteTrackTitle: "Remove this track from the playlist",
        recStatusUploading: (mb) => `Uploading video (${mb}MB)...`,
        recStatusProcessing: "Processing video...",
        recStatusDownloadReady: "Video ready for download!",
        recStatusUploadFailed: "Server upload failed, using direct download...",
        recMimeInfo: (type, w, h, mb) => `Format: ${type} | Resolution: ${w}x${h} | Size: ${mb}MB`,
        uploadButtonDefault: "Choose Files",
        uploadButtonWithFiles: (n) => `${n} file(s) selected`,
        bgImageButtonDefault: "Add Image to Canvas",
        bgImageAddNew: "+ Add new images",
        bgImageNoImage: "No Image",
        setAsBackgroundTitle: "Set as fullscreen background",
        textSettingsLabel: "Text Settings",
        textInputLabel: "New Text",
        placeholderNewText: "Enter text here...",
        addTextBtn: "Add Text",
        fontFamilyLabel: "Font Family",
        textColorLabel: "Text Color",
        textOpacityLabel: "Text Opacity",
        fontSizeLabel: "Font Size",
        shadowColorLabel: "Shadow Color",
        shadowBlurLabel: "Shadow Blur",
        shadowXLabel: "Shadow X-Offset",
        shadowYLabel: "Shadow Y-Offset",
        repeatBtnTitle: "Toggle Repeat (Playlist / Single)",
        playlistHeader: "Playlist",
        clearPlaylistBtn: "Clear All"
    }
};

async function saveFileWithPicker(blob, suggestedName) {
  if (window.showSaveFilePicker) {
    const options = {
      suggestedName: suggestedName,
      types: [{
        description: 'Video File',
        accept: { [blob.type]: ['.mp4', '.webm'] },
      }],
    };
    try {
      const fileHandle = await window.showSaveFilePicker(options);
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Error saving file:', err);
    }
  } else {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentLanguage = localStorage.getItem('visualizerLanguage') || 'de';
    let audioContext, analyser, sourceNode, recorder, outputGain;
    let visualizerAnimationFrameId;
    let player;
    let canvasManager;
    let galleryImages = [];
    let isVisualizerEnabled = true;
    let visualizerColor = '#6ea8fe';
    let lastVideoBlob = null;
    let activeTextEditor = null;
    let textEditorListeners = null;

    // --- Elements ---
    const allLangElements = document.querySelectorAll('[data-lang-key]');
    const allLangPlaceholders = document.querySelectorAll('[data-lang-placeholder]');
    const allLangTitles = document.querySelectorAll('[data-lang-title]');
    const langSwitcher = document.getElementById('lang-switcher');
    const audioPlayer = document.getElementById('audioPlayer');
    const canvas = document.getElementById('audio-visualizer');
    const visualizerSelect = document.getElementById('visualizerSelect');
    const visualizerToggle = document.getElementById('visualizerToggle');
    const visualizerColorInput = document.getElementById('visualizerColor');
    const statusBox = document.getElementById('statusBox');
    const prepareRecBtn = document.getElementById('prepareRecBtn');
    const pauseResumeRecBtn = document.getElementById('pauseResumeRecBtn');
    const stopRecBtn = document.getElementById('stopRecBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const resultsPanel = document.getElementById('results-panel');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const bgImageDropdownBtn = document.getElementById('bgImageDropdownBtn');
    const bgImageDropdown = document.getElementById('bgImageDropdown');
    const bgImageFile = document.getElementById('bgImageFile');
    const bgColorInput = document.getElementById('bgColorInput');
    const pipetteBtn = document.getElementById('pipetteBtn');
    const textInput = document.getElementById('textInput');
    const addTextBtn = document.getElementById('addTextBtn');
    const textControls = document.querySelector('.text-controls-grid');
    const fontSelect = document.getElementById('fontSelect');
    const textColorInput = document.getElementById('textColorInput');
    const fontSizeInput = document.getElementById('fontSizeInput');
    const textOpacityInput = document.getElementById('textOpacityInput');
    const shadowColorInput = document.getElementById('shadowColorInput');
    const shadowBlurInput = document.getElementById('shadowBlurInput');
    const shadowXInput = document.getElementById('shadowXInput');
    const shadowYInput = document.getElementById('shadowYInput');
    
    const playerUI = {
        playPauseBtn: document.getElementById('playPauseBtn'),
        stopPlayerBtn: document.getElementById('stopPlayerBtn'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        repeatBtn: document.getElementById('repeatBtn'),
        clearPlaylistBtn: document.getElementById('clearPlaylistBtn'),
        nextBtn: document.getElementById('nextBtn'),
        prevBtn: document.getElementById('prevBtn'),
        progressBar: document.getElementById('progressBar'),
        progressBarContainer: document.getElementById('progressBarContainer'),
        trackName: document.getElementById('trackName'),
        timer: document.getElementById('timer'),
        duration: document.getElementById('duration'),
        trackInfo: document.getElementById('trackInfo'),
        playlistContainer: document.getElementById('playlist-container'),
        fileInput: document.getElementById('audioFile'),
        volumeBtn: document.getElementById('volumeBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeIcon: document.getElementById('volumeIcon'),
        volumeMuteIcon: document.getElementById('volumeMuteIcon'),
    };
    
    const recordingCanvas = document.createElement('canvas');
    const recordingCtx = recordingCanvas.getContext('2d');

    // --- Robuste Funktionen für die In-Canvas-Textbearbeitung ---
    function startTextEditing(textObject) {
        if (activeTextEditor) {
            stopTextEditing();
        }
        canvasManager.setEditing(true);
        const bounds = canvasManager.getObjectBounds(textObject, canvas);
        const canvasRect = canvas.getBoundingClientRect();
        if (!bounds) {
            console.error("Could not get bounds for text object.", textObject);
            canvasManager.setEditing(false);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.id = 'canvas-text-editor';
        textarea.value = textObject.text;
        const absSize = textObject.relSize * canvas.height;
        textarea.style.position = 'absolute';
        textarea.style.left = `${canvasRect.left + window.scrollX + bounds.x}px`;
        textarea.style.top = `${canvasRect.top + window.scrollY + bounds.y}px`;
        textarea.style.width = `${bounds.width + 20}px`;
        textarea.style.height = `${bounds.height + 10}px`;
        textarea.style.font = `bold ${absSize}px ${textObject.fontFamily}`;
        textarea.style.color = textObject.color;
        textarea.style.textAlign = 'center';
        textarea.style.lineHeight = `${absSize * 1.2}px`;
        textarea.style.backgroundColor = 'transparent';
        textarea.style.border = '1px dashed #6ea8fe';
        textarea.style.outline = 'none';
        textarea.style.padding = '0';
        textarea.style.margin = '0';
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';
        textarea.style.whiteSpace = 'pre-wrap';
        textarea.style.zIndex = '100';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        activeTextEditor = textarea;
        textEditorListeners = {
            onInput: () => {
                if (!activeTextEditor || !textObject) return;
                textObject.text = textarea.value;
                const newBounds = canvasManager.getObjectBounds(textObject, canvas);
                if (newBounds) {
                    textarea.style.width = `${newBounds.width + 20}px`;
                    textarea.style.height = `${newBounds.height + 10}px`;
                    textarea.style.left = `${canvasRect.left + window.scrollX + newBounds.x}px`;
                    textarea.style.top = `${canvasRect.top + window.scrollY + newBounds.y}px`;
                }
                redrawStaticallyIfNeeded();
            },
            onKeyDown: (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    stopTextEditing();
                }
                if (e.key === 'Escape') {
                    stopTextEditing();
                }
            },
            onBlur: () => {
                stopTextEditing();
            }
        };
        textarea.addEventListener('input', textEditorListeners.onInput);
        textarea.addEventListener('blur', textEditorListeners.onBlur);
        textarea.addEventListener('keydown', textEditorListeners.onKeyDown);
    }

    function stopTextEditing() {
        if (!activeTextEditor) return;
        const editor = activeTextEditor;
        const listeners = textEditorListeners;
        activeTextEditor = null;
        textEditorListeners = null;
        if (editor && listeners) {
            editor.removeEventListener('input', listeners.onInput);
            editor.removeEventListener('blur', listeners.onBlur);
            editor.removeEventListener('keydown', listeners.onKeyDown);
            if (document.body.contains(editor)) {
                document.body.removeChild(editor);
            }
        }
        canvasManager.setEditing(false);
        redrawStaticallyIfNeeded();
    }

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLanguage = lang;
        localStorage.setItem('visualizerLanguage', lang);
        document.documentElement.lang = lang;
        allLangElements.forEach(el => {
            const key = el.dataset.langKey;
            const translation = translations[lang][key];
            if (translation && typeof translation === 'string') {
                 el.textContent = translation;
            }
        });
        allLangPlaceholders.forEach(el => {
            const key = el.dataset.langPlaceholder;
            const translation = translations[lang][key];
            if (translation) {
                el.placeholder = translation;
            }
        });
        allLangTitles.forEach(el => {
            const key = el.dataset.langTitle;
            const translation = translations[lang][key];
            if(translation) {
                el.setAttribute('title', translation);
            }
        });
        if(visualizerSelect) {
            visualizerSelect.querySelectorAll('option').forEach(option => {
                const key = option.value;
                if (Visualizers[key]) {
                    const nameKey = `name_${lang}`;
                    option.textContent = Visualizers[key][nameKey] || Visualizers[key].name_de || key;
                }
            });
        }
        if (langSwitcher) {
            langSwitcher.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
        }
        if (player) player.renderPlaylist();
        updateUIState();
        renderBgImageDropdown();
    }

    function updateUIState() {
        const langDict = translations[currentLanguage];
        const hasTrack = player && player.playlist.length > 0;
        const isPrepared = recorder && recorder.isPrepared;
        const isRecording = recorder && recorder.isActive;
        const isPaused = recorder && recorder.isPaused;

        if(prepareRecBtn) prepareRecBtn.style.display = isRecording ? 'none' : 'inline-flex';
        if(pauseResumeRecBtn) pauseResumeRecBtn.style.display = isRecording ? 'inline-flex' : 'none';

        if (prepareRecBtn) prepareRecBtn.disabled = !hasTrack || isPrepared;
        if (stopRecBtn) stopRecBtn.disabled = !isPrepared;

        const isCanvasEmpty = canvasManager ? canvasManager.isCanvasEmpty() : true;
        if (deleteBtn) deleteBtn.disabled = isCanvasEmpty;
        
        if (playerUI.clearPlaylistBtn) playerUI.clearPlaylistBtn.disabled = !hasTrack;

        if (isPaused) {
            statusBox.textContent = langDict.statusPaused;
            statusBox.className = 'status-box paused';
            if(pauseResumeRecBtn) pauseResumeRecBtn.textContent = langDict.resumeRecBtn;
        } else if (isRecording) {
            statusBox.textContent = langDict.statusRecording;
            statusBox.className = 'status-box recording';
            if(pauseResumeRecBtn) pauseResumeRecBtn.textContent = langDict.pauseRecBtn;
        } else if (isPrepared) {
            statusBox.textContent = langDict.statusReady(recordingCanvas.width, recordingCanvas.height);
            statusBox.className = 'status-box ready';
        } else if (hasTrack) {
            statusBox.textContent = langDict.statusHasTrack;
            statusBox.className = 'status-box';
        } else {
            statusBox.textContent = langDict.statusInitial;
            statusBox.className = 'status-box';
            if(playerUI.trackName) playerUI.trackName.textContent = langDict.noFileLoaded;
        }

        document.querySelectorAll('.delete-track-btn').forEach(btn => {
            btn.title = langDict.deleteTrackTitle;
        });

        const fileUploadText = document.getElementById('fileUploadText');
        if (fileUploadText) {
            if (player && player.playlist.length > 0) {
                fileUploadText.textContent = langDict.uploadButtonWithFiles(player.playlist.length);
            } else {
                fileUploadText.textContent = langDict.uploadButtonDefault;
            }
        }

        const bgImageDropdownText = document.getElementById('bgImageDropdownText');
        if(bgImageDropdownText) bgImageDropdownText.textContent = langDict.bgImageButtonDefault;
    }

    function renderBgImageDropdown() {
        if (!bgImageDropdown) return;
        const langDict = translations[currentLanguage];
        const existingItems = bgImageDropdown.querySelectorAll('.custom-dropdown-item:not(.add-new)');
        existingItems.forEach(item => item.remove());

        if (galleryImages.length === 0) {
            const noImageItem = document.createElement('div');
            noImageItem.className = 'custom-dropdown-item disabled';
            noImageItem.innerHTML = `<span class="dropdown-item-name">${langDict.bgImageNoImage}</span>`;
            bgImageDropdown.insertBefore(noImageItem, bgImageDropdown.querySelector('.add-new'));
        }

        galleryImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'custom-dropdown-item';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'dropdown-item-name';
            nameSpan.textContent = img.name;
            nameSpan.addEventListener('click', () => {
                canvasManager.addImage(img.imageObject);
                bgImageDropdown.style.display = 'none';
            });
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'dropdown-item-actions';
            const setBgBtn = document.createElement('button');
            setBgBtn.className = 'gallery-btn';
            setBgBtn.title = langDict.setAsBackgroundTitle;
            setBgBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 15-5-5h3V9h4v4h3l-5 5z"></path></svg>`;
            setBgBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                canvasManager.setBackground(img.imageObject);
                bgImageDropdown.style.display = 'none';
            });
            const removeBtn = document.createElement('button');
            removeBtn.className = 'gallery-btn remove-btn';
            removeBtn.title = 'Bild aus Galerie entfernen';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeGalleryImage(index);
            });
            actionsDiv.appendChild(setBgBtn);
            actionsDiv.appendChild(removeBtn);
            item.appendChild(nameSpan);
            item.appendChild(actionsDiv);
            bgImageDropdown.insertBefore(item, bgImageDropdown.querySelector('.add-new'));
        });
    }

    function removeGalleryImage(index) {
        if (index < 0 || index >= galleryImages.length) return;
        const removedImage = galleryImages.splice(index, 1)[0];
        const canvasState = canvasManager.getCanvasState();
        if (canvasState.background === removedImage.imageObject) {
            canvasManager.setBackground(null);
        }
        if(canvasState.images.some(img => img.imageObject === removedImage.imageObject)) {
           canvasManager.reset();
        }
        URL.revokeObjectURL(removedImage.url);
        updateUIState();
        renderBgImageDropdown();
        redrawStaticallyIfNeeded();
    }

    function updateControlsForActiveObject(activeObject) {
        const isText = activeObject && activeObject.type === 'text';
        if (textControls) {
            textControls.querySelectorAll('input, select').forEach(el => {
                const isCreationControl = el.id === 'textInput' || el.id === 'addTextBtn';
                if (!isCreationControl) {
                    el.disabled = !isText;
                }
            });
        }
        if (isText) {
            fontSelect.value = activeObject.fontFamily;
            textColorInput.value = activeObject.color;
            fontSizeInput.value = activeObject.relSize * 1080;
            textOpacityInput.value = activeObject.opacity;
            shadowColorInput.value = activeObject.shadow.color;
            shadowBlurInput.value = activeObject.shadow.blur;
            shadowXInput.value = activeObject.shadow.offsetX;
            shadowYInput.value = activeObject.shadow.offsetY;
        }
    }
    
    async function initializeApplication() {
        player = new Player(audioPlayer, playerUI, updateUIState);
        canvasManager = new CanvasManager(canvas, redrawStaticallyIfNeeded, updateControlsForActiveObject, updateUIState, startTextEditing);
        canvasManager.setupInteractionHandlers(); 
        
        loadAndApplyCustomFonts(); // LÄDT EIGENE SCHRIFTEN
        
        setupEventListeners();
        populateVisualizerSelect();
        resizeCanvas();
        setLanguage(currentLanguage);
    }

    async function initAudioContextAndAnalyser() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') await audioContext.resume();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;
        sourceNode = audioContext.createMediaElementSource(audioPlayer);
        outputGain = audioContext.createGain();
        outputGain.gain.value = audioPlayer.volume;
        const visualizerGain = audioContext.createGain();
        visualizerGain.gain.value = 1.2;
        const recordingDest = audioContext.createMediaStreamDestination();
        if (!recorder) {
            recorder = new Recorder(recordingCanvas, player, audioPlayer, recordingDest.stream, { prepareRecBtn, stopRecBtn, statusBox }, updateUIState);
        }
        sourceNode.connect(outputGain);
        sourceNode.connect(visualizerGain);
        outputGain.connect(audioContext.destination);
        visualizerGain.connect(analyser);
        visualizerGain.connect(recordingDest);
    }
    
    function loadAndApplyCustomFonts() {
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        let fontFaceRules = '';

        fontSelect.innerHTML = ''; 

        CUSTOM_FONTS.forEach(font => {
            // Der Anzeigename im Dropdown (z.B. "Supreme Medium Italic")
            const displayName = font.name.replace(/-/g, ' ');

            fontFaceRules += `
                @font-face {
                    font-family: '${displayName}';
                    src: url('./fonts/${font.file}') format('woff2');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
            `;
            const option = document.createElement('option');
            option.value = displayName;
            option.textContent = displayName;
            fontSelect.appendChild(option);
        });

        styleSheet.textContent = fontFaceRules;
        document.head.appendChild(styleSheet);
        console.log(`${CUSTOM_FONTS.length} custom fonts loaded.`);
    }

    function setupVolumeSync() {
        if (outputGain && audioPlayer) {
            audioPlayer.addEventListener('volumechange', () => {
                outputGain.gain.value = audioPlayer.volume;
            });
        }
    }

    function drawVisualizer() {
        visualizerAnimationFrameId = requestAnimationFrame(drawVisualizer);
        if (!analyser || !canvasManager) return;
        const ctx = canvas.getContext('2d');
        canvasManager.draw(ctx);
        const isActuallyPlaying = !audioPlayer.paused;
        const shouldDrawVisualizerEffect = isVisualizerEnabled && !audioPlayer.muted && isActuallyPlaying;
        if (shouldDrawVisualizerEffect) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const visualizer = Visualizers[visualizerSelect.value];
            if (visualizer) {
                if (visualizer.needsTimeData) analyser.getByteTimeDomainData(dataArray);
                else analyser.getByteFrequencyData(dataArray);
                visualizer.draw(ctx, dataArray, bufferLength, canvas.width, canvas.height, visualizerColor);
            }
        }
        if (recorder && (recorder.isActive || recorder.isPrepared)) {
            canvasManager.draw(recordingCtx);
            if (shouldDrawVisualizerEffect && Visualizers[visualizerSelect.value]) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                if (Visualizers[visualizerSelect.value].needsTimeData) analyser.getByteTimeDomainData(dataArray);
                else analyser.getByteFrequencyData(dataArray);
                Visualizers[visualizerSelect.value].draw(recordingCtx, dataArray, bufferLength, recordingCanvas.width, recordingCanvas.height, visualizerColor);
            }
        }
    }

    function stopAndResetVisualizer() {
        if (visualizerAnimationFrameId) {
            cancelAnimationFrame(visualizerAnimationFrameId);
            visualizerAnimationFrameId = null;
        }
        if(canvasManager) canvasManager.draw(canvas.getContext('2d'));
    }

    function redrawStaticallyIfNeeded() {
        if (!visualizerAnimationFrameId) {
             if(canvasManager) canvasManager.draw(canvas.getContext('2d'));
        }
    }

    function populateVisualizerSelect() {
        if (!visualizerSelect) return;
        for (const key in Visualizers) {
            const option = document.createElement('option');
            option.value = key;
            const nameKey = `name_${currentLanguage}`;
            option.textContent = Visualizers[key][nameKey] || Visualizers[key].name_de || key;
            visualizerSelect.appendChild(option);
        }
        visualizerSelect.value = 'bars';
    }

    function resizeCanvas() {
        const computedStyle = getComputedStyle(canvas);
        const cssWidth = parseInt(computedStyle.width);
        if (canvas.width !== cssWidth) canvas.width = cssWidth;
        if (canvas.height !== cssWidth * (9/16)) canvas.height = cssWidth * (9/16);
        redrawStaticallyIfNeeded();
    }

    function setupEventListeners() {
        if (langSwitcher) {
            langSwitcher.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    setLanguage(e.target.dataset.lang);
                }
            });
        }
        if (bgImageDropdownBtn) {
            bgImageDropdownBtn.addEventListener('click', () => {
                if(bgImageDropdown) {
                    bgImageDropdown.style.display = bgImageDropdown.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
        document.addEventListener('click', (e) => {
            if (bgImageDropdownBtn && !bgImageDropdownBtn.contains(e.target) && bgImageDropdown && !bgImageDropdown.contains(e.target)) {
                bgImageDropdown.style.display = 'none';
            }
        });
        if (bgImageFile) {
            bgImageFile.addEventListener('change', (e) => {
                for(const file of e.target.files) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            galleryImages.push({ name: file.name, url: event.target.result, imageObject: img });
                            renderBgImageDropdown();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
                bgImageFile.value = '';
                if(bgImageDropdown) bgImageDropdown.style.display = 'none';
            });
        }
        if (bgColorInput) {
            bgColorInput.addEventListener('input', (e) => {
                canvasManager.setBackground(e.target.value);
            });
        }
        if (pipetteBtn) {
            pipetteBtn.addEventListener('click', async () => {
                if (!('EyeDropper' in window)) {
                    alert('Dein Browser unterstützt die Pipetten-Funktion nicht.');
                    return;
                }
                try {
                    const eyeDropper = new EyeDropper();
                    const result = await eyeDropper.open();
                    const selectedColor = result.sRGBHex;
                    bgColorInput.value = selectedColor;
                    canvasManager.setBackground(selectedColor);
                } catch (e) {
                    console.log('Pipette-Auswahl abgebrochen.');
                }
            });
        }
        if (visualizerColorInput) {
            visualizerColorInput.addEventListener('input', (e) => {
                visualizerColor = e.target.value;
                redrawStaticallyIfNeeded();
            });
        }
        if (visualizerToggle) {
            visualizerToggle.addEventListener('change', (e) => {
                isVisualizerEnabled = e.target.checked;
                redrawStaticallyIfNeeded();
            });
        }
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => {
                if (textInput.value.trim()) {
                    canvasManager.addText(textInput.value.trim());
                    textInput.value = '';
                }
            });
        }
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                canvasManager.updateActiveObjectProperty('fontFamily', e.target.value);
            });
        }
        if (textColorInput) {
            textColorInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('color', e.target.value);
            });
        }
        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('relSize', e.target.value / 1080);
            });
        }
        if (textOpacityInput) {
            textOpacityInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('opacity', parseFloat(e.target.value));
            });
        }
        if (shadowColorInput) {
            shadowColorInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('shadow.color', e.target.value);
            });
        }
        if (shadowBlurInput) {
            shadowBlurInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('shadow.blur', parseInt(e.target.value, 10));
            });
        }
        if (shadowXInput) {
            shadowXInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('shadow.offsetX', parseInt(e.target.value, 10));
            });
        }
        if (shadowYInput) {
            shadowYInput.addEventListener('input', (e) => {
                canvasManager.updateActiveObjectProperty('shadow.offsetY', parseInt(e.target.value, 10));
            });
        }
        if (prepareRecBtn) {
            prepareRecBtn.addEventListener('click', async () => {
                await initAudioContextAndAnalyser();
                if (recorder) recorder.prepare();
            });
        }
        if (pauseResumeRecBtn) {
            pauseResumeRecBtn.addEventListener('click', () => {
                if (recorder) {
                    if(recorder.isPaused) recorder.resume();
                    else recorder.pause();
                }
            });
        }
        if (stopRecBtn) {
            stopRecBtn.addEventListener('click', async () => {
                if (player) player.stop();
                if (recorder) {
                    lastVideoBlob = await recorder.stop();
                    updateUIState();
                }
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (recorder?.isActive) await recorder.stop();
                canvasManager.reset();
                lastVideoBlob = null;
                if (bgColorInput) bgColorInput.value = '#000000';
                updateUIState();
            });
        }
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => {
                if (resultsPanel) resultsPanel.style.display = 'none';
                const previewVideo = document.getElementById('preview');
                if(previewVideo) {
                    previewVideo.pause();
                    if(previewVideo.src.startsWith('blob:')) {
                        URL.revokeObjectURL(previewVideo.src);
                    }
                    previewVideo.src = "";
                }
                lastVideoBlob = null;
                const downloadLink = document.getElementById('downloadLink');
                if(downloadLink) downloadLink.blob = null;
                updateUIState();
            });
        }
        if (visualizerSelect) {
            visualizerSelect.addEventListener('change', () => {
                if (Visualizers[visualizerSelect.value]?.init) {
                    Visualizers[visualizerSelect.value].init(canvas.width, canvas.height);
                }
                redrawStaticallyIfNeeded();
            });
        }
        if (audioPlayer) {
            audioPlayer.addEventListener('playing', async () => {
                if (!audioContext) await initAudioContextAndAnalyser();
                if (audioContext?.state === 'suspended') await audioContext.resume();
                if (recorder?.isPrepared && !recorder.isActive && !recorder.isPaused) {
                    recorder.start();
                }
                if (!visualizerAnimationFrameId) {
                    drawVisualizer();
                }
            });
            audioPlayer.addEventListener('pause', () => {
                if (!recorder || !recorder.isPaused) {
                    stopAndResetVisualizer();
                }
            });
            audioPlayer.addEventListener('ended', async () => {
                if (recorder?.isActive && player.currentTrackIndex === player.playlist.length - 1 && !player.isLooping) {
                    lastVideoBlob = await recorder.stop();
                    updateUIState();
                }
            });
        }
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('keydown', (e) => {
            if (activeTextEditor) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement.tagName.toLowerCase() !== 'input' && document.activeElement.tagName.toLowerCase() !== 'textarea') {
                    canvasManager.deleteActiveObject();
                }
            }
        });
        const downloadLink = document.getElementById('downloadLink'); 
        if(downloadLink) {
            downloadLink.addEventListener('click', async (e) => { 
                e.preventDefault(); 
                if (e.currentTarget.blob) {
                    await saveFileWithPicker(e.currentTarget.blob, e.currentTarget.download);
                } 
                else if (e.currentTarget.href && e.currentTarget.href !== '#') {
                    const tempLink = document.createElement('a');
                    tempLink.href = e.currentTarget.href;
                    tempLink.download = e.currentTarget.download || 'video.mp4';
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                }
            });
        }
    }
    
    initializeApplication();
});

