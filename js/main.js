// js/main.js
// 负责地图初始化、标点加载、弹窗控制、多语言/主题切换，以及应用启动流程

// --- 全局变量 ----------------------------------------------------------------
let currentLang = 'ca';
let map;
let buildingsData = [];
let panelKeyHandler = null; // reference for keyboard handler
let swiperInstance = null; // Swiper instance reference
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

// --- 坐标工具 ----------------------------------------------------------------
// 在 L.CRS.Simple 下坐标数组 [x, y] 直接对应像素
// Leaflet marker 需要 [lat, lng]，所以【数据中的 x 是 lng，y 是 lat】
function toPixel(latlng) {
    return {
        x: Math.round(latlng.lng),   // x = lng（水平轴）
        y: Math.round(latlng.lat)    // y = lat（竖直轴）
    };
}

function pixelString(pt) {
    return `x: ${pt.x}, y: ${pt.y}`;
}

// 若需从 [x,y] 创建 LatLng（用于数据定位）
function pointToLatLng(x, y) {
    return L.latLng(y, x);  // Leaflet 需要 [lat, lng]，我们传 [y, x]
}

// 在事件中使用：const pt = toPixel(e.latlng);


// ---------- 地图相关 --------------------------------------------------------
function initMap() {
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 2,
        zoomControl: false
    });

    const bounds = [[0, 0], [1000, 1000]]; // 根据地图实际像素尺寸调整
    // 使用本地地图图片（项目中已包含 assets/map.jpeg）
    // 注意：Leaflet 对大小写敏感，确保路径和扩展名正确
    L.imageOverlay('assets/map.jpeg', bounds).addTo(map);

    map.fitBounds(bounds);

    map.on('click', (e) => {
        closePanel();
        const pt = toPixel(e.latlng);
        console.log('map clicked at', pt);
    });

    // 坐标显示/调试工具
    const coordEl = document.getElementById('coord-display');
    map.on('mousemove', (e) => {
        const pt = toPixel(e.latlng);
        coordEl.textContent = pixelString(pt);
    });
    map.on('mouseout', () => {
        coordEl.textContent = '';
    });
}

async function loadData() {
    try {
        const response = await fetch('data/buildings.json');
        buildingsData = await response.json();

        buildingsData.forEach(building => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-pulse"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker(
                pointToLatLng(building.coords[0], building.coords[1]),
                { icon: icon }
            ).addTo(map);

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                showPanel(building);
            });
        });
    } catch (err) {
        console.error('无法加载建筑数据:', err);
    }
}

function cleanupPanelExtras() {
    const oldActions = panel.querySelector('#panel-actions');
    if (oldActions) oldActions.remove();
    const oldSeparator = panel.querySelector('.content-separator');
    if (oldSeparator) oldSeparator.remove();
}

// ---------- 侧滑面板 --------------------------------------------------------
const panel = document.getElementById('detail-panel');
const titleEl = document.getElementById('panel-title');
const descEl = document.getElementById('panel-desc');
const mediaEl = document.getElementById('panel-media');
let currentBuilding = null;

function showPanel(building) {
    currentBuilding = building;
    updatePanelContent();
    panel.classList.add('show');
}

function closePanel() {
    panel.classList.remove('show');
    currentBuilding = null;
    // remove keyboard handler when closing
    if (panelKeyHandler) {
        document.removeEventListener('keydown', panelKeyHandler);
        panelKeyHandler = null;
    }
    cleanupPanelExtras();
    // destroy swiper instance if exists
    if (swiperInstance && typeof swiperInstance.destroy === 'function') {
        try { swiperInstance.destroy(true, true); } catch (e) { /* ignore */ }
        swiperInstance = null;
    }
}

function openLightbox(src) {
    if (!lightboxOverlay || !lightboxImage) return;
    lightboxImage.src = src;
    lightboxOverlay.classList.add('show');
}

function closeLightbox() {
    if (!lightboxOverlay) return;
    lightboxOverlay.classList.remove('show');
}

// 灯箱关闭事件
if (lightboxOverlay) lightboxOverlay.addEventListener('click', (e) => { if (e.target === lightboxOverlay) closeLightbox(); });
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);


function updatePanelContent() {
    if (!currentBuilding) return;

    const content = currentBuilding.content[currentLang];
    titleEl.textContent = content.title;
    descEl.textContent = content.desc;

    // Clear previous dynamic content
    mediaEl.innerHTML = '';
    cleanupPanelExtras();

    const medias = Array.isArray(currentBuilding.media) ? currentBuilding.media : [currentBuilding.media];

    // use Swiper.js for robust swipe/arrow support when available
    const imageItems = medias.filter(m => m.type === 'image');
    const otherItems = medias.filter(m => m.type !== 'image');

    if (imageItems.length > 0 && typeof Swiper !== 'undefined') {
        // destroy existing instance if any
        if (swiperInstance && typeof swiperInstance.destroy === 'function') {
            try { swiperInstance.destroy(true, true); } catch (e) { /* ignore */ }
            swiperInstance = null;
        }

        const container = document.createElement('div');
        container.className = 'swiper mySwiper';
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';

        imageItems.forEach(it => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            const img = document.createElement('img');
            img.src = encodeURI(it.src);
            img.alt = content.title || '';
            img.addEventListener('click', () => {
                openLightbox(img.src);
            });
            slide.appendChild(img);
            wrapper.appendChild(slide);
        });

        container.appendChild(wrapper);

        const prevEl = document.createElement('div');
        prevEl.className = 'swiper-button-prev';
        const nextEl = document.createElement('div');
        nextEl.className = 'swiper-button-next';
        container.appendChild(prevEl);
        container.appendChild(nextEl);

        mediaEl.appendChild(container);
        mediaEl.appendChild(prevEl);
        mediaEl.appendChild(nextEl);

        // prevent Leaflet from intercepting clicks
        if (typeof L !== 'undefined' && L.DomEvent && L.DomEvent.disableClickPropagation) {
            L.DomEvent.disableClickPropagation(container);
            // The buttons are now outside, so this might not be needed for them
            // but we keep it for the container itself.
        }

        // init Swiper
        swiperInstance = new Swiper(container, {
            navigation: { nextEl: nextEl, prevEl: prevEl },
            loop: false,
            grabCursor: true,
            keyboard: { enabled: true },
            centeredSlides: true,
            spaceBetween: 8,
            preloadImages: true,
            lazy: false
        });
    } else if (imageItems.length === 1) {
        const img = document.createElement('img');
        img.src = encodeURI(imageItems[0].src);
        img.alt = content.title || '';
        img.addEventListener('click', () => {
            openLightbox(img.src);
        });
        mediaEl.appendChild(img);
    } else {
        // no images — leave empty or show placeholder
    }

    // Create a new container for action buttons (like PDF)
    const actionsContainer = document.createElement('div');
    actionsContainer.id = 'panel-actions';

    otherItems.forEach(item => {
        if (item.type === 'pdf') {
            const link = document.createElement('a');
            link.href = encodeURI(item.src);
            link.target = '_blank';
            link.className = 'btn-common btn-primary'; // Use unified and primary classes
            link.setAttribute('role', 'button');

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-file-arrow-down';

            const textSpan = document.createElement('span');
            textSpan.textContent = i18next.t('view_pdf_button') || 'View Document';

            link.appendChild(icon);
            link.appendChild(textSpan);
            actionsContainer.appendChild(link);
        }
    });

    // If there are actions, add the container and a separator
    if (actionsContainer.hasChildNodes()) {
        mediaEl.after(actionsContainer);
        const separator = document.createElement('hr');
        separator.className = 'content-separator';
        actionsContainer.after(separator);
    }
}

document.getElementById('close-panel').addEventListener('click', closePanel);

// ---------- 多语言/主题 ----------------------------------------------------
const langModal = document.getElementById('lang-modal');

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('prefLang', lang);
    i18next.changeLanguage(lang, () => {
        updateStaticText();
        if (panel.classList.contains('show')) {
            updatePanelContent();
        }
    });
    // 选择语言后关闭模态框，让地图显现
    langModal.style.display = 'none';
}

function updateStaticText() {
    // 静态界面元素
    document.getElementById('lang-title').textContent = i18next.t('select_language');
    document.getElementById('theme-toggle').setAttribute('aria-label', i18next.t('toggle_theme'));
    document.getElementById('lang-toggle').setAttribute('aria-label', i18next.t('change_language'));
    // 其他需要翻译的元素可以在这里补充
    document.documentElement.lang = currentLang;
}

// 语言按钮绑定
function bindLanguageButtons() {
    document.querySelectorAll('.lang-options button').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
}

// 语言面板重新打开
document.getElementById('lang-toggle').addEventListener('click', () => {
    langModal.style.display = 'flex';
});

// 主题切换
const themeToggle = document.getElementById('theme-toggle');
const bodyEl = document.body;

themeToggle.addEventListener('click', () => {
    bodyEl.classList.toggle('theme-dark');
    const isDark = bodyEl.classList.contains('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ---------- 启动 ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 先初始化 i18n，加载语言资源
    await initI18n();

    bindLanguageButtons();

    initMap();
    await loadData();

    const savedLang = localStorage.getItem('prefLang');
    if (savedLang) {
        setLanguage(savedLang);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        bodyEl.classList.add('theme-dark');
    }
});
