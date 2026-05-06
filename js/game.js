/**
 * 核心游戏控制器
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'menu'; // menu, playing, paused, ended
        this.lastTime = 0;
        this.animationId = null;

        this.input = {
            left: false,
            right: false,
            boost: false,
            analogX: 0,
        };

        this.player = null;
        this.world = null;
        this.camera = { x: 0, y: 0 };

        // 单局数据
        this.session = null;
        this.selectedTrackLevel = 1; // 单局固定赛道

        // 外部回调
        this.onStateChange = null;
        this.onSessionEnd = null;

        this._bindInput();
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    // ========================= Input =========================

    _bindInput() {
        // 键盘
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) { this.input.left = true; e.preventDefault(); }
            if (['ArrowRight', 'd', 'D'].includes(e.key)) { this.input.right = true; e.preventDefault(); }
            // 加速：↑ 键
            if (e.key === 'ArrowUp') { this.input.boost = true; e.preventDefault(); }
            // 技能：空格键（按下即触发，非按住）
            if (e.code === 'Space') {
                e.preventDefault();
                this.triggerSkill();
            }
            if (e.key === 'Escape' || e.key === 'p') { this.togglePause(); }
        });

        document.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.input.left = false;
            if (['ArrowRight', 'd', 'D'].includes(e.key)) this.input.right = false;
            if (e.key === 'ArrowUp') this.input.boost = false;
        });

        // 移动端摇杆
        const joystickBase = document.getElementById('joystick-base');
        const joystickKnob = document.getElementById('joystick-knob');
        if (joystickBase && joystickKnob) {
            const JOYSTICK_RADIUS = 55; // knob 能到达 joystickBase 边缘的最大距离（像素）
            const JOYSTICK_MOVE_RADIUS = 33; // knob 可偏移的最大距离（留下底座）
            let joystickActive = false;
            let joystickCenter = { x: 0, y: 0 };

            const startJoystick = (clientX, clientY) => {
                const rect = joystickBase.getBoundingClientRect();
                joystickCenter = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
                joystickActive = true;
                joystickBase.classList.add('active');
                joystickKnob.classList.add('moving');
                updateJoystick(clientX, clientY);
            };

            const updateJoystick = (clientX, clientY) => {
                if (!joystickActive) return;
                let dx = clientX - joystickCenter.x;
                let dy = clientY - joystickCenter.y;
                const dist = Math.hypot(dx, dy);
                if (dist > JOYSTICK_MOVE_RADIUS) {
                    const ratio = JOYSTICK_MOVE_RADIUS / dist;
                    dx *= ratio;
                    dy *= ratio;
                }
                joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                this.input.analogX = dx / JOYSTICK_MOVE_RADIUS; // -1 ~ 1
                this.input.left = this.input.analogX < -0.15;
                this.input.right = this.input.analogX > 0.15;
            };

            const endJoystick = () => {
                if (!joystickActive) return;
                joystickActive = false;
                joystickBase.classList.remove('active');
                joystickKnob.classList.remove('moving');
                joystickKnob.style.transform = 'translate(-50%, -50%)';
                this.input.analogX = 0;
                this.input.left = false;
                this.input.right = false;
            };

            joystickBase.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                startJoystick(touch.clientX, touch.clientY);
            }, { passive: false });

            joystickBase.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                updateJoystick(touch.clientX, touch.clientY);
            }, { passive: false });

            // 桌面端：鼠标拖动摇杆
            joystickBase.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startJoystick(e.clientX, e.clientY);
            });
            document.addEventListener('mousemove', (e) => {
                updateJoystick(e.clientX, e.clientY);
            });
            document.addEventListener('mouseup', () => {
                endJoystick();
            });

            // touchend 和 touchcancel 处理文档级，避免手指划出范围丢失事件
            const handleTouchEnd = (e) => {
                // 检查是否还有涉及摇杆的触点
                let stillJoystick = false;
                for (let i = 0; i < e.touches.length; i++) {
                    const t = e.touches[i];
                    const rect = joystickBase.getBoundingClientRect();
                    if (t.clientX >= rect.left && t.clientX <= rect.right &&
                        t.clientY >= rect.top && t.clientY <= rect.bottom) {
                        stillJoystick = true;
                        break;
                    }
                }
                if (!stillJoystick) endJoystick();
            };
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);
        }

        // 加速按钮
        const boostBtn = document.getElementById('btn-accelerate');
        if (boostBtn) {
            boostBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.boost = true; });
            boostBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.input.boost = false; });
            boostBtn.addEventListener('mousedown', (e) => { e.preventDefault(); this.input.boost = true; });
            boostBtn.addEventListener('mouseup', (e) => { e.preventDefault(); this.input.boost = false; });
        }
    }

    _resizeCanvas() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    }

    // ========================= 游戏流程 =========================

    start(outfitId, trackLevel, skillId) {
        this.selectedTrackLevel = trackLevel || 1;
        const skill = CONSTANTS.SKILLS.find(s => s.id === (skillId || "invincible")) || CONSTANTS.SKILLS[0];

        this.session = {
            distance: 0,
            xpEarned: 0,
            coinsEarned: 0,
            offRoadTimer: 0,
            selectedTrack: this.selectedTrackLevel,
        };

        const startX = 0;
        const startY = 0;
        this.player = new Player(startX, startY, outfitId);
        this.player.skillId = skill.id;
        this.world = new World();
        this.world.lastSpawnY = startY - 100;

        this.state = 'playing';
        this.lastTime = performance.now();

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._loop(this.lastTime);
    }

    /**
     * 触发技能
     */
    triggerSkill() {
        if (!this.player) return;
        if (this.player.skillCooldown > 0 || this.player.skillActive) return;

        const skill = CONSTANTS.SKILLS.find(s => s.id === this.player.skillId);
        if (!skill) return;

        this.player.skillActive = true;
        this.player.skillTimer = skill.duration;
        this.player.skillCooldown = skill.cooldown;

        // 应用技能效果
        switch (skill.id) {
            case "invincible":
                this.player.invincible = true;
                this.player.currentSpeed = Math.min(this.player.currentSpeed * 2, CONSTANTS.MAX_SPEED);
                break;
            case "ghost":
                this.player.radiusModifier = 0.5;
                break;
            case "doublexp":
                this.player.xpMultiplier = 2.0;
                break;
            case "fire_rush":
                this.player.invincible = true;
                this.player.currentSpeed = CONSTANTS.MAX_SPEED;
                break;
            case "shadow":
                this.player.invincible = true;
                break;
            case "time_stop":
                this.world.setFrozen(true);
                break;
            case "gold_rush":
                this.player.xpMultiplier = 3.0;
                break;
        }

        if (this.onSkillTrigger) this.onSkillTrigger(skill);
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            if (this.onStateChange) this.onStateChange('paused');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.lastTime = performance.now();
            this._loop(this.lastTime);
            if (this.onStateChange) this.onStateChange('playing');
        }
    }

    forceEnd() {
        this.endGame();
    }

    endGame() {
        this.state = 'ended';
        if (this.animationId) cancelAnimationFrame(this.animationId);

        // 将结果写回存档
        const save = Storage.load();
        save.totalXp += this.session.xpEarned;

        // 自动解锁本局赛道（如果还没解锁的话 — 保底）
        if (!save.unlockedTracks.includes(this.selectedTrackLevel)) {
            save.unlockedTracks.push(this.selectedTrackLevel);
        }

        Storage.save(save);

        if (this.onSessionEnd) this.onSessionEnd(this.session);
    }

    // ========================= 主循环 =========================

    _loop(now) {
        if (this.state !== 'playing') return;

        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this._update(dt);
        this._render();

        this.animationId = requestAnimationFrame((t) => this._loop(t));
    }

    _update(dt) {
        if (!this.player || !this.world) return;

        const track = CONSTANTS.getTrackConfig(this.selectedTrackLevel);

        // === 技能冷却 & 持续时间更新 ===
        if (this.player.skillCooldown > 0) {
            this.player.skillCooldown = Math.max(0, this.player.skillCooldown - dt);
        }
        if (this.player.skillActive) {
            this.player.skillTimer -= dt;
            // 急冻术：冻结移动障碍
            this.world.setFrozen(this.player.skillId === "freeze" && this.player.skillTimer > 0);
            if (this.player.skillTimer <= 0) {
                this._endSkill();
            }
        }

        // 急冻术 / 时间凝滞 免疫冰面减速
        this.input.onIce = (this.player.skillId === "freeze" && this.player.skillActive)
            ? false : this.world.checkIce(this.player);

        this.player.boosting = this.input.boost;
        this.player.update(dt, this.input, track);
        this.world.update(this.player.y, track);

        // 碰撞检测 — 无敌状态下免疫碰撞
        const effectiveRadius = this.player.radius * this.player.radiusModifier;
        if (!this.player.invincible && this.world.checkCollision(this.player, track, effectiveRadius)) {
            this.endGame();
            return;
        }

        // === 离开雪道惩罚 ===
        if (this.player.offRoad) {
            this.session.offRoadTimer += dt;
            while (this.session.offRoadTimer >= 10) {
                this.session.xpEarned = Math.max(0, this.session.xpEarned - 1);
                this.session.offRoadTimer -= 10;
            }
        } else {
            this.session.offRoadTimer = 0;
        }

        this.camera.x = this.player.x;
        this.camera.y = this.player.y;

        // 记录距离 & 结算 XP
        const distMoved = this.player.currentSpeed * dt;
        this.session.distance += distMoved;

        const kmGained = distMoved / 1000;
        const outfit = CONSTANTS.OUTFITS.find(o => o.id === this.player.outfit.id) || CONSTANTS.OUTFITS[0];
        const trackMultiplier = 1 + (this.selectedTrackLevel - 1) * 0.1; // 赛道等级越高，经验倍率越高
        const baseXpGain = kmGained * CONSTANTS.XP_PER_KM * outfit.bonus * trackMultiplier;
        const xpGain = baseXpGain * this.player.xpMultiplier;
        this.session.xpEarned += xpGain;

        if (this.onHUDUpdate) this.onHUDUpdate();
    }

    /**
     * 结束技能效果
     */
    _endSkill() {
        if (!this.player) return;
        this.player.skillActive = false;
        this.player.invincible = false;
        this.player.radiusModifier = 1.0;
        this.player.xpMultiplier = 1.0;
        this.world.setFrozen(false);
        if (this.onSkillEnd) this.onSkillEnd();
    }

    _render() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#cfe2f3";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2 - this.camera.x, h * 0.65 - this.camera.y);

        const track = CONSTANTS.getTrackConfig(this.selectedTrackLevel);
        this.world.draw(ctx, track, w, h, this.player.y);
        this.player.draw(ctx);

        ctx.restore();

        if (this.player && this.player.offRoad) {
            ctx.save();
            ctx.fillStyle = "rgba(231, 76, 60, 0.15)";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#e74c3c";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️ 快回雪道!", w / 2, h * 0.25);
            ctx.restore();
        }
    }
}
