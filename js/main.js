/**
 * js/main.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 主应用模块 | Main Application Module
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 核心职责 (Primary Responsibilities):
 * • 地图初始化与配置 (Map initialization & configuration)
 * • 历史建筑数据加载 (Historical building data loading)
 * • 标点标记与交互 (Marker placement & interaction)
 * • 侧滑面板控制 (Side panel management)
 * • 多语言切换 (Multilingual support)
 * • 日/夜主题切换 (Light/Dark theme toggle)
 * • 坐标信息显示 (Coordinate display system)
 * • 图片灯箱展示 (Lightbox functionality)
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全局变量声明 | Global Variable Declarations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 当前活动语言 | Current active language (default: Catalan) */
let currentLang = 'ca';

/** Leaflet 地图实例 | Leaflet map instance */
let map;

/** 从 buildings.json 加载的建筑数据 | Building data loaded from JSON */
let buildingsData = [];

/** 侧面板键盘事件处理器 | Side panel keyboard event handler reference */
let panelKeyHandler = null;

/** Swiper 轮播实例 (用于媒体展示) | Swiper carousel instance for media gallery */
let swiperInstance = null;

/** 当前显示的坐标弹出框 | Current visible coordinate popup */
let currentCoordPopup = null;

// ───────────────────────────────────────────────────────
// 地图图层 | Map Layers
// ───────────────────────────────────────────────────────

/** OpenStreetMap 街道图层 | OSM street map layer */
let osmLayer;

/** Esri World Imagery 卫星图层 | Esri satellite imagery layer */
let satelliteLayer;

/** 当前活跃底图类型 | Current active base map type (default: satellite) */
let currentBase = 'satellite';

/** 地图切换按钮 getter | Map toggle button element reference */
const mapToggleBtn = () => document.getElementById('map-toggle');

// ───────────────────────────────────────────────────────
// 灯箱元素 | Lightbox Elements
// ───────────────────────────────────────────────────────

/** 灯箱覆盖层 | Lightbox overlay container */
const lightboxOverlay = document.getElementById('lightbox-overlay');

/** 灯箱图片 | Lightbox image element */
const lightboxImage = document.getElementById('lightbox-image');

/** 灯箱关闭按钮 | Lightbox close button */
const lightboxClose = document.querySelector('.lightbox-close');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 坐标转换工具函数 | Coordinate Conversion Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * toPixel() | 经纬度转像素坐标
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   将 Leaflet LatLng 对象转换为包含 x(经度) 和 y(纬度) 的对象
 *   Converts Leaflet LatLng objects to pixel-like coordinates
 * 
 * 参数 | Parameters:
 *   latlng: {L.LatLng} - Leaflet 的经纬度对象
 * 
 * 返回 | Returns:
 *   {x: string, y: string} - x为经度，y为纬度，保留6位小数
 * 
 * 说明 | Notes:
 *   • 坐标系统: WGS84 (EPSG:4326)
 *   • 纬度范围: -90 到 +90
 *   • 经度范围: -180 到 +180
 */
function toPixel(latlng) {
    return {
        x: latlng.lng.toFixed(6),   // 经度 | Longitude (水平轴 | horizontal axis)
        y: latlng.lat.toFixed(6)    // 纬度 | Latitude (竖直轴 | vertical axis)
    };
}

/**
 * pixelString() | 格式化坐标显示字符串
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   将坐标对象格式化为可读的纬度/经度字符串
 *   Formats coordinate object into human-readable Lat/Lng string
 * 
 * 参数 | Parameters:
 *   pt: {x: string, y: string} - 由 toPixel() 返回的坐标对象
 * 
 * 返回 | Returns:
 *   {string} - 格式: "Lat: 41.452612, Lng: 2.184024"
 * 
 * 说明 | Notes:
 *   • 显示顺序: 纬度(Lat) 在前, 经度(Lng) 在后
 *   • Display order: Latitude first, Longitude second
 *   • 用于: 地图显示、坐标弹出框、鼠标追踪
 *   • Used in: map display, coordinate popups, mouse tracking
 */
function pixelString(pt) {
    // pt.x 为经度 | pt.x = longitude, pt.y 为纬度 | pt.y = latitude (字符串格式 | as strings)
    // 显示顺序为纬度在前，经度在后 | Display order: Latitude first, then Longitude
    return `Lat: ${pt.y}, Lng: ${pt.x}`;
}

/**
 * pointToLatLng() | 从 [x,y] 创建 Leaflet LatLng 对象
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   将数值坐标转换为 Leaflet 地图可使用的 LatLng 对象
 *   Converts numeric coordinates to Leaflet LatLng objects
 * 
 * 参数 | Parameters:
 *   x: {number} - 经度值 | Longitude value
 *   y: {number} - 纬度值 | Latitude value
 * 
 * 返回 | Returns:
 *   {L.LatLng} - Leaflet LatLng 对象 (格式: [lat, lng])
 * 
 * 说明 | Notes:
 *   • 注意: 函数参数为 [x, y]，但 Leaflet 需要 [lat, lng]
 *   • 因此传入时需要交换顺序: L.latLng(y, x)
 *   • Leaflet expects [lat, lng] but we pass [y, x] to swap
 */
function pointToLatLng(x, y) {
    return L.latLng(y, x);  // 交换顺序 | Swap x↔y to lat↔lng for Leaflet
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 地图模块 | Map Module
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * initMap() | 初始化 Leaflet 地图实例
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   创建地图实例、配置图层、添加事件监听、设置坐标显示
 *   Initialize map, configure layers, add event listeners, setup coordinate display
 * 
 * 执行流程 | Execution Flow:
 *   1. 创建 Leaflet map 实例 (Create L.map instance)
 *      - 目标容器: #map
 *      - 初始缩放级别: 15
 *      - 允许缩放范围: 12-19
 *   
 *   2. 创建街道和卫星两个底图图层
 *      - osmLayer: OpenStreetMap 街道图
 *      - satelliteLayer: Esri World Imagery 卫星图
 *   
 *   3. 默认激活卫星层, 添加图层控制器
 *      - 允许用户在两个图层间切换 (Users can toggle between layers)
 *   
 *   4. 附加图层控制容器到 UI 控制栏
 *      - Attach Leaflet controls to .ui-controls div
 *   
 *   5. 注册地图点击事件
 *      - 点击时: 创建/关闭坐标弹出框 (Create/Close coordinate popup)
 *   
 *   6. 注册鼠标移动事件
 *      - 显示实时坐标 (Display real-time coordinates)
 *      - 更新顶部坐标显示区域 (#coord-display)
 * 
 * 触发时机 | Triggered When:
 *   - 页面首次加载时调用 (Called on initial page load)
 *   - 需要前置地图再调用 loadData() (Call before loadData())
 */
function initMap() {
    // ───────────────────────────────────────────────────────
    // 地图基础配置 | Map Base Configuration
    // ───────────────────────────────────────────────────────
    
    const defaultZoom = 15;  // 默认缩放级别 (balances detail vs. overview)

    // 创建地图实例 | Create map instance in #map container
    map = L.map('map', {
        zoom: defaultZoom,
        minZoom: 12,          // 最小缩放: 看清宏观布局 (show neighborhood overview)
        maxZoom: 19,          // 最大缩放: 看清细节信息 (show street detail)
        zoomControl: true,
        center: [0,0]         // 临时中心，加载数据后由 fitBounds 更新
    });

    // ───────────────────────────────────────────────────────
    // 配置底图图层 | Configure Base Map Layers
    // ───────────────────────────────────────────────────────
    
    // 街道图 (OpenStreetMap Foundation 提供)
    // Street map (provided by OpenStreetMap Foundation)
    osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 贡献者'
    });

    // 卫星图 (Esri World Imagery - 需要 esri-leaflet 插件)
    // Satellite imagery (Esri services - requires esri-leaflet plugin in index.html)
    satelliteLayer = L.esri.tiledMapLayer({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        attribution: '来源: Esri, Maxar, Earthstar Geographics 及 GIS 用户社区',
        maxZoom: 19
    });

    // 默认激活卫星图层 | Add satellite layer by default
    satelliteLayer.addTo(map);

    // 创建图层控制器，允许用户切换 | Add layer control for user toggle
    const baseMaps = {
        "街道地图": osmLayer,
        "卫星地图": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(map);

    // 同步地图切换按钮样式 | Sync map toggle button appearance
    updateMapButton();

    // ───────────────────────────────────────────────────────
    // 整合 Leaflet 控制容器到 UI 控制栏 | Integrate Leaflet controls
    // ───────────────────────────────────────────────────────
    
    if (map && map._controlContainer) {
        map._controlContainer.classList.add('custom-control-container');
        const ui = document.querySelector('.ui-controls');
        if (ui && map._controlContainer.parentNode !== ui) {
            // 移动 Leaflet 控制容器到我们的 UI 栏中
            // Move Leaflet's default control container into our custom UI bar
            ui.appendChild(map._controlContainer);
        }
    }

    // ───────────────────────────────────────────────────────
    // 注册地图点击事件 | Register map click event
    // ───────────────────────────────────────────────────────
    
    map.on('click', (e) => {
        // 切换式交互: 第一次点击显示坐标弹出框，再次点击关闭
        // Toggle-style interaction: first click shows popup, second click hides it
        
        if (currentCoordPopup) {
            // 已有弹出框存在 → 关闭它 | Popup exists → close it
            map.closePopup(currentCoordPopup);
            currentCoordPopup = null;
        } else {
            // 否则创建新的坐标弹出框 | Otherwise create new coordinate popup
            const pt = toPixel(e.latlng);
            const coordText = pixelString(pt);
            currentCoordPopup = L.popup()
                .setLatLng(e.latlng)
                .setContent(coordText)
                .openOn(map);
        }
    });

    // ───────────────────────────────────────────────────────
    // 注册鼠标移动事件 | Register mousemove event
    // ───────────────────────────────────────────────────────
    
    // 实时显示鼠标位置的经纬度 | Display mouse position coordinates in real-time
    const coordEl = document.getElementById('coord-display');
    map.on('mousemove', (e) => {
        const pt = toPixel(e.latlng);
        coordEl.textContent = pixelString(pt);  // 更新顶部显示区域 | Update top display area
    });
    
    // 鼠标离开地图时清空坐标显示 | Clear display when mouse leaves map
    map.on('mouseout', () => {
        coordEl.textContent = '';
    });
}

/**
 * loadData() | 异步加载建筑数据并创建地图标点
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   从 data/buildings.json 获取建筑信息
 *   为每个建筑创建地图标点
 *   自动生成地图边界并调整视图
 * 
 * 执行流程 | Execution Flow:
 *   1. 异步获取 data/buildings.json 文件 (Fetch JSON)
 *   2. 解析 JSON 为 buildingsData 数组
 *   3. 遍历每个建筑:
 *      a. 创建自定义标点图标 (custom-marker with pulse animation)
 *      b. 创建 Leaflet marker 对象
 *      c. 激活标点的点击事件 → 显示侧面板
 *   4. 收集所有标点坐标，计算最小外接矩形 (bounds)
 *   5. 使用 fitBounds 自动缩放地图以显示所有标点
 *   6. setMaxBounds 限制地图平移范围
 * 
 * 异常处理 | Error Handling:
 *   • 若文件不存在或格式错误 → console.error 输出错误信息
 * 
 * 触发时机 | Triggered When:
 *   - initI18n() 完成后调用 (After i18n initialization)
 *   - 需要 map 已创建 (Requires initMap() called first)
 * 
 * 依赖 | Dependencies:
 *   • data/buildings.json
 *   • initMap() 必须先调用 (initMap() must be called first)
 *   • Leaflet L.divIcon, L.marker API
 */
async function loadData() {
    try {
        // 获取建筑数据 | Fetch building data
        const response = await fetch('data/buildings.json');
        buildingsData = await response.json();

        // 用于计算地图边界的所有标点坐标
        // Array to collect all marker positions for boundary calculation
        const latlngs = [];
        
        buildingsData.forEach(building => {
            // ─────────────────────────────────────────────
            // 创建自定义标点图标 | Create custom marker icon
            // ─────────────────────────────────────────────
            
            const icon = L.divIcon({
                className: 'custom-marker',           // CSS 类名，定义样式
                html: `<div class="marker-pulse"></div>`,  // 脉冲动画元素
                iconSize: [24, 24],                   // 图标尺寸 (像素)
                iconAnchor: [12, 12]                  // 锚点位置 (中心对齐)
            });

            // ─────────────────────────────────────────────
            // 提取建筑坐标 | Extract building coordinates
            // ─────────────────────────────────────────────
            
            // 注意: 数据中 coords 格式为 [latitude, longitude]
            // Note: In JSON, coords are stored as [lat, lng]
            // Leaflet marker 也需要 [lat, lng]，顺序一致
            // Leaflet markers also expect [lat, lng], so order is the same
            const lat = building.coords[0];
            const lng = building.coords[1];
            latlngs.push([lat, lng]);

            // ─────────────────────────────────────────────
            // 创建标点并添加到地图 | Create and add marker to map
            // ─────────────────────────────────────────────
            
            const marker = L.marker([lat, lng], { icon: icon }).addTo(map);

            // ─────────────────────────────────────────────
            // 绑定标点点击事件 | Bind marker click event
            // ─────────────────────────────────────────────
            
            marker.on('click', (e) => {
                // 阻止事件冒泡到地图 | Prevent event from bubbling to map
                L.DomEvent.stopPropagation(e);
                
                // 关闭任何打开的坐标弹出框
                // Close any open coordinate popup to avoid conflicts
                if (currentCoordPopup) {
                    map.closePopup(currentCoordPopup);
                    currentCoordPopup = null;
                }
                
                // 显示建筑详情面板 | Show building detail panel
                showPanel(building);
            });
        });

        // ─────────────────────────────────────────────
        // 自动调整地图视图 | Auto-adjust map view
        // ─────────────────────────────────────────────
        
        if (latlngs.length) {
            // 计算包含所有标点的最小矩形边界
            // Calculate bounding box containing all markers
            const bounds = L.latLngBounds(latlngs);
            
            // 自动缩放和平移地图以显示所有标点
            // 0.2 = 20% 额外填充，避免标点贴边
            // fitBounds with 20% padding so markers aren't at edges
            map.fitBounds(bounds.pad(0.2));
            
            // 限制地图平移范围，防止用户滚动出区域
            // setMaxBounds prevents panning outside the region
            // 0.3 = 30% 额外范围
            map.setMaxBounds(bounds.pad(0.3));
        }
    } catch (err) {
        console.error('无法加载建筑数据 | Failed to load building data:', err);
    }
}

/**
 * cleanupPanelExtras() | 清理侧面板中的动态生成元素
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   移除之前动态添加到侧面板的临时元素
 *   防止多次打开面板时元素重复堆积
 * 
 * 清理对象 | Cleanup Targets:
 *   • #panel-actions (如果存在)
 *   • .content-separator (如果存在)
 *   • .panel-coords (坐标信息行)
 * 
 * 调用时机 | Called When:
 *   • closePanel() 关闭面板时
 *   • showPanel() 显示新建筑前 (通过 updatePanelContent)
 */
function cleanupPanelExtras() {
    const oldActions = panel.querySelector('#panel-actions');
    if (oldActions) oldActions.remove();
    
    const oldSeparator = panel.querySelector('.content-separator');
    if (oldSeparator) oldSeparator.remove();
    
    const oldCoords = panel.querySelector('.panel-coords');
    if (oldCoords) oldCoords.remove();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 侧滑面板模块 | Side Panel Module
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 侧滑面板 DOM 容器 | Side panel container element */
const panel = document.getElementById('detail-panel');

/** 面板标题元素 | Panel title heading */
const titleEl = document.getElementById('panel-title');

/** 面板描述内容区 | Panel description text area */
const descEl = document.getElementById('panel-desc');

/** 面板媒体展示区 (图片/PDF) | Panel media gallery area */
const mediaEl = document.getElementById('panel-media');

/** 当前显示的建筑对象 | Currently displayed building object */
let currentBuilding = null;

/**
 * showPanel() | 显示侧滑面板并加载建筑信息
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   打开侧面板，显示选中建筑的详细信息
 *   包括标题、描述、媒体（图片/PDF）、坐标
 * 
 * 参数 | Parameters:
 *   building: {Object} - 建筑对象 (从 buildingsData 数组中)
 *             包含 coords, content[lang], media 等属性
 * 
 * 执行流程 | Execution Flow:
 *   1. 移除任何坐标专用状态 (Remove coordinate-only mode)
 *   2. 设置 currentBuilding = building (记录当前选中)
 *   3. 调用 updatePanelContent() (加载内容)
 *   4. 添加 'show' 类 → 面板滑入 (Add CSS class → panel slides in)
 * 
 * CSS 类变化 | CSS Class Changes:
 *   before: #detail-panel 无 'show' 类 (off-screen)
 *   after:  #detail-panel 有 'show' 类 (visible)
 */
function showPanel(building) {
    // 清除仅显示坐标的临时状态 | Clear coordinate-only mode
    panel.classList.remove('coordinates-only');
    
    // 记录当前活跃的建筑对象 | Store current building reference
    currentBuilding = building;
    
    // 填充面板内容 (标题、描述、图片等)
    // Populate panel with building details
    updatePanelContent();
    
    // 添加 'show' 类触发 CSS 动画，面板从右侧滑入
    // Add 'show' class to trigger slide-in animation
    panel.classList.add('show');
}

/**
 * closePanel() | 关闭侧滑面板
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   隐藏侧面板，清理所有临时状态和事件监听
 *   确保没有内存泄漏或重复事件
 * 
 * 执行流程 | Execution Flow:
 *   1. 移除 'show' 类 → 面板滑出 (Remove 'show' class → panel slides out)
 *   2. 清除坐标专用模式标志
 *   3. 重置 currentBuilding = null
 *   4. 移除面板键盘事件处理器 (如果存在)
 *   5. 清理动态生成的元素 (调用 cleanupPanelExtras)
 *   6. 销毁 Swiper 实例 (if image carousel is active)
 * 
 * 清理内容 | Cleanup Targets:
 *   • CSS 类变化 (Class toggles)
 *   • 传入鼠标/键盘事件监听
 *   • Swiper 轮播实例内存
 *   • 动态 DOM 元素
 * 
 * 触发时机 | Triggered When:
 *   • 用户点击关闭按钮 (User clicks close button)
 *   • 按 Escape 键 (Press Escape key)
 *   • 页面卸载 (Page unload)
 */
function closePanel() {
    // 移除 'show' 类 → 面板滑出 (Remove 'show' to hide panel)
    panel.classList.remove('show');
    
    // 清除坐标专用显示模式标记
    // Clear temporary coordinate display mode
    panel.classList.remove('coordinates-only');
    
    // 重置当前建筑引用 | Clear current building reference
    currentBuilding = null;
    
    // 移除键盘事件处理器 | Remove keyboard event listener
    if (panelKeyHandler) {
        document.removeEventListener('keydown', panelKeyHandler);
        panelKeyHandler = null;
    }
    
    // 清理面板中的临时动态元素 | Remove temporarily added elements
    cleanupPanelExtras();
    
    // 销毁 Swiper 媒体轮播实例以释放内存
    // Destroy Swiper carousel instance to free memory
    if (swiperInstance && typeof swiperInstance.destroy === 'function') {
        try { 
            swiperInstance.destroy(true, true);  // removeClasses=true, removeElements=false
        } catch (e) { 
            /* 忽略销毁时的错误 | Ignore cleanup errors */ 
        }
        swiperInstance = null;
    }
}

/**
 * openLightbox() | 打开图片灯箱放大显示
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   在全屏灯箱中显示放大的图片
 *   点击灯箱背景或关闭按钮关闭
 * 
 * 参数 | Parameters:
 *   src: {string} - 图片文件 URL/路径
 * 
 * 执行流程 | Execution Flow:
 *   1. 检查灯箱 DOM 元素是否存在
 *   2. 设置 lightboxImage.src = src
 *   3. 添加 'show' 类 → 灯箱显示 (Add 'show' CSS class)
 * 
 * CSS 效果 | CSS Effect:
 *   .show 类使灯箱从隐藏变为全屏可见 (opacity, z-index 等)
 */
function openLightbox(src) {
    if (!lightboxOverlay || !lightboxImage) return;  // 检查元素存在 | Check element exists
    lightboxImage.src = src;                         // 设置图片源 | Set image source
    lightboxOverlay.classList.add('show');           // 显示灯箱 | Show lightbox
}

/**
 * closeLightbox() | 关闭图片灯箱
 * ─────────────────────────────────────────────────────
 * 功能 | Function:
 *   隐藏全屏灯箱，恢复原始页面显示
 * 
 * 执行流程 | Execution Flow:
 *   1. 检查灯箱 DOM 元素是否存在
 *   2. 移除 'show' 类 → 灯箱隐藏 (Remove 'show' CSS class)
 */
function closeLightbox() {
    if (!lightboxOverlay) return;
    lightboxOverlay.classList.remove('show');
}

// ─────────────────────────────────────────────────
// 灯箱事件绑定 | Lightbox event bindings
// ─────────────────────────────────────────────────

// 点击灯箱背景关闭 | Close when clicking lightbox background
if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', (e) => {
        // 仅当点击的是背景层本身时关闭 | Only close if clicking the overlay itself
        if (e.target === lightboxOverlay) closeLightbox();
    });
}

// 点击灯箱关闭按钮关闭 | Close when clicking close button
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
