/**
 * 世界管理：障碍物、冰面生成与渲染
 */

class World {
    constructor() {
        this.obstacles = [];     // { x, y, type: 'tree'|'rock', width, height, vx? }
        this.icePatches = [];    // { x, y, width, height }
        this.snowflakes = [];    // { x, y, speed, size }
        this.lastSpawnY = 0;     // 最后生成Y坐标
        this.seed = Math.random() * 10000;
        this.frozen = false;     // 是否被急冻术冻结
    }

    setFrozen(value) {
        this.frozen = value;
    }

    reset() {
        this.obstacles = [];
        this.icePatches = [];
        this.snowflakes = [];
        this.lastSpawnY = 0;
    }

    /**
     * 更新世界（生成与销毁）
     * @param {number} playerY 玩家Y坐标
     * @param {Object} track 当前赛道配置
     */
    update(playerY, track) {
        const spawnAhead = playerY - CONSTANTS.SPAWN_DISTANCE;
        const despawnBehind = playerY + CONSTANTS.DESPAWN_DISTANCE;

        // 移除视野外的障碍
        this.obstacles = this.obstacles.filter(o => o.y < despawnBehind);
        this.icePatches = this.icePatches.filter(i => i.y < despawnBehind);

        // 向前方批量生成
        while (this.lastSpawnY > spawnAhead) {
            this.lastSpawnY -= Utils.rand(60, 120);
            this._spawnChunk(this.lastSpawnY, track);
        }

        // 更新移动障碍（急冻术冻结时不动）
        if (track.movingObstacles && !this.frozen) {
            const dt = 1 / 60;
            for (const o of this.obstacles) {
                if (o.moving) {
                    o.x += o.vx * dt;
                    // 碰到边界反弹
                    const halfTrack = track.width / 2;
                    if (o.x < -halfTrack + 20 || o.x > halfTrack - 20) {
                        o.vx *= -1;
                        o.x = Utils.clamp(o.x, -halfTrack + 20, halfTrack - 20);
                    }
                }
            }
        }

        // === 雪花粒子 ===
        while (this.snowflakes.length < 100) {
            this.snowflakes.push({
                x: Utils.rand(-1200, 1200),
                y: Utils.rand(playerY - CONSTANTS.CANVAS_HEIGHT * 2, playerY + 200),
                speed: Utils.rand(30, 100),
                size: Utils.rand(1, 4),
                sway: Utils.rand(0, Math.PI * 2),
            });
        }
        for (const s of this.snowflakes) {
            s.y += s.speed * (1 / 60);
            s.x += Math.sin(s.sway) * 0.6;
            s.sway += 0.04;
            if (s.y > despawnBehind) {
                s.y = spawnAhead;
                s.x = Utils.rand(-1200, 1200);
            }
        }
    }

    _spawnChunk(y, track) {
        const halfTrack = track.width / 2;

        // --- 生成障碍 ---
        if (Math.random() < track.obstacleCount * 80) {
            const type = Math.random() < 0.7 ? 'tree' : 'rock';
            const w = type === 'tree' ? CONSTANTS.TREE_WIDTH : CONSTANTS.ROCK_WIDTH;
            const h = type === 'tree' ? CONSTANTS.TREE_HEIGHT : CONSTANTS.ROCK_HEIGHT;
            const x = Utils.rand(-halfTrack + 30, halfTrack - 30);

            const tooClose = this.obstacles.some(o =>
                Utils.distSq(o.x, o.y, x, y) < CONSTANTS.OBSTACLE_MIN_GAP * CONSTANTS.OBSTACLE_MIN_GAP
            );
            if (!tooClose) {
                const obstacle = { x, y, type, width: w, height: h };
                if (track.movingObstacles && Math.random() < track.movingRatio) {
                    obstacle.moving = true;
                    const speed = track.movingSpeed || 40;
                    obstacle.vx = Utils.rand(-speed, speed);
                }
                this.obstacles.push(obstacle);
            }
        }

        // --- 生成冰面 ---
        if (track.icePatches && Math.random() < track.iceChance * 80) {
            this.icePatches.push({
                x: Utils.rand(-halfTrack + 40, halfTrack - 40),
                y: y,
                width: Utils.rand(80, 180),
                height: Utils.rand(60, 120),
            });
        }
    }

    checkCollision(player, track, effectiveRadius) {
        const radius = effectiveRadius || player.radius * 0.8;
        for (const o of this.obstacles) {
            let hit;
            if (o.type === 'tree') {
                // 树的碰撞区域：上移并对齐树干，避免后方提前碰撞
                const collideY = o.y - o.height * 0.25;
                const collideW = o.width * 0.7;
                const collideH = o.height * 0.6;
                hit = Utils.rectCircleCollide(o.x, collideY, collideW, collideH, player.x, player.y, radius);
            } else {
                hit = Utils.rectCircleCollide(o.x, o.y, o.width, o.height, player.x, player.y, radius);
            }
            if (hit) return true;
        }
        return false;
    }

    checkIce(player) {
        for (const i of this.icePatches) {
            const halfW = i.width / 2;
            const halfH = i.height / 2;
            if (player.x > i.x - halfW && player.x < i.x + halfW &&
                player.y > i.y - halfH && player.y < i.y + halfH) {
                return true;
            }
        }
        return false;
    }

    // ========================= 伪 3D 渲染 =========================

    draw3D(ctx, track, screenW, screenH, camX, camY, playerY, horizonY, player) {
        const P3 = CONSTANTS.PSEUDO_3D;
        const segLen = P3.SEGMENT_LENGTH;
        const halfTrack = track.width / 2;
        const drawNearY = playerY + P3.CAMERA_DISTANCE + 20;
        const drawFarY = playerY - P3.DRAW_DISTANCE;

        const farOffset = Math.floor(drawFarY / segLen) * segLen;
        const nearOffset = Math.floor(drawNearY / segLen) * segLen;

        // 道路交替颜色
        const roadBase = track.color;
        const roadAlt = this._darken(roadBase, 6);

        // ---- 1. 由远到近画道路段（ painters algorithm ）----
        let sy = farOffset;
        while (sy <= nearOffset) {
            const segIndex = Math.floor(sy / segLen);
            const nextSy = sy + segLen;

            // 远边四个角
            const farL  = Utils.project3D(-halfTrack, sy, screenW, horizonY, camX, camY);
            const farR  = Utils.project3D( halfTrack, sy, screenW, horizonY, camX, camY);
            const nearL = Utils.project3D(-halfTrack, nextSy, screenW, horizonY, camX, camY);
            const nearR = Utils.project3D( halfTrack, nextSy, screenW, horizonY, camX, camY);

            if (farL && nearL) {
                const isAlt = (segIndex % 2 === 0);
                const wildColor = isAlt ? '#C9EAF6' : '#BADEF0';
                const roadColor = isAlt ? roadBase : roadAlt;

                // 两侧野雪（扩展画到屏幕外）
                this._drawWildSnow(ctx, farL, farR, nearL, nearR, screenW, wildColor);

                // 主雪道梯形
                ctx.fillStyle = roadColor;
                ctx.beginPath();
                ctx.moveTo(farL.sx, farL.sy);
                ctx.lineTo(farR.sx, farR.sy);
                ctx.lineTo(nearR.sx, nearR.sy);
                ctx.lineTo(nearL.sx, nearL.sy);
                ctx.closePath();
                ctx.fill();

                // 道路边界虚线（远处更密，近处更稀）
                if ((segIndex % 3) === 0) {
                    ctx.strokeStyle = '#8ECAE6';
                    ctx.lineWidth = Math.max(1, 2 * farL.scale);
                    ctx.beginPath();
                    ctx.moveTo(farL.sx, farL.sy);
                    ctx.lineTo(nearL.sx, nearL.sy);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(farR.sx, farR.sy);
                    ctx.lineTo(nearR.sx, nearR.sy);
                    ctx.stroke();
                }

                // 中心虚线（每5段）
                if ((segIndex % 5) === 0) {
                    const farM  = Utils.project3D(0, sy, screenW, horizonY, camX, camY);
                    const nearM = Utils.project3D(0, nextSy, screenW, horizonY, camX, camY);
                    if (farM && nearM) {
                        ctx.strokeStyle = 'rgba(142,202,230,0.6)';
                        ctx.lineWidth = Math.max(1, 1.5 * farL.scale);
                        ctx.setLineDash([4, 6]);
                        ctx.beginPath();
                        ctx.moveTo(farM.sx, farM.sy);
                        ctx.lineTo(nearM.sx, nearM.sy);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                }
            }

            sy += segLen;
        }

        // ---- 2. 收集所有可绘制对象并按深度（scale）排序 ----
        const sprites = [];

        // 冰面
        for (const i of this.icePatches) {
            if (i.y < drawFarY || i.y > drawNearY) continue;
            const proj = Utils.project3D(i.x, i.y, screenW, horizonY, camX, camY);
            if (!proj) continue;
            sprites.push({ type: 'ice', proj, data: i });
        }

        // 障碍
        for (const o of this.obstacles) {
            if (o.y < drawFarY || o.y > drawNearY) continue;
            const proj = Utils.project3D(o.x, o.y, screenW, horizonY, camX, camY);
            if (!proj) continue;
            sprites.push({ type: 'obstacle', proj, data: o });
        }

        // 雪花
        for (const s of this.snowflakes) {
            if (s.y < drawFarY || s.y > drawNearY) continue;
            const proj = Utils.project3D(s.x, s.y, screenW, horizonY, camX, camY);
            if (!proj) continue;
            sprites.push({ type: 'snow', proj, data: s });
        }

        // 由远到近绘制（scale 越大越近）
        sprites.sort((a, b) => a.proj.scale - b.proj.scale);

        for (const sp of sprites) {
            if (sp.type === 'ice') {
                this._drawIce3D(ctx, sp.data, sp.proj);
            } else if (sp.type === 'obstacle') {
                this._drawObstacle3D(ctx, sp.data, sp.proj, screenW, horizonY, camX, camY);
            } else if (sp.type === 'snow') {
                this._drawSnow3D(ctx, sp.data, sp.proj);
            }
        }
    }

    // 在道路两侧画野雪延伸到屏幕边缘
    _drawWildSnow(ctx, farL, farR, nearL, nearR, screenW, color) {
        const extendX = screenW * 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(farL.sx, farL.sy);
        ctx.lineTo(farL.sx - extendX, farL.sy);
        ctx.lineTo(nearL.sx - extendX, nearL.sy);
        ctx.lineTo(nearL.sx, nearL.sy);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(farR.sx, farR.sy);
        ctx.lineTo(farR.sx + extendX, farR.sy);
        ctx.lineTo(nearR.sx + extendX, nearR.sy);
        ctx.lineTo(nearR.sx, nearR.sy);
        ctx.closePath();
        ctx.fill();
    }

    _drawIce3D(ctx, ice, proj) {
        const s = proj.scale;
        ctx.save();
        ctx.translate(proj.sx, proj.sy);
        ctx.scale(s, s * 0.35); // 压缩高度，表现地面椭圆
        ctx.fillStyle = 'rgba(174,214,241,0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 0, ice.width / 2, ice.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-3, -4, ice.width / 3.5, ice.height / 3.5, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    _drawObstacle3D(ctx, o, proj, screenW, horizonY, camX, camY) {
        const P3 = CONSTANTS.PSEUDO_3D;
        if (o.type === 'tree') {
            // 树干 + 树冠高度
            const treeH = 80; // 世界单位中树的总高度
            const p = Utils.project3DWithHeight(o.x, o.y, treeH, screenW, horizonY, camX, camY);
            if (!p) return;
            const s = p.scale;

            ctx.save();
            // 树干（梯形）
            const trunkW = 10 * s;
            const trunkH = (p.syGround - p.syTop) * 0.22;
            ctx.fillStyle = '#5D4037';
            ctx.beginPath();
            ctx.moveTo(p.sx - trunkW * 0.4, p.syTop + (p.syGround - p.syTop) * 0.78);
            ctx.lineTo(p.sx + trunkW * 0.4, p.syTop + (p.syGround - p.syTop) * 0.78);
            ctx.lineTo(p.sx + trunkW * 0.25, p.syGround);
            ctx.lineTo(p.sx - trunkW * 0.25, p.syGround);
            ctx.closePath();
            ctx.fill();

            // 树冠三层三角形，随透视缩放在屏幕坐标上
            const topY = p.syTop;
            const bottomY = p.syTop + (p.syGround - p.syTop) * 0.8;
            const midY1 = p.syTop + (p.syGround - p.syTop) * 0.32;
            const midY2 = p.syTop + (p.syGround - p.syTop) * 0.58;
            const cw1 = 30 * s;
            const cw2 = 22 * s;
            const cw3 = 14 * s;

            const colors = ['#388E3C', '#2E7D32', '#1B5E20'];
            const widths = [cw1, cw2, cw3];
            const ys = [midY1, midY2, topY + (bottomY - topY) * 0.08];

            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i];
                const yy = ys[i];
                const hh = (bottomY - topY) * 0.3;
                ctx.beginPath();
                ctx.moveTo(p.sx, yy - hh * 0.55);
                ctx.lineTo(p.sx - widths[i], yy + hh * 0.45);
                ctx.lineTo(p.sx + widths[i], yy + hh * 0.45);
                ctx.closePath();
                ctx.fill();
            }

            // 雪顶
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(p.sx, topY);
            ctx.lineTo(p.sx - 10 * s, topY + 6 * s);
            ctx.lineTo(p.sx + 10 * s, topY + 6 * s);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (o.type === 'rock') {
            const s = proj.scale;
            ctx.save();
            ctx.translate(proj.sx, proj.sy);
            ctx.scale(s, s * 0.35);
            ctx.fillStyle = '#78909C';
            ctx.beginPath();
            ctx.ellipse(0, 0, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#90A4AE';
            ctx.beginPath();
            ctx.ellipse(-3, -3, o.width / 3.5, o.height / 3.5, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    _drawSnow3D(ctx, s, proj) {
        // 雪花不要压扁，保持圆润
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, s.size * proj.scale * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx, track, screenW, screenH, playerY) {
        // 保留旧 2D 方法（菜单预览等可能用到）
        const halfTrack = track.width / 2;
        const viewTop = -screenH * 2.0;
        const viewBottom = screenH * 2.5;
        const viewHeight = viewBottom - viewTop;

        ctx.fillStyle = "#d0e8f2";
        ctx.fillRect(-screenW * 4, viewTop, screenW * 8, viewHeight);
        ctx.fillStyle = track.color;
        ctx.fillRect(-halfTrack - 4, viewTop, (halfTrack + 4) * 2, viewHeight);

        ctx.strokeStyle = "#aed6f1";
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(-halfTrack, viewTop);
        ctx.lineTo(-halfTrack, viewBottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(halfTrack, viewTop);
        ctx.lineTo(halfTrack, viewBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const i of this.icePatches) {
            const relY = i.y - playerY;
            if (relY > screenH || relY < -screenH) continue;
            ctx.save();
            ctx.fillStyle = "rgba(174, 214, 241, 0.5)";
            ctx.beginPath();
            ctx.ellipse(i.x, i.y, i.width / 2, i.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(i.x - 5, i.y - 5, i.width / 3, i.height / 4, -0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        const visibleObs = this.obstacles.filter(o => {
            const relY = o.y - playerY;
            return relY > -screenH && relY < screenH;
        });
        visibleObs.sort((a, b) => a.y - b.y);
        for (const o of visibleObs) {
            this._drawObstacle2D(ctx, o.x, o.y, o);
        }

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (const s of this.snowflakes) {
            const relY = s.y - playerY;
            if (relY < -screenH || relY > screenH) continue;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawObstacle2D(ctx, x, y, o) {
        if (o.type === 'tree') {
            ctx.fillStyle = "#6d4c41";
            ctx.fillRect(x - 5, y - 5, 10, 15);
            const colors = ["#2ecc71", "#27ae60", "#1e8449"];
            const sizes = [28, 22, 16];
            const offsets = [-22, -30, -36];
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i];
                ctx.beginPath();
                ctx.moveTo(x, y + offsets[i]);
                ctx.lineTo(x - sizes[i], y + offsets[i] + 18);
                ctx.lineTo(x + sizes[i], y + offsets[i] + 18);
                ctx.closePath();
                ctx.fill();
            }
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(x, y - 38);
            ctx.lineTo(x - 8, y - 28);
            ctx.lineTo(x + 8, y - 28);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === 'rock') {
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.ellipse(x, y + 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#95a5a6";
            ctx.beginPath();
            ctx.ellipse(x - 3, y - 2, o.width / 3.5, o.height / 3.5, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _darken(hexColor, amount) {
        const hex = hexColor.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}
