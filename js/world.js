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
        // 补充满屏幕
        while (this.snowflakes.length < 80) {
            this.snowflakes.push({
                x: Utils.rand(-500, 500),
                y: Utils.rand(playerY - CONSTANTS.CANVAS_HEIGHT, playerY + 200),
                speed: Utils.rand(30, 80),
                size: Utils.rand(1, 3),
                sway: Utils.rand(0, Math.PI * 2),
            });
        }
        for (const s of this.snowflakes) {
            s.y += s.speed * (1 / 60);
            s.x += Math.sin(s.sway) * 0.5;
            s.sway += 0.05;
            if (s.y > despawnBehind) {
                s.y = spawnAhead;
                s.x = Utils.rand(-500, 500);
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

            // 与现有障碍做简单间距检查
            const tooClose = this.obstacles.some(o =>
                Utils.distSq(o.x, o.y, x, y) < CONSTANTS.OBSTACLE_MIN_GAP * CONSTANTS.OBSTACLE_MIN_GAP
            );
            if (!tooClose) {
                const obstacle = { x, y, type, width: w, height: h };

                // 移动障碍（使用 track.movingRatio 和 track.movingSpeed）
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

    /**
     * 检查玩家是否与障碍碰撞
     * @param {number} effectiveRadius 有效碰撞半径（幽灵形态时会变小）
     */
    checkCollision(player, track, effectiveRadius) {
        const radius = effectiveRadius || player.radius * 0.8;
        for (const o of this.obstacles) {
            const hit = Utils.rectCircleCollide(o.x, o.y, o.width, o.height, player.x, player.y, radius);
            if (hit) return true;
        }
        return false;
    }

    /**
     * 检查玩家是否在冰面上
     */
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

    /**
     * 绘制世界（世界坐标）
     * @param {number} playerY 玩家当前世界Y坐标（用于雪花和冰面的视锥剔除）
     */
    draw(ctx, track, screenW, screenH, playerY) {
        // === 雪道背景 ===
        const halfTrack = track.width / 2;
        // 由于 ctx 已经被 translate 到玩家为中心，这里用相对于玩家的坐标
        // 将背景范围扩大，避免任何极端情况下露底
        const viewTop = -screenH * 2.0;
        const viewBottom = screenH * 2.5;
        const viewHeight = viewBottom - viewTop;

        // 两侧野雪 — 横向足够大
        ctx.fillStyle = "#d0e8f2";
        ctx.fillRect(-screenW * 4, viewTop, screenW * 8, viewHeight);

        // 主雪道（稍白）
        ctx.fillStyle = track.color;
        ctx.fillRect(-halfTrack - 4, viewTop, (halfTrack + 4) * 2, viewHeight);

        // 雪道边界线
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

        // === 冰面 ===
        for (const i of this.icePatches) {
            // 视锥剔除：相对于玩家的位置
            const relY = i.y - playerY;
            if (relY > screenH || relY < -screenH) continue;

            ctx.save();
            ctx.fillStyle = "rgba(174, 214, 241, 0.5)";
            ctx.beginPath();
            ctx.ellipse(i.x, i.y, i.width / 2, i.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // 反光
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(i.x - 5, i.y - 5, i.width / 3, i.height / 4, -0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // === 障碍 ===
        // 按 Y 排序，实现正确遮挡
        const visibleObs = this.obstacles
            .filter(o => {
                const relY = o.y - playerY;
                return relY > -screenH && relY < screenH;
            });
        visibleObs.sort((a, b) => a.y - b.y);

        for (const o of visibleObs) {
            this._drawObstacle(ctx, o.x, o.y, o);
        }

        // === 雪花 ===
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (const s of this.snowflakes) {
            const relY = s.y - playerY;
            if (relY < -screenH || relY > screenH) continue;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawObstacle(ctx, x, y, o) {
        if (o.type === 'tree') {
            // 树干
            ctx.fillStyle = "#6d4c41";
            ctx.fillRect(x - 5, y - 5, 10, 15);
            // 树冠（三层三角形）
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
            // 雪顶
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(x, y - 38);
            ctx.lineTo(x - 8, y - 28);
            ctx.lineTo(x + 8, y - 28);
            ctx.closePath();
            ctx.fill();
        } else if (o.type === 'rock') {
            // 石头
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.ellipse(x, y + 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // 高光
            ctx.fillStyle = "#95a5a6";
            ctx.beginPath();
            ctx.ellipse(x - 3, y - 2, o.width / 3.5, o.height / 3.5, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
