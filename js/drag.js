// js/drag.js
// 单独负责侧滑面板宽度拖拽控制

(function () {
    const panel = document.getElementById('detail-panel');
    const handle = document.querySelector('.resize-handle');
    if (!panel || !handle) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    const minWidth = 300;
    const getMaxWidth = () => Math.floor(window.innerWidth / 2);

    function beginDrag(clientX) {
        isResizing = true;
        startX = clientX;
        startWidth = panel.getBoundingClientRect().width;
        document.body.style.cursor = 'ew-resize';
        // prevent text selection while dragging
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';
    }

    function doDrag(clientX) {
        if (!isResizing) return;
        // panel is anchored to right; dragging left increases width
        const delta = startX - clientX;
        let newWidth = Math.round(startWidth + delta);
        const maxW = getMaxWidth();
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxW) newWidth = maxW;
        panel.style.width = newWidth + 'px';
    }

    function stopDrag() {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.touchAction = '';
    }

    // Pointer events for mouse/touch/pen
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        beginDrag(e.clientX);
    });

    document.addEventListener('pointermove', (e) => {
        if (!isResizing) return;
        doDrag(e.clientX);
    });

    document.addEventListener('pointerup', (e) => {
        if (!isResizing) return;
        try { handle.releasePointerCapture(e.pointerId); } catch (e) {}
        stopDrag();
    });

    // fallback for mouse events (older browsers)
    handle.addEventListener('mousedown', (e) => { e.preventDefault(); beginDrag(e.clientX); });
    document.addEventListener('mousemove', (e) => { if (isResizing) doDrag(e.clientX); });
    document.addEventListener('mouseup', (e) => { if (isResizing) stopDrag(); });
})();
