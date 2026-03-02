// js/main.js
// 负责地图初始化、标点加载、弹窗控制、多语言/主题切换，以及应用启动流程

// --- 全局变量 ----------------------------------------------------------------
let currentLang = 'ca';
let map;
let buildingsData = [];
let panelKeyHandler = null; // reference for keyboard handler
let swiperInstance = null; // Swiper instance reference

// 地图底图切换相关变量
let osmLayer, satelliteLayer;
let currentBase = 'satellite'; // 当前底图（默认为卫星）
const mapToggleBtn = () => document.getElementById('map-toggle');

const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

// --- 坐标工具 ----------------------------------------------------------------
// 地图使用标准 WGS84 坐标系统 (EPSG:4326)
// JSON 数据中 coords 格式为 [latitude, longitude]
// Leaflet marker 需要 [lat, lng]，顺序相同
function toPixel(latlng) {
    return {
        x: latlng.lng.toFixed(6),   // x = lng（水平轴），保留小数便于调试
        y: latlng.lat.toFixed(6)    // y = lat（竖直轴）
    };
}

function pixelString(pt) {
    // pt.x is longitude, pt.y is latitude as string with fixed decimals
    return `Lng: ${pt.x}, Lat: ${pt.y}`;
}

// 若需从 [x,y] 创建 LatLng（用于数据定位）
function pointToLatLng(x, y) {
    return L.latLng(y, x);  // Leaflet 需要 [lat, lng]，我们传 [y, x]
}

// 在事件中使用：const pt = toPixel(e.latlng);


// ---------- 地图相关 --------------------------------------------------------
function initMap() {
    // ------------------------------------------------------------
    // 切换到真实经纬度地图，默认定位到 La Trinitat Nova 社区。
    // 可在需要时调整中心坐标或者 zoom 级别。若希望完全锁定缩放,
    // 可以将 minZoom/maxZoom 设置为相同值。
    // ------------------------------------------------------------
    const defaultZoom = 15;

    // create map without specific center; will be set after markers are added
    map = L.map('map', {
        zoom: defaultZoom,
        minZoom: 12,
        maxZoom: 19,
        zoomControl: true,
        center: [0,0]
    });

    // --- 底图图层 ----------------------------------------------------------------
    // 街道图 (OpenStreetMap)
    osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 贡献者'
    });

    // 卫星图 (Esri World Imagery) - 需要在 index.html 中引入 esri-leaflet 插件
    satelliteLayer = L.esri.tiledMapLayer({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        attribution: '来源: Esri, Maxar, Earthstar Geographics 及 GIS 用户社区',
        maxZoom: 19
    });

    // 默认使用卫星图
    satelliteLayer.addTo(map);

    // 图层控制器允许用户在街道/卫星之间切换
    const baseMaps = {
        "街道地图": osmLayer,
        "卫星地图": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(map);

    // 将切换按钮样式同步为当前状态
    updateMapButton();

    // 添加自定义类名到 Leaflet 默认控制容器，便于合并/重新命名或单独样式
    if (map && map._controlContainer) {
        map._controlContainer.classList.add('custom-control-container');
        // 若需要可以移到 .ui-controls 内：
        // const ui = document.querySelector('.ui-controls');
        // if (ui && map._controlContainer.parentNode !== ui) {
        //     ui.appendChild(map._controlContainer);
        // }
    }

    // 地图范围将在加载数据后根据建筑点计算以避免硬编码

    // 点击事件保持不变，但坐标单位已经变为经纬度
    map.on('click', () => {
        // clicking on empty map simply closes any open panel
        closePanel();
    });

    // 坐标显示/调试工具 (现在显示经纬度)
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

        const latlngs = [];
        buildingsData.forEach(building => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-pulse"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // 数据中 coords 格式：[latitude, longitude]
            // Leaflet marker 需要 [lat, lng]，直接传递
            const lat = building.coords[0];
            const lng = building.coords[1];
            latlngs.push([lat, lng]);

            const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                showPanel(building);
            });
        });

        // 一旦所有标记添加，调整地图视图并限制范围
        if (latlngs.length) {
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds.pad(0.2)); // add some padding
            map.setMaxBounds(bounds.pad(0.3));
        }
    } catch (err) {
        console.error('无法加载建筑数据:', err);
    }
}

function cleanupPanelExtras() {
    const oldActions = panel.querySelector('#panel-actions');
    if (oldActions) oldActions.remove();
    const oldSeparator = panel.querySelector('.content-separator');
    if (oldSeparator) oldSeparator.remove();
    const oldCoords = panel.querySelector('.panel-coords');
    if (oldCoords) oldCoords.remove();
}

// ---------- 侧滑面板 --------------------------------------------------------
const panel = document.getElementById('detail-panel');
const titleEl = document.getElementById('panel-title');
const descEl = document.getElementById('panel-desc');
const mediaEl = document.getElementById('panel-media');
let currentBuilding = null;

function showPanel(building) {
    // clear any coordinate-only state
    panel.classList.remove('coordinates-only');
    currentBuilding = building;
    updatePanelContent();
    panel.classList.add('show');
}

function closePanel() {
    panel.classList.remove('show');
    panel.classList.remove('coordinates-only');
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

    // coordinates paragraph
    const coords = currentBuilding.coords;
    if (coords && coords.length === 2) {
        const coordInfo = document.createElement('p');
        coordInfo.className = 'panel-coords';
        // coords 格式：[latitude, longitude]
        coordInfo.textContent = `Lat: ${coords[0].toFixed(6)}, Lng: ${coords[1].toFixed(6)}`;
        // insert above description
        descEl.parentNode.insertBefore(coordInfo, descEl);
    }

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
    document.getElementById('map-toggle').setAttribute('aria-label', i18next.t('toggle_map'));
    // 其他需要翻译的元素可以在这里补充
    document.documentElement.lang = currentLang;

    // If panel is showing coordinates only, update its title
    if (panel.classList.contains('coordinates-only')) {
        titleEl.textContent = i18next.t('coords_title');
    }
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

// 地图视图切换 (街道 / 卫星)
function updateMapButton() {
    const btn = mapToggleBtn();
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (currentBase === 'satellite') {
        btn.classList.add('active');
        if (icon) icon.className = 'fa-solid fa-satellite';
    } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'fa-solid fa-map';
    }
}

function toggleMapMode() {
    if (currentBase === 'satellite') {
        map.removeLayer(satelliteLayer);
        osmLayer.addTo(map);
        currentBase = 'osm';
    } else {
        map.removeLayer(osmLayer);
        satelliteLayer.addTo(map);
        currentBase = 'satellite';
    }
    updateMapButton();
}

const mapToggle = mapToggleBtn();
if (mapToggle) {
    mapToggle.addEventListener('click', toggleMapMode);
}

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
