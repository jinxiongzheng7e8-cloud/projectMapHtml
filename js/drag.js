/**
 * js/drag.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 侧面板拖拽调整模块 | Side Panel Resize Module
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能 | Primary Function:
 *   允许用户通过拖拽侧面板左边缘来改变其宽度
 *   Allows users to resize the detail panel by dragging its left edge
 *
 * 交互方式 | User Interaction:
 *   1. 将鼠标移到".resize-handle"上
 *   2. 鼠标指针变为 "ew-resize" (←→ 箭头)
 *   3. 按下并拖动鼠标左键
 *   4. 面板动态改变宽度
 *   5. 放开鼠标完成调整
 *
 * 技术细节 | Technical Details:
 *   • 使用 Pointer Events API (兼容鼠标/触摸/笔)
 *   • 备用方案: 经典 Mouse Events
 *   • 高精度数值计算保证流畅动画
 *   • 宽度限制: 300px (最小) ~ 50% 屏幕宽 (最大)
 */

(function () {
    // ─────────────────────────────────────────────────
    // 初始化 DOM 元素和状态变量 | Initialize DOM and state vars
    // ─────────────────────────────────────────────────
    
    const panel = document.getElementById('detail-panel');
    const handle = document.querySelector('.resize-handle');
    
    // 如果 DOM 元素不存在，退出脚本 | Exit if needed elements missing
    if (!panel || !handle) return;

    // ─────────────────────────────────────────────────
    // 状态变量 | State Variables
    // ─────────────────────────────────────────────────
    
    /** 正在拖拽中的标志 | Is currently resizing */
    let isResizing = false;
    
    /** 拖拽开始时的鼠标 X 坐标 | Initial mouse X position */
    let startX = 0;
    
    /** 拖拽开始时面板的宽度 | Panel width at drag start */
    let startWidth = 0;

    // ─────────────────────────────────────────────────
    // 宽度限制常量 | Width constraint constants
    // ─────────────────────────────────────────────────
    
    /** 最小面板宽度 | Minimum panel width (pixels) */
    const minWidth = 300;
    
    /**
     * 获取最大面板宽度 | Get maximum panel width
     * 计算: 屏幕宽度的 50% (允许地图显示在左侧)
     * Returns: 50% of window width to keep map visible
     */
    const getMaxWidth = () => Math.floor(window.innerWidth / 2);

    // ─────────────────────────────────────────────────
    // 拖拽事件处理函数 | Drag event handler functions
    // ─────────────────────────────────────────────────

    /**
     * beginDrag() | 开始拖拽操作
     * ─────────────────────────────────────────────────
     * 执行 | Executes:
     *   1. 标记 isResizing = true (进入拖拽模式)
     *   2. 记录初始鼠标位置和面板宽度
     *   3. 改变光标样式为 "ew-resize" (←→ 箭头)
     *   4. 禁用文本选择以获得平滑拖拽体验
     */
    function beginDrag(clientX) {
        isResizing = true;
        startX = clientX;
        startWidth = panel.getBoundingClientRect().width;
        document.body.style.cursor = 'ew-resize';  // ←→ 箭头光标 | Horizontal resize cursor
        
        // 禁用文本选择和触摸滚动，获得平滑体验
        // Disable text selection for smooth drag experience
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';
    }

    /**
     * doDrag() | 执行拖拽移动
     * ─────────────────────────────────────────────────
     * 功能 | Function:
     *   根据鼠标移动计算新面板宽度并实时更新
     *
     * 逻辑 | Logic:
     *   1. 计算鼠标移动距离: delta = startX - clientX
     *   2. 新宽度 = 起始宽度 + delta (向左拖拽 → 宽度增加)
     *   3. 应用最大/最小约束
     *   4. 立即更新 panel.style.width
     * 
     * 约束条件 | Constraints:
     *   • 最小: 300px (保证内容可读性)
     *   • 最大: 50% 屏幕宽度 (保持地图可见)
     *   • 使用 Math.round 避免子像素值
     */
    function doDrag(clientX) {
        if (!isResizing) return;
        
        // 计算鼠标移动距离 (向左拖拽返回正值)
        // Calculate drag distance (dragging left = positive delta)
        const delta = startX - clientX;
        
        // 计算新宽度 | Calculate new width
        let newWidth = Math.round(startWidth + delta);
        
        // 获取当前最大宽度 | Get current max width
        const maxW = getMaxWidth();
        
        // 应用约束条件 | Apply min/max constraints
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxW) newWidth = maxW;
        
        // 立即更新面板宽度 | Update panel width in real-time
        panel.style.width = newWidth + 'px';
    }

    /**
     * stopDrag() | 停止拖拽操作
     * ─────────────────────────────────────────────────
     * 功能 | Function:
     *   结束拖拽状态，恢复光标和选择行为
     *
     * 执行 | Executes:
     *   1. 设置 isResizing = false
     *   2. 恢复光标为默认 (auto)
     *   3. 重新启用文本选择
     *   4. 恢复触摸滚动
     */
    function stopDrag() {
        isResizing = false;
        document.body.style.cursor = '';           // 恢复默认光标
        document.body.style.userSelect = '';       // 恢复文本选择
        document.body.style.touchAction = '';      // 恢复触摸行为
    }

    // ─────────────────────────────────────────────────
    // 事件监听绑定 | Event listener bindings
    // ─────────────────────────────────────────────────

    /**
     * Pointer Events (优先) | Primary method
     * ────────────────────────────────────────
     * 优势 | Advantages:
     *   • 统一处理鼠标、触摸、笔输入
     *   • 现代标准 (Firefox, Chrome, Safari 14+)
     *   • setPointerCapture 确保离开元素后仍跟踪
     */
    
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        // 将指针事件限制到此元素 | Capture pointer to this element
        handle.setPointerCapture(e.pointerId);
        beginDrag(e.clientX);
    });

    document.addEventListener('pointermove', (e) => {
        if (!isResizing) return;
        doDrag(e.clientX);
    });

    document.addEventListener('pointerup', (e) => {
        if (!isResizing) return;
        try { 
            // 释放指针捕获 | Release pointer capture
            handle.releasePointerCapture(e.pointerId); 
        } catch (e) {}
        stopDrag();
    });

    /**
     * Mouse Events 备用方案 | Fallback for older browsers
     * ────────────────────────────────────────
     * 用于不支持 Pointer Events 的旧浏览器
     * For browsers that don't support Pointer Events
     */
    
    handle.addEventListener('mousedown', (e) => { 
        e.preventDefault(); 
        beginDrag(e.clientX); 
    });
    
    document.addEventListener('mousemove', (e) => { 
        if (isResizing) doDrag(e.clientX); 
    });
    
    document.addEventListener('mouseup', (e) => { 
        if (isResizing) stopDrag(); 
    });

})();  // IIFE 自执行作用域 | Immediately Invoked Function Expression
