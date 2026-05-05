/**
 * 玩家对象
 */

class Player {
    constructor(x, y, outfitId) {
        this.x = x;
        this.y = y;
        this.radius = 14;          // 碰撞半径

        this.vx = 0;               // 横向速度
        this.baseSpeed = CONSTANTS.BASE_SPEED; // 纵向基础速度
        this.currentSpeed = 0;     // 当前纵向速度
        this.maxSpeed = CONSTANTS.MAX_SPEED;
        this.boostSpeed = CONSTANTS.BOOST_SPEED;

        this.boosting = false;
        this.stunned = false;
        this.stunTimer = 0;
        this.offRoad = false;

        // 技能小人状态
        this.skillCooldown = 0;     // 冷却剩余秒数
        this.skillActive = false;   // 是否激活中
        this.skillTimer = 0;        // 技能持续时间剩余秒数
        this.skillId = null;        // 当前携带的技能ID
        this.invincible = false;    // 无敌状态
        this.xpMultiplier = 1.0;    // XP倍率
        this.radiusModifier = 1.0;  // 碰撞半径倍率

        this.outfit = CONSTANTS.OUTFITS.find(o => o.id === outfitId) || CONSTANTS.OUTFITS[0];

        // 动画状态
        this.swayAngle = 0;
        this.trailTimer = 0;
    }

    /**
     * 更新玩家状态
     * @param {number} dt 时间增量(秒)
     * @param {Object} input 输入状态 { left, right, boost, analogX }
     * @param {Object} track 当前赛道配置
     */
    update(dt, input, track) {
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            return; // 眩晕时不可控
        }

        // === 纵向速度 ===
        const targetSpeed = this.boosting ? this.boostSpeed : this.baseSpeed;
        let accel = CONSTANTS.ACCELERATION;

        // 冲出雪道 - 大幅减速
        const halfTrack = track.width / 2;
        this.offRoad = Math.abs(this.x) > halfTrack;
        if (this.offRoad) {
            accel *= 0.3;
        }

        if (this.currentSpeed < targetSpeed) {
            this.currentSpeed += accel * dt;
        } else if (this.currentSpeed > targetSpeed) {
            this.currentSpeed -= CONSTANTS.FRICTION * dt;
        }
        this.currentSpeed = Math.max(0, this.currentSpeed);

        // === 横向移动 ===
        let targetVx = 0;
        if (input.analogX !== undefined && input.analogX !== 0) {
            // 使用摇杆模拟量
            targetVx = input.analogX * CONSTANTS.TURN_SPEED;
        } else {
            if (input.left) targetVx = -CONSTANTS.TURN_SPEED;
            if (input.right) targetVx = CONSTANTS.TURN_SPEED;
        }

        // 冰面或冲出雪道时操控性下降
        let turnFactor = 1.0;
        if (this.offRoad) turnFactor = 0.3;
        if (input.onIce) turnFactor *= 0.5; // 冰面额外减速

        const turnAccel = CONSTANTS.TURN_ACCEL * turnFactor;
        if (this.vx < targetVx) {
            this.vx += turnAccel * dt;
            if (this.vx > targetVx) this.vx = targetVx;
        } else if (this.vx > targetVx) {
            this.vx -= turnAccel * dt;
            if (this.vx < targetVx) this.vx = targetVx;
        }

        this.x += this.vx * dt;

        // 模糊边界 - 出界太多时硬拉回，并减速
        if (this.x < -halfTrack - 100) {
            this.x = -halfTrack - 100;
            this.vx = 0;
        }
        if (this.x > halfTrack + 100) {
            this.x = halfTrack + 100;
            this.vx = 0;
        }

        // === y 轴前进 ===
        this.y -= this.currentSpeed * dt;

        // === 动画 ===
        if (this.vx !== 0) {
            this.swayAngle += 4 * dt;
        } else {
            this.swayAngle *= 0.9;
        }

        // 滑雪痕迹
        this.trailTimer += dt;
    }

    /**
     * 碰撞处理
     */
    crash() {
        if (this.stunned) return;
        this.stunned = true;
        this.stunTimer = CONSTANTS.CRASH_STUN_DURATION;
        this.currentSpeed = 0;
        this.vx *= 0.3;
    }

    /**
     * 绘制卡通人物（世界坐标）
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const x = this.x;
        const y = this.y;

        ctx.save();
        ctx.translate(x, y);
        if (this.stunned) {
            ctx.rotate(Math.sin(Date.now() / 100) * 0.2);
            ctx.globalAlpha = 0.7;
        }

        // 技能激活时的光环效果
        if (this.skillActive) {
            const pulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
            const color = this.getSkillColor();
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = pulse * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const tilt = Math.sin(this.swayAngle) * 0.08;

        // === 滑雪板 ===
        ctx.save();
        ctx.rotate(tilt);
        ctx.fillStyle = "#8d6e63";
        // 左板
        ctx.beginPath();
        ctx.roundRect(-16, 6, 6, 28, 3);
        ctx.fill();
        // 右板
        ctx.beginPath();
        ctx.roundRect(10, 6, 6, 28, 3);
        ctx.fill();
        // 板尖红色
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.roundRect(-16, 6, 6, 8, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(10, 6, 6, 8, 3);
        ctx.fill();
        ctx.restore();

        // === 身体 ===
        ctx.save();
        ctx.rotate(tilt);
        // 躯干
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.ellipse(0, -2, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 裤子
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.roundRect(-10, 6, 8, 12, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2, 6, 8, 12, 2);
        ctx.fill();
        ctx.restore();

        // === 手臂 ===
        ctx.save();
        ctx.rotate(tilt);
        ctx.strokeStyle = this.outfit.colorBody;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-22, 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, -6);
        ctx.lineTo(22, 2);
        ctx.stroke();
        // 手套
        ctx.fillStyle = "#5d4037";
        ctx.beginPath();
        ctx.arc(-22, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === 头部 ===
        ctx.save();
        // 围巾
        ctx.fillStyle = this.outfit.colorScarf;
        ctx.beginPath();
        ctx.roundRect(-10, -24, 20, 6, 3);
        ctx.fill();
        // 围巾飘带
        if (this.currentSpeed > 100) {
            ctx.beginPath();
            ctx.moveTo(8, -22);
            ctx.quadraticCurveTo(18 + this.currentSpeed / 20, -18, 14 + this.currentSpeed / 15, -12);
            ctx.lineTo(8, -18);
            ctx.fill();
        }

        // 脸
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(0, -34, 14, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(-5, -36, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -36, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 腮红
        ctx.fillStyle = "rgba(255,100,100,0.3)";
        ctx.beginPath();
        ctx.arc(-8, -32, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -32, 3, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // 雪帽
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.arc(0, -40, 13, Math.PI, 0);
        ctx.fill();
        // 帽球
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, -53, 5, 0, Math.PI * 2);
        ctx.fill();

        // 护目镜（加速时）
        if (this.currentSpeed > 300) {
            ctx.fillStyle = "#3498db";
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.roundRect(-11, -39, 22, 8, 4);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        ctx.restore(); // 恢复整体 state（stun rotation）
    }

    /**
     * 获取当前技能颜色
     */
    getSkillColor() {
        const skill = CONSTANTS.SKILLS.find(s => s.id === this.skillId);
        return skill ? skill.color : "#fff";
    }

    /**
     * 简单的预览绘制（用于菜单）
     */
    drawPreview(ctx, cx, cy, scale = 1) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // 滑雪板
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.roundRect(-16, 6, 6, 28, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(10, 6, 6, 28, 3);
        ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.roundRect(-16, 6, 6, 8, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(10, 6, 6, 8, 3);
        ctx.fill();

        // 身体
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.ellipse(0, -2, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.roundRect(-10, 6, 8, 12, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2, 6, 8, 12, 2);
        ctx.fill();

        // 围巾
        ctx.fillStyle = this.outfit.colorScarf;
        ctx.beginPath();
        ctx.roundRect(-10, -24, 20, 6, 3);
        ctx.fill();

        // 脸
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(0, -34, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(-5, -36, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -36, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // 帽子
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.arc(0, -40, 13, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, -53, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
