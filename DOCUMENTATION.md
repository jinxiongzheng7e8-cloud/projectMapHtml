项目文档 | Project Documentation

概述 | Overview

这是一个基于 Leaflet 的交互式历史建筑地图应用。应用支持多语言（加泰罗尼亚语、西班牙语、英文）、日/夜主题切换，并具备完整的媒体展示和坐标查询功能。

This is an interactive historical building map application based on Leaflet. It supports multiple languages (Catalan, Spanish, English), day/night theme switching, and features complete media display and coordinate query functionality.

================================================================================

文件结构与功能说明 | File Structure & Function Documentation

核心 JavaScript 模块 | Core JavaScript Modules

js/main.js - 主应用逻辑 | Main Application Logic

全局变量 | Global Variables:
- currentLang: 当前活跃语言 | Current active language (default: 'ca')
- map: Leaflet 地图实例 | Leaflet map instance
- buildingsData: 从 JSON 加载的建筑数据 | Building data from JSON
- currentCoordPopup: 当前显示的坐标弹出框 | Current coordinate popup
- osmLayer, satelliteLayer: 街道和卫星图层 | Street and satellite layers

关键函数 | Key Functions:

1. 坐标转换 | Coordinate Conversion:
   toPixel(latlng)        // LatLng to {x: lng, y: lat}
   pixelString(pt)        // {x, y} to "Lat: ..., Lng: ..."
   pointToLatLng(x, y)    // (x, y) to L.LatLng

2. 地图初始化 | Map Initialization:
   initMap()  // Creates map instance, configures layers, registers events
   - Creates Leaflet map instance
   - Configures OSM street map and Esri satellite imagery
   - Adds layer controller
   - Registers click and mouse move events

3. 数据加载 | Data Loading:
   loadData()  // Async load JSON, create markers, calculate bounds
   - Gets building data from data/buildings.json
   - Creates custom markers for each building
   - Auto-adjusts map view to show all markers

4. 侧滑面板控制 | Side Panel Control:
   showPanel(building)    // Show building details panel
   closePanel()           // Close panel and cleanup resources
   updatePanelContent()   // Populate panel content (title, description, images etc)

5. 灯箱功能 | Lightbox:
   openLightbox(src)      // Full-screen image display
   closeLightbox()        // Close lightbox

js/drag.js - 侧面板拖拽调整 | Side Panel Resize

功能 | Functions:
- Users can drag side panel left edge to resize width
- Width limits: 300px (minimum) to 50% screen width (maximum)
- Supports mouse and touch events

技术 | Technologies:
- Pointer Events API (primary) supports mouse, touch, pen
- Mouse Events (fallback) for older browsers

js/i18n.js - 国际化 | Internationalization

函数 | Function:
initI18n()  // Initialize i18next and load language files

支持语言 | Supported Languages:
- ca: Catalan
- es: Spanish
- en: English

资源文件位置 | Resource files:
- locales/ca.json, locales/es.json, locales/en.json

================================================================================

样式表 | Stylesheets

css/style.css - 主样式表 | Main Stylesheet

主题系统 | Theme System:

1. 颜色变量 | Color Variables:

   Variable     Light Mode          Dark Mode
   --bg         #000000 (black)     #1a1a1a (dark gray)
   --text       #ffffff (white)     #f0f0f0 (light gray)
   --accent     #cc0000 (bright red) #8b0000 (dark red)

2. 按钮样式统一 | Unified Button Styling:
   - All buttons share base styles (.btn-common, .icon-btn etc)
   - Light mode hover: brightness(0.8) dims
   - Dark mode hover: brightness(1.2) brightens

3. 地图容器 | Map Container:
   - Full screen (100% x 100%)
   - Multi-layer shadow effects create depth
   - Top gradient highlight (#map::before)
   - Edge fade and glassmorphism effect (#map::after)

4. 侧滑面板 | Side Panel:
   - Fixed on right side
   - Resizable width by dragging
   - Glassmorphic background (semi-transparent + blur)
   - Responsive: adjusts width on small screens

5. 灯箱 | Lightbox:
   - Full-screen semi-transparent black background
   - Enlarged image display in center
   - Click background or close button to exit

================================================================================

数据文件 | Data Files

data/buildings.json - 建筑信息数据库 | Building Database

Data Structure:
{
  "id": "unique identifier",
  "coords": [latitude, longitude],
  "year": "construction year",
  "address": {
    "ca": "catalan address",
    "es": "spanish address",
    "en": "english address"
  },
  "media": [
    { "type": "image", "src": "image path" },
    { "type": "pdf", "src": "pdf path" }
  ],
  "content": {
    "ca": { "title": "title", "desc": "description" },
    "es": { ... },
    "en": { ... }
  }
}

当前包含建筑 | Current Buildings:
1. Pont dels Tres Ulls (Three Eyes Bridge) - 1910
2. Torre del Rellotge (Clock Tower) - 1950s
3. Casa de l'Aigua (House of Water) - 1915-1917
4. Casa de la Bruixa (Witch House) - 1915
5. Ateneu de la Planta Asfàltica (Asphalt Plant Cultural Center) - Date unknown
6. Benjamí - Date unknown

多语言资源文件 | Localization Files

Location: locales/{lang}.json

Example content:
{
  "select_language": "Select language | Selecciona idioma | Selecciona idioma",
  "toggle_theme": "Toggle theme | Cambiar tema | Canviar tema",
  "toggle_map": "Toggle map view | Cambiar vista | Canviar vista",
  "change_language": "Change language | Cambiar idioma | Canviar idioma",
  "view_pdf_button": "View Document | Ver documento | Veure document",
  "coords_title": "Coordinates | Coordenadas | Coordenades"
}

================================================================================

交互流程 | User Interaction Flows

1. 应用启动 | Application Startup

Page load → Show language selection modal → User selects language
→ Initialize i18n → Initialize map → Load building data
→ Create markers → Auto-adjust view

2. 地图交互 | Map Interaction

User Action              Result
────────────────────────────────────────────────
Click marker         → Show side panel details
Click empty map      → Toggle coordinate popup
Mouse move          → Display coordinates in real-time
Scroll/Touch pinch   → Zoom map

3. 侧面板交互 | Side Panel Interaction

Display flow:
  Building marker click → Load building data → Show title, address, description
                       → Display coordinates → Load media library (images/PDFs)
                       → Initialize Swiper carousel

Drag resize:
  User drag left edge → Calculate new width → Update in real-time
                    → Limited by minimum/maximum width

Close:
  User click close button → Destroy Swiper → Cleanup events → Panel slides out

4. 主题/语言切换 | Theme/Language Switching

Theme change:
  Click theme button → Add/remove .theme-dark class on body
                    → CSS variables (--bg, --accent etc) switch
                    → All element colors update instantly

Language change:
  Click language button → Show language selection modal
                       → User selects language → currentLang updates
                       → i18next.changeLanguage() updates translations
                       → All page text updates instantly

================================================================================

坐标系统说明 | Coordinate System

System: WGS84 (EPSG:4326)

Data Format:
- JSON data: [latitude, longitude] (latitude first, longitude second)
- Leaflet uses: [lat, lng] (same order)
- Display format: "Lat: 41.452612, Lng: 2.184024" (latitude first)

Ranges:
- Latitude: -90 to +90
- Longitude: -180 to +180

Precision:
- Storage: 6 decimal places (≈ 0.111 meter precision)
- Display: 6 decimal places

================================================================================

扩展指南 | Extension Guide

添加新建筑 | Adding New Buildings

1. Edit data/buildings.json
2. Add new object to array:
   {
     "id": "8",
     "coords": [41.4501, 2.1851],
     "year": "2024",
     "address": { "ca": "...", "es": "...", "en": "..." },
     "media": [ ... ],
     "content": { ... }
   }

自定义颜色主题 | Customizing Colors

Edit CSS variables in css/style.css:
:root {
    --bg: #000000;           /* Light mode background */
    --accent: #cc0000;       /* Light mode accent color */
}

.theme-dark {
    --bg: #1a1a1a;           /* Dark mode background */
    --accent: #8b0000;       /* Dark mode accent color */
}

添加新语言 | Adding New Language

1. Create new file in locales/ called new-lang.json
2. Edit js/i18n.js language list:
   const languages = ['ca', 'es', 'en', 'new-lang'];
3. Edit index.html to add language selection button

================================================================================

浏览器兼容性 | Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Key Features:
- Pointer Events: Modern browsers
- CSS Variables: All modern browsers
- Leaflet: Widely supported

================================================================================

性能优化 | Performance Tips

1. Media optimization: Compress image sizes for faster loading
2. Marker quantity: Current 6 markers perform well; 100+ recommend marker clustering
3. Swiper: Initialize new instance per panel, destroy on close to free memory
4. Event delegation: All marker clicks bound individually, not using delegation

================================================================================

故障排除 | Troubleshooting

Problem                  Cause                    Solution
─────────────────────────────────────────────────────────────────────────────
Map not showing     Leaflet library not loaded     Check index.html script tags
Wrong coordinates   JSON coordinate format error   Ensure format is [lat, lng]
Language not switch i18n not initialized          Check browser console for errors
Panel lag           Too many Swiper instances      Check destroy logic

================================================================================

许可证 | License

This project is for educational purposes.
此项目用于教育目的。

================================================================================

联系信息 | Contact

Project maintainer: A3d_ITB
Maintenance date: March 2026
项目维护者: A3d_ITB
维护日期: 2026年3月
