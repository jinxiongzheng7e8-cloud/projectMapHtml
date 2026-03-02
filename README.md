# Historical Map Preview

简单的静态项目，用于展示历史建筑信息的交互式地图预览。

## 运行
直接打开 `index.html` 即可（如果涉及跨域，请使用本地服务器）。

> 📌 **提示**: 项目现在使用在线地图切片（OpenStreetMap/Esri World Imagery）。
> 不再依赖静态 `map.jpeg` 文件；如需自定义底图，请修改 `js/main.js` 中的 `osmLayer` 或添加其他 `L.tileLayer`。
> 页面背景改为纯黑色，原有的动态背景 Canvas 已移除。
>
> 界面右上角按钮组包含语言、主题和地图视图切换，风格统一。
## 功能

- 基于 Leaflet 的单张图片地图
- 标点点击显示右侧滑出详情面板
- 面板可拖拽调整宽度、可关闭
- 多语言支持（ca/es/en），首次访问弹出选择框
- 日光/月光主题切换，带月相按钮动画

结构参见 `index.html`、`css/style.css` 和 `js/` 文件夹。