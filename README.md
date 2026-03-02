项目概览 | Project Overview

一个使用 Leaflet 构建的交互式历史建筑地图。与最初的静态图片版本不同，现已整合真实地理坐标与在线瓦片服务（OpenStreetMap + Esri 卫星影像），并支持完整的多语言和主题系统。

注意: 本仓库为纯前端静态项目，可直接通过文件协议打开，也可在本地服务器上运行以避免任何跨域问题。

运行方式 | How to Run

1. 克隆或复制整个目录到本地。
2. 用浏览器打开 index.html。若浏览器对本地文件有跨域限制，请使用简单的 HTTP 服务器，例如：
   pushd c:\Users\isard\Desktop\A3d_ITB\projectMapHtml
   python -m http.server 8000    # 或者用 Node.js 的 http-server
3. 初次加载时会提示选择语言，之后可在页面右上角切换语言 / 主题 / 地图视图。

核心特性 | Key Features

- Leaflet 地图：支持缩放、平移、点击事件。
- 卫星与街道图层切换：右上角按钮实现在线地图切换。
- 建筑标记：点击标记会打开右侧滑出面板，显示详细信息、坐标与媒体。
- 可拖拽侧面板：面板可在 300px~50% 宽度间调整。
- 多语言支持：加泰罗尼亚语、 西班牙语、英语，使用 i18next 动态翻译。
- 日/夜主题：CSS 变量实现，切换主题时按钮亮度变化一致。
- 坐标查询：点击地图空白处显示经纬度弹窗，鼠标移动时实时更新。
- 媒体灯箱与轮播：使用 Swiper.js 轮播与自定义灯箱查看图片/PDF。

项目结构 | Project Structure

index.html            页面入口
css/style.css         样式表（主题变量、按钮样式、玻璃拟态等）
js/main.js            应用逻辑、地图初始化、数据加载
js/drag.js            侧面板拖拽模块
js/i18n.js            国际化初始化
data/buildings.json   建筑数据（参照结构可扩展）
locales/              语言资源文件
assets/               图片和媒体资源

扩展与维护 | Extending & Maintenance

- 添加新建筑：编辑 data/buildings.json。
- 自定义颜色：修改 css/style.css 中的 CSS 变量。
- 增加语言：在 locales/ 新建文件，更新 js/i18n.js 和 index.html。

浏览器兼容 | Browser Compatibility

兼容所有现代浏览器（Chrome/Edge/Firefox/Safari 及移动版本）。

许可 | License

仅供教育用途。 | This project is for educational purposes.

欢迎提出改进建议或直接在代码中修改，然后重新发布。