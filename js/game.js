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

        // 移动端触摸
        const leftZone = document.getElementById('touch-left');
        const rightZone = document.getElementById('touch-right');
        const boostBtn = document.getElementById('btn-accelerate');

        if (leftZone) {
            leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.left = true; });
            leftZone.addEventListener('touchend', (e) => { e.preventDefault(); this.input.left = false; });
        }
        if (rightZone) {
            rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.right = true; });
            rightZone.addEventListener('touchend', (e) => { e.preventDefault(); this.input.right = false; });
        }
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

        // 急冻术免疫冰面减速
        this.input.onIce = this.player.skillId === "freeze" && this.player.skillActive
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
        const baseXpGain = kmGained * CONSTANTS.XP_PER_KM * outfit.bonus;
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
