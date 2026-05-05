/**
 * 工具函数
 */

const Utils = {
    /**
     * 生成 [min, max) 的随机浮点数
     */
    rand(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 生成 [min, max] 的随机整数
     */
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 限制 val 在 [min, max] 之间
     */
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    /**
     * 两点距离平方
     */
    distSq(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return dx * dx + dy * dy;
    },

    /**
     * 圆形碰撞检测
     */
    circleCollide(cx1, cy1, r1, cx2, cy2, r2) {
        return Utils.distSq(cx1, cy1, cx2, cy2) < (r1 + r2) * (r1 + r2);
    },

    /**
     * 矩形-圆形碰撞检测 (近似，用圆心到矩形最近点)
     */
    rectCircleCollide(rectX, rectY, rectW, rectH, circleX, circleY, circleR) {
        const halfW = rectW / 2;
        const halfH = rectH / 2;
        const closestX = Utils.clamp(circleX, rectX - halfW, rectX + halfW);
        const closestY = Utils.clamp(circleY, rectY - halfH, rectY + halfH);
        const dx = circleX - closestX;
        const dy = circleY - closestY;
        return (dx * dx + dy * dy) < (circleR * circleR);
    },

    /**
     * 检测设备是否为触摸设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * 绘制圆角矩形路径
     */
    roundRectPath(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    /**
     * 格式化距离显示
     */
    formatDistance(meters) {
        const km = meters / 1000;
        return km.toFixed(km < 10 ? 1 : 0);
    },

    /**
     * 格式化速度显示
     */
    formatSpeed(pxPerSec) {
        // 将像素/秒映射为 km/h（游戏内大致比例）
        const kmh = (pxPerSec / CONSTANTS.CANVAS_WIDTH) * 180;
        return Math.round(kmh);
    },

    // ============ 伪 3D 投影 ============

    /**
     * 将世界坐标 (x, y, z) 投影到屏幕坐标，摄像机位于 (camX, camY, camZ)，z 轴朝向屏幕里(负y方向)
     * 返回 { sx, sy, scale, visible }
     */
    project(worldX, worldY, worldZ, camX, camY, camZ, screenW, screenH) {
        const P3 = CONSTANTS.PSEUDO_3D;
        // 相对于摄像机的坐标
        const dx = worldX - camX;
        const dy = worldY - camY;
        const dz = worldZ - camZ;

        // dz 必须 > 0 才能投影（在摄像机前方）
        if (dz <= 0) return { sx: 0, sy: 0, scale: 0, visible: false };

        const scale = P3.FOCAL_LENGTH / dz;
        const sx = (dx * scale) + screenW / 2;
        const sy = screenH / 2 - (dy * scale); // y 向上为正

        return { sx, sy, scale, visible: true };
    },

    /**
     * 计算在摄像机前方的距离对应的缩放比例
     */
    projectScale(distanceFromCamera) {
        const P3 = CONSTANTS.PSEUDO_3D;
        if (distanceFromCamera <= 0) return 0;
        return P3.FOCAL_LENGTH / distanceFromCamera;
    },

    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * 线性插值颜色
     */
    lerpColor(c1, c2, t) {
        const hex = (s) => parseInt(s.replace('#', ''), 16);
        const n1 = hex(c1);
        const n2 = hex(c2);
        const r = Math.round(((n1 >> 16) & 0xFF) + ((((n2 >> 16) & 0xFF) - ((n1 >> 16) & 0xFF)) * t));
        const g = Math.round(((n1 >> 8) & 0xFF) + ((((n2 >> 8) & 0xFF) - ((n1 >> 8) & 0xFF)) * t));
        const b = Math.round((n1 & 0xFF) + (((n2 & 0xFF) - (n1 & 0xFF)) * t));
        return `rgb(${r},${g},${b})`;
    },

    /**
     * 伪 3D 投影：将地面世界坐标 (wx, wy) 映射到屏幕坐标
     * 摄像机在 (camX, camY=camDepth, camZ=CAMERA_HEIGHT)
     * 返回 { sx, sy, scale, dz }，dz 为摄像机前方距离。若超出范围返回 null。
     */
    project3D(wx, wy, screenW, horizonY, camX, camY) {
        const P3 = CONSTANTS.PSEUDO_3D;
        const dz = camY - wy;
        if (dz <= 0 || dz > P3.DRAW_DISTANCE) return null;
        const scale = P3.FOCAL_LENGTH / dz;
        return {
            sx: screenW / 2 + (wx - camX) * scale,
            sy: horizonY + P3.CAMERA_HEIGHT * scale,
            scale,
            dz,
        };
    },

    /**
     * 创建带高度的投影（用于树顶等），wyGround 是地面深度，height 是离地高度（正数）
     */
    project3DWithHeight(wx, wyGround, height, screenW, horizonY, camX, camY) {
        const P3 = CONSTANTS.PSEUDO_3D;
        const dz = camY - wyGround; // 树在地面深度投影
        if (dz <= 0 || dz > P3.DRAW_DISTANCE) return null;
        const scale = P3.FOCAL_LENGTH / dz;
        return {
            sx: screenW / 2 + (wx - camX) * scale,
            syGround: horizonY + P3.CAMERA_HEIGHT * scale,
            syTop: horizonY + (P3.CAMERA_HEIGHT - height) * scale,
            scale,
            dz,
        };
    },
};
