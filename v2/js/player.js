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

    update(dt, input, track) {
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            return;
        }

        const targetSpeed = this.boosting ? this.boostSpeed : this.baseSpeed;
        let accel = CONSTANTS.ACCELERATION;

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

        let targetVx = 0;
        if (input.analogX !== undefined && input.analogX !== 0) {
            targetVx = input.analogX * CONSTANTS.TURN_SPEED;
        } else {
            if (input.left) targetVx = -CONSTANTS.TURN_SPEED;
            if (input.right) targetVx = CONSTANTS.TURN_SPEED;
        }

        let turnFactor = 1.0;
        if (this.offRoad) turnFactor = 0.3;
        if (input.onIce) turnFactor *= 0.5;

        const turnAccel = CONSTANTS.TURN_ACCEL * turnFactor;
        if (this.vx < targetVx) {
            this.vx += turnAccel * dt;
            if (this.vx > targetVx) this.vx = targetVx;
        } else if (this.vx > targetVx) {
            this.vx -= turnAccel * dt;
            if (this.vx < targetVx) this.vx = targetVx;
        }

        this.x += this.vx * dt;

        if (this.x < -halfTrack - 100) {
            this.x = -halfTrack - 100;
            this.vx = 0;
        }
        if (this.x > halfTrack + 100) {
            this.x = halfTrack + 100;
            this.vx = 0;
        }

        this.y -= this.currentSpeed * dt;

        if (this.vx !== 0) {
            this.swayAngle += 4 * dt;
        } else {
            this.swayAngle *= 0.9;
        }
        this.trailTimer += dt;
    }

    crash() {
        if (this.stunned) return;
        this.stunned = true;
        this.stunTimer = CONSTANTS.CRASH_STUN_DURATION;
        this.currentSpeed = 0;
        this.vx *= 0.3;
    }

    // ========================= 伪 3D 渲染 =========================

    /**
     * 玩家在伪3D场景中绘制
     * @param {number} screenX - 屏幕X坐标（画布中央）
     * @param {number} screenY - 屏幕Y坐标（底部）
     */
    draw3D(ctx, screenX, screenY, screenW, track, camX, camY, horizonY) {
        const tilt = Math.sin(this.swayAngle) * 0.12;
        const lean = this.vx / CONSTANTS.TURN_SPEED; // -1 ~ 1

        ctx.save();
        ctx.translate(screenX, screenY);

        if (this.stunned) {
            ctx.rotate(Math.sin(Date.now() / 120) * 0.25);
            ctx.globalAlpha = 0.7;
        }

        // 技能光环
        if (this.skillActive) {
            const pulse = Math.sin(Date.now() / 80) * 0.15 + 0.85;
            const color = this.getSkillColor();
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = pulse * 0.2;
            ctx.beginPath();
            ctx.ellipse(0, 18, 32, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const scale = 1.1;
        ctx.scale(scale, scale);

        // 滑雪痕迹（ trails ）由摄像机和玩家相对位置投射到底部梯形中不好做，略去
        // 或者简单画两个雪痕在后面
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        if (this.currentSpeed > 30) {
            ctx.beginPath();
            ctx.ellipse(-10 + lean * 4, 32, 5, 2, tilt * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10 + lean * 4, 32, 5, 2, tilt * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.rotate(tilt + lean * 0.15);

        // === 滑雪板 ===
        ctx.fillStyle = '#5D4037';
        // 左板
        this._roundRect(ctx, -22, 24, 7, 32, 3);
        ctx.fill();
        // 右板
        this._roundRect(ctx, 15, 24, 7, 32, 3);
        ctx.fill();
        // 板尖红
        ctx.fillStyle = '#E74C3C';
        this._roundRect(ctx, -22, 24, 7, 10, 3);
        ctx.fill();
        this._roundRect(ctx, 15, 24, 7, 10, 3);
        ctx.fill();

        // === 腿部 ===
        ctx.fillStyle = '#455A64';
        this._roundRect(ctx, -14, 10, 8, 20, 3);
        ctx.fill();
        this._roundRect(ctx, 6, 10, 8, 20, 3);
        ctx.fill();

        // === 身体 ===
        ctx.save();
        ctx.translate(lean * 3, 0);
        ctx.fillStyle = this.outfit.colorBody;
        this._roundRect(ctx, -14, -12, 28, 24, 6);
        ctx.fill();

        // === 手臂 ===
        ctx.strokeStyle = this.outfit.colorBody;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-28, -2 + lean * 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(28, -2 + lean * 6);
        ctx.stroke();

        // 手套
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(-28, -2 + lean * 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(28, -2 + lean * 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === 头部 ===
        // 围巾
        ctx.fillStyle = this.outfit.colorScarf;
        this._roundRect(ctx, -12, -26, 24, 10, 4);
        ctx.fill();
        if (this.currentSpeed > 100) {
            ctx.beginPath();
            ctx.moveTo(10, -20);
            ctx.quadraticCurveTo(22 + this.currentSpeed / 18, -16, 18 + this.currentSpeed / 14, -8);
            ctx.lineTo(10, -18);
            ctx.fill();
        }

        // 脸
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(0, -40, 16, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-5, -42, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -42, 3, 0, Math.PI * 2);
        ctx.fill();

        // 腮红
        ctx.fillStyle = 'rgba(255,100,100,0.3)';
        ctx.beginPath();
        ctx.arc(-9, -38, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, -38, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 嘴
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -34, 5, 0.15, Math.PI - 0.15);
        ctx.stroke();

        // 帽子
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.arc(0, -50, 15, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -50, 15, Math.PI, Math.PI * 2);
        ctx.fill();

        // 帽球
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(0, -66, 6, 0, Math.PI * 2);
        ctx.fill();

        // 护目镜（加速时）
        if (this.currentSpeed > 300) {
            ctx.fillStyle = '#3498DB';
            ctx.globalAlpha = 0.55;
            this._roundRect(ctx, -12, -48, 24, 10, 5);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore(); // 恢复整体 state
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ========================= 旧 2D 渲染（菜单等复用） =========================

    draw(ctx) {
        const x = this.x;
        const y = this.y;

        ctx.save();
        ctx.translate(x, y);
        if (this.stunned) {
            ctx.rotate(Math.sin(Date.now() / 100) * 0.2);
            ctx.globalAlpha = 0.7;
        }

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

        ctx.save();
        ctx.rotate(tilt);
        ctx.fillStyle = "#8d6e63";
        this._roundRect(ctx, -16, 6, 6, 28, 3); ctx.fill();
        this._roundRect(ctx, 10, 6, 6, 28, 3); ctx.fill();
        ctx.fillStyle = "#e74c3c";
        this._roundRect(ctx, -16, 6, 6, 8, 3); ctx.fill();
        this._roundRect(ctx, 10, 6, 6, 8, 3); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(tilt);
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.ellipse(0, -2, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#34495e";
        this._roundRect(ctx, -10, 6, 8, 12, 2); ctx.fill();
        this._roundRect(ctx, 2, 6, 8, 12, 2); ctx.fill();
        ctx.restore();

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
        ctx.fillStyle = "#5d4037";
        ctx.beginPath();
        ctx.arc(-22, 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = this.outfit.colorScarf;
        this._roundRect(ctx, -10, -24, 20, 6, 3); ctx.fill();
        if (this.currentSpeed > 100) {
            ctx.beginPath();
            ctx.moveTo(8, -22);
            ctx.quadraticCurveTo(18 + this.currentSpeed / 20, -18, 14 + this.currentSpeed / 15, -12);
            ctx.lineTo(8, -18);
            ctx.fill();
        }
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(0, -34, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(-5, -36, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -36, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,100,100,0.3)";
        ctx.beginPath();
        ctx.arc(-8, -32, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -32, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.arc(0, -40, 13, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, -53, 5, 0, Math.PI * 2); ctx.fill();
        if (this.currentSpeed > 300) {
            ctx.fillStyle = "#3498db";
            ctx.globalAlpha = 0.6;
            this._roundRect(ctx, -11, -39, 22, 8, 4); ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        ctx.restore();
    }

    getSkillColor() {
        const skill = CONSTANTS.SKILLS.find(s => s.id === this.skillId);
        return skill ? skill.color : "#fff";
    }

    drawPreview(ctx, cx, cy, scale = 1) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        ctx.fillStyle = "#8d6e63";
        this._roundRect(ctx, -16, 6, 6, 28, 3); ctx.fill();
        this._roundRect(ctx, 10, 6, 6, 28, 3); ctx.fill();
        ctx.fillStyle = "#e74c3c";
        this._roundRect(ctx, -16, 6, 6, 8, 3); ctx.fill();
        this._roundRect(ctx, 10, 6, 6, 8, 3); ctx.fill();

        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.ellipse(0, -2, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#34495e";
        this._roundRect(ctx, -10, 6, 8, 12, 2); ctx.fill();
        this._roundRect(ctx, 2, 6, 8, 12, 2); ctx.fill();

        ctx.fillStyle = this.outfit.colorScarf;
        this._roundRect(ctx, -10, -24, 20, 6, 3); ctx.fill();

        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(0, -34, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(-5, -36, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -36, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -30, 4, 0.2, Math.PI - 0.2); ctx.stroke();

        ctx.fillStyle = this.outfit.colorBody;
        ctx.beginPath();
        ctx.arc(0, -40, 13, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, -53, 5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}
