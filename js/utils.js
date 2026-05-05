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
};
