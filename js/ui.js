/**
 * UI 控制器
 */

const UI = {
    screens: {
        menu: document.getElementById('main-menu'),
        game: document.getElementById('game-container'),
    },
    elements: {
        // Menu
        menuXp: document.getElementById('menu-xp'),
        menuLevel: document.getElementById('menu-level'),
        menuCurrentTrack: document.getElementById('menu-current-track'),
        menuCurrentSkill: document.getElementById('menu-current-skill'),
        btnChangeTrack: document.getElementById('btn-change-track'),
        btnChangeSkill: document.getElementById('btn-change-skill'),
        menuBgCanvas: document.getElementById('menu-bg-canvas'),

        // HUD
        hud: document.getElementById('hud'),
        hudSpeed: document.getElementById('hud-speed'),
        hudDistance: document.getElementById('hud-distance'),
        hudTrack: document.getElementById('hud-track'),
        hudXp: document.getElementById('hud-xp'),
        hudOffRoad: document.getElementById('hud-offroad'),
        hudOffRoadTimer: document.getElementById('hud-offroad-timer'),

        // Skill UI
        skillBar: document.getElementById('skill-bar'),
        skillBtn: document.getElementById('btn-skill'),
        skillRingProgress: document.getElementById('skill-ring-progress'),
        skillTimer: document.getElementById('skill-timer'),
        skillRingProgressMobile: document.getElementById('skill-ring-progress-mobile'),
        skillTimerMobile: document.getElementById('skill-timer-mobile'),
        btnMobileSkill: document.getElementById('btn-mobile-skill'),

        // Mobile / Desktop
        mobileControls: document.getElementById('mobile-controls'),
        desktopHint: document.getElementById('desktop-hint'),

        // Modals
        resultModal: document.getElementById('result-modal'),
        resultDistance: document.getElementById('result-distance'),
        resultXp: document.getElementById('result-xp'),
        resultTrack: document.getElementById('result-track'),

        pauseModal: document.getElementById('pause-modal'),

        shopModal: document.getElementById('shop-modal'),
        shopXp: document.getElementById('shop-xp'),
        tabTrack: document.getElementById('tab-track'),
        tabOutfit: document.getElementById('tab-outfit'),
        shopItems: document.getElementById('shop-items'),
        btnCloseShop: document.getElementById('btn-close-shop'),

        trackModal: document.getElementById('track-modal'),
        trackSelectXp: document.getElementById('track-select-xp'),
        trackItems: document.getElementById('track-items'),
        btnCloseTrack: document.getElementById('btn-close-track'),

        skillModal: document.getElementById('skill-modal'),
        skillItems: document.getElementById('skill-items'),
        btnCloseSkill: document.getElementById('btn-close-skill'),

        helpModal: document.getElementById('help-modal'),

        // Buttons
        btnPlay: document.getElementById('btn-play'),
        btnShop: document.getElementById('btn-shop'),
        btnHelp: document.getElementById('btn-help'),
        btnRestart: document.getElementById('btn-restart'),
        btnMenu: document.getElementById('btn-menu'),
        btnResume: document.getElementById('btn-resume'),
        btnPauseMenu: document.getElementById('btn-pause-menu'),
        btnCloseHelp: document.getElementById('btn-close-help'),
        btnEndRun: document.getElementById('btn-end-run'),

        // Preview canvas
        previewCanvas: document.getElementById('preview-canvas'),
    },

    // 菜单动画状态
    menuAnim: {
        ctx: null,
        width: 0,
        height: 0,
        playerX: 0,
        snowOffset: 0,
        trees: [],
        animId: null,
    },

    init(game) {
        this.game = game;
        this.shopTab = 'track';

        this._setupMenuBg();
        this._bindButtons();
        this._updateMenuStats();
        this._drawPreviewCharacter();

        if (Utils.isTouchDevice()) {
            this.elements.mobileControls.classList.remove('hidden');
            this.elements.desktopHint.classList.add('hidden');
        } else {
            this.elements.mobileControls.classList.add('hidden');
            this.elements.desktopHint.classList.remove('hidden');
        }

        game.onStateChange = (state) => this._onGameStateChange(state);
        game.onSessionEnd = (session) => this._showResult(session);
        game.onHUDUpdate = () => this._updateHUD();
        game.onSkillTrigger = (skill) => this._onSkillTrigger(skill);
        game.onSkillEnd = () => this._onSkillEnd();

        // 启动菜单背景动画
        this._startMenuAnimation();
    },

    // ================= 菜单背景动画 =================

    _setupMenuBg() {
        const canvas = this.elements.menuBgCanvas;
        const ctx = canvas.getContext('2d');
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        this.menuAnim.ctx = ctx;
        this.menuAnim.width = w;
        this.menuAnim.height = h;
        this.menuAnim.playerX = w / 2;

        // 初始化背景树木
        this.menuAnim.trees = [];
        for (let i = 0; i < 15; i++) {
            this.menuAnim.trees.push({
                x: Utils.rand(0, w),
                y: Utils.rand(0, h),
                size: Utils.rand(20, 40),
            });
        }

        window.addEventListener('resize', () => {
            const nw = window.innerWidth;
            const nh = window.innerHeight;
            canvas.width = nw;
            canvas.height = nh;
            this.menuAnim.width = nw;
            this.menuAnim.height = nh;
            this.menuAnim.playerX = nw / 2;
        });
    },

    _startMenuAnimation() {
        const animate = () => {
            if (!this.screens.menu.classList.contains('active')) {
                this.menuAnim.animId = requestAnimationFrame(animate);
                return;
            }

            const ctx = this.menuAnim.ctx;
            const w = this.menuAnim.width;
            const h = this.menuAnim.height;

            this.menuAnim.snowOffset += 0.5;

            // 天空渐变
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#87CEEB');
            grad.addColorStop(0.4, '#E0F6FF');
            grad.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // 远处山脉
            ctx.fillStyle = '#7eb8da';
            ctx.beginPath();
            ctx.moveTo(0, h * 0.45);
            for (let x = 0; x <= w; x += 40) {
                const y = h * 0.45 - Math.sin(x * 0.01) * 30 - Math.cos(x * 0.003) * 50;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();

            // 近处雪坡
            ctx.fillStyle = '#d0e8f2';
            ctx.beginPath();
            ctx.moveTo(0, h * 0.55);
            for (let x = 0; x <= w; x += 30) {
                const y = h * 0.55 + Math.sin(x * 0.008) * 25;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();

            // 主雪道
            ctx.fillStyle = '#f0f8ff';
            ctx.fillRect(w * 0.3, h * 0.55, w * 0.4, h * 0.45);

            // 雪道边界
            ctx.strokeStyle = '#aed6f1';
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.moveTo(w * 0.3, h * 0.55);
            ctx.lineTo(w * 0.3, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(w * 0.7, h * 0.55);
            ctx.lineTo(w * 0.7, h);
            ctx.stroke();
            ctx.setLineDash([]);

            // 背景树木
            for (const t of this.menuAnim.trees) {
                const treeY = (t.y + this.menuAnim.snowOffset) % (h + 60) - 30;
                this._drawMenuTree(ctx, t.x, treeY, t.size);
            }

            // 雪花粒子
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 60; i++) {
                const sx = (i * 137.5 + this.menuAnim.snowOffset * 0.3) % w;
                const sy = (i * 83.3 + this.menuAnim.snowOffset * (0.5 + i * 0.01)) % h;
                ctx.beginPath();
                ctx.arc(sx, sy, Utils.rand(1, 3), 0, Math.PI * 2);
                ctx.fill();
            }

            // 平移中的玩家（使用当前装备的滑雪服）
            const save = Storage.load();
            const outfit = CONSTANTS.OUTFITS.find(o => o.id === save.equippedOutfit) || CONSTANTS.OUTFITS[0];
            const playerY = h * 0.7 + Math.sin(this.menuAnim.snowOffset * 0.02) * 20;
            this.menuAnim.playerX = w / 2 + Math.sin(this.menuAnim.snowOffset * 0.015) * 40;

            const p = new Player(0, 0, outfit.id);
            p.x = this.menuAnim.playerX;
            p.y = playerY;
            p.currentSpeed = 150;
            p.draw(ctx);

            this.menuAnim.animId = requestAnimationFrame(animate);
        };
        this.menuAnim.animId = requestAnimationFrame(animate);
    },

    _drawMenuTree(ctx, x, y, size) {
        // 只在雪道两侧画树
        const w = this.menuAnim.width;
        if (x > w * 0.25 && x < w * 0.75) return;

        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(x - size * 0.12, y, size * 0.24, size * 0.3);
        const colors = ['#2ecc71', '#27ae60', '#1e8449'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            const sy = y - size * 0.2 * i - size * 0.3;
            const ss = size * (0.6 - i * 0.15);
            ctx.moveTo(x, sy - ss);
            ctx.lineTo(x - ss, sy);
            ctx.lineTo(x + ss, sy);
            ctx.closePath();
            ctx.fill();
        }
    },

    // ================= 菜单 =================

    showMenu() {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens.menu.classList.add('active');
        this.elements.hud.classList.add('hidden');
        this.elements.resultModal.classList.add('hidden');
        this.elements.pauseModal.classList.add('hidden');
        this.elements.skillBar.classList.add('hidden');
        this._updateMenuStats();
        this._drawPreviewCharacter();
    },

    _updateMenuStats() {
        const save = Storage.load();
        this.elements.menuXp.textContent = save.totalXp;
        this.elements.menuLevel.textContent = Math.max(...save.unlockedTracks);

        const track = CONSTANTS.getTrackConfig(save.selectedTrack);
        this.elements.menuCurrentTrack.textContent = `${track.level} - ${track.name}`;

        const skill = CONSTANTS.SKILLS.find(s => s.id === save.selectedSkill) || CONSTANTS.SKILLS[0];
        this.elements.menuCurrentSkill.textContent = `${skill.icon} ${skill.name}`;
    },

    _drawPreviewCharacter() {
        const canvas = this.elements.previewCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const save = Storage.load();
        const outfit = CONSTANTS.OUTFITS.find(o => o.id === save.equippedOutfit) || CONSTANTS.OUTFITS[0];
        const p = new Player(0, 0, outfit.id);
        p.drawPreview(ctx, canvas.width / 2, canvas.height / 2 + 35, 1.2);
    },

    // ================= 游戏 HUD =================

    showGame() {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens.game.classList.add('active');
        this.elements.hud.classList.remove('hidden');
        this.elements.resultModal.classList.add('hidden');
        this.elements.skillBar.classList.remove('hidden');

        // 始终显示移动端操控控件（支持鼠标/触摸）
        this.elements.mobileControls.classList.remove('hidden');
        this.elements.desktopHint.classList.remove('hidden');

        // 设置技能按钮颜色和内容
        const save = Storage.load();
        const skill = CONSTANTS.SKILLS.find(s => s.id === save.selectedSkill) || CONSTANTS.SKILLS[0];
        this.elements.skillBtn.textContent = skill.icon;
        this.elements.skillBtn.style.borderColor = skill.color;
        this.elements.skillBtn.style.color = skill.color;
        this.elements.btnMobileSkill.textContent = skill.icon;
        this.elements.btnMobileSkill.style.borderColor = skill.color;
        this.elements.skillRingProgress.style.color = '#27ae60';
        this.elements.skillRingProgressMobile.style.color = '#27ae60';
        this._updateSkillStatus(0, 0, false);
    },

    _updateHUD() {
        const g = this.game;
        if (!g.player) return;

        this.elements.hudSpeed.textContent = Utils.formatSpeed(g.player.currentSpeed);
        this.elements.hudDistance.textContent = Utils.formatDistance(g.session.distance);
        this.elements.hudTrack.textContent = g.session.selectedTrack;

        const xpVal = g.session.xpEarned;
        this.elements.hudXp.textContent = (xpVal >= 0 ? '+' : '') + Math.floor(xpVal);

        if (g.player.offRoad) {
            this.elements.hudOffRoad.classList.remove('hidden');
            const countdown = Math.max(0, Math.ceil(10 - g.session.offRoadTimer));
            this.elements.hudOffRoadTimer.textContent = countdown;
        } else {
            this.elements.hudOffRoad.classList.add('hidden');
        }

        // 技能状态更新
        if (g.player.skillId) {
            this._updateSkillStatus(
                g.player.skillCooldown,
                g.player.skillTimer,
                g.player.skillActive
            );
        }
    },

    _updateSkillStatus(cooldown, duration, active) {
        const ringDesk = this.elements.skillRingProgress;
        const ringMobile = this.elements.skillRingProgressMobile;
        const timerDesk = this.elements.skillTimer;
        const timerMobile = this.elements.skillTimerMobile;
        const save = Storage.load();
        const skill = CONSTANTS.SKILLS.find(s => s.id === save.selectedSkill) || CONSTANTS.SKILLS[0];
        const circumference = 2 * Math.PI * 32; // ~201.06

        if (active) {
            // 技能生效中：环形进度表示剩余时长
            const progress = duration / skill.duration;
            const offset = circumference * (1 - progress);
            ringDesk.style.strokeDashoffset = offset;
            ringMobile.style.strokeDashoffset = offset;
            ringDesk.style.color = skill.color;
            ringMobile.style.color = skill.color;
            timerDesk.textContent = Math.ceil(duration);
            timerMobile.textContent = Math.ceil(duration);
            timerDesk.classList.remove('hidden');
            timerMobile.classList.remove('hidden');
            this.elements.skillBtn.textContent = skill.icon;
            this.elements.btnMobileSkill.textContent = skill.icon;
        } else if (cooldown > 0) {
            // 冷却中：环形进度表示冷却剩余（倒序填充）
            const progress = cooldown / skill.cooldown;
            const offset = circumference * progress;
            ringDesk.style.strokeDashoffset = offset;
            ringMobile.style.strokeDashoffset = offset;
            ringDesk.style.color = '#555';
            ringMobile.style.color = '#555';
            timerDesk.textContent = Math.ceil(cooldown);
            timerMobile.textContent = Math.ceil(cooldown);
            timerDesk.classList.remove('hidden');
            timerMobile.classList.remove('hidden');
        } else {
            // 就绪：绿色完整环形
            ringDesk.style.strokeDashoffset = 0;
            ringMobile.style.strokeDashoffset = 0;
            ringDesk.style.color = '#27ae60';
            ringMobile.style.color = '#27ae60';
            timerDesk.classList.add('hidden');
            timerMobile.classList.add('hidden');
        }
    },

    _onSkillTrigger(skill) {
        this._updateSkillStatus(0, skill.duration, true);
    },

    _onSkillEnd() {
        const save = Storage.load();
        const skill = CONSTANTS.SKILLS.find(s => s.id === save.selectedSkill) || CONSTANTS.SKILLS[0];
        this._updateSkillStatus(skill.cooldown, 0, false);
    },

    // ================= 结果弹窗 =================

    _showResult(session) {
        const config = CONSTANTS.getTrackConfig(session.selectedTrack);
        this.elements.resultTrack.textContent = `赛道 ${config.level} - ${config.name}`;
        this.elements.resultDistance.textContent = Utils.formatDistance(session.distance) + ' km';
        this.elements.resultXp.textContent = '+' + Math.floor(session.xpEarned) + ' XP';
        this.elements.resultModal.classList.remove('hidden');
        this.elements.skillBar.classList.add('hidden');
    },

    // ================= 暂停 =================

    _onGameStateChange(state) {
        if (state === 'paused') {
            this.elements.pauseModal.classList.remove('hidden');
        } else if (state === 'playing') {
            this.elements.pauseModal.classList.add('hidden');
        }
    },

    // ================= 赛道选择 =================

    openTrackSelect() {
        const save = Storage.load();
        this.elements.trackSelectXp.textContent = save.totalXp;
        this.elements.trackItems.innerHTML = '';

        for (const trackConst of CONSTANTS.TRACKS) {
            const config = CONSTANTS.getTrackConfig(trackConst.level);
            const unlocked = save.unlockedTracks.includes(trackConst.level);
            const isSelected = save.selectedTrack === trackConst.level;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item' + (isSelected ? ' active-item' : '');

            const difficultyDots = Array.from({ length: 8 }, (_, i) => {
                const filled = i < Math.min(trackConst.level, 8);
                return `<div class="difficulty-dot ${filled ? 'filled' : ''}"></div>`;
            }).join('');

            let actionHtml = '';
            if (isSelected) {
                actionHtml = '<span class="equipped-badge">已选</span>';
            } else if (unlocked) {
                actionHtml = `<button class="btn btn-secondary" data-select-track="${trackConst.level}">选择</button>`;
            } else {
                if (save.totalXp >= config.unlockCost) {
                    actionHtml = `<button class="btn btn-primary" data-buy-track="${trackConst.level}">${config.unlockCost} XP 解锁</button>`;
                } else {
                    actionHtml = `<button class="btn btn-secondary" disabled>${config.unlockCost} XP</button>`;
                }
            }

            itemDiv.innerHTML = `
                <div class="shop-item-info" style="flex: 1;">
                    <h3>${config.level} - ${config.name} ${isSelected ? '✓' : ''}</h3>
                    <div class="track-item-difficulty">${difficultyDots}</div>
                    <p>${config.desc}</p>
                </div>
                <div class="shop-item-action">${actionHtml}</div>
            `;
            this.elements.trackItems.appendChild(itemDiv);
        }

        this.elements.trackItems.querySelectorAll('button[data-buy-track]').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.getAttribute('data-buy-track'));
                this._unlockTrack(level);
            });
        });
        this.elements.trackItems.querySelectorAll('button[data-select-track]').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = parseInt(btn.getAttribute('data-select-track'));
                this._selectTrack(level);
            });
        });

        this.elements.trackModal.classList.remove('hidden');
    },

    closeTrackSelect() {
        this.elements.trackModal.classList.add('hidden');
    },

    _unlockTrack(level) {
        const save = Storage.load();
        const config = CONSTANTS.getTrackConfig(level);
        if (save.unlockedTracks.includes(level) || save.totalXp < config.unlockCost) return;
        save.totalXp -= config.unlockCost;
        save.unlockedTracks.push(level);
        save.selectedTrack = level;
        Storage.save(save);
        this._updateMenuStats();
        this.openTrackSelect();
    },

    _selectTrack(level) {
        const save = Storage.load();
        if (!save.unlockedTracks.includes(level)) return;
        save.selectedTrack = level;
        Storage.save(save);
        this._updateMenuStats();
        this.openTrackSelect();
    },

    // ================= 技能选择 =================

    openSkillSelect() {
        const save = Storage.load();
        this.elements.skillItems.innerHTML = '';

        for (const skill of CONSTANTS.SKILLS) {
            const isSelected = save.selectedSkill === skill.id;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item' + (isSelected ? ' active-item' : '');

            itemDiv.innerHTML = `
                <div class="shop-item-info" style="flex: 1;">
                    <h3>${skill.icon} ${skill.name}</h3>
                    <p>${skill.desc}</p>
                    <p style="font-size: 0.75rem; color: #999; margin-top: 4px;">
                        冷却 ${skill.cooldown}s | 持续 ${skill.duration}s | 空格键触发
                    </p>
                </div>
                <div class="shop-item-action">
                    ${isSelected ? '<span class="equipped-badge">已携带</span>' :
                        `<button class="btn btn-secondary" data-select-skill="${skill.id}">携带</button>`}
                </div>
            `;
            this.elements.skillItems.appendChild(itemDiv);
        }

        this.elements.skillItems.querySelectorAll('button[data-select-skill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-select-skill');
                this._selectSkill(id);
            });
        });

        this.elements.skillModal.classList.remove('hidden');
    },

    closeSkillSelect() {
        this.elements.skillModal.classList.add('hidden');
    },

    _selectSkill(id) {
        const save = Storage.load();
        save.selectedSkill = id;
        Storage.save(save);
        this._updateMenuStats();
        this.openSkillSelect();
    },

    // ================= XP 商店 =================

    openShop() {
        const save = Storage.load();
        this.elements.shopXp.textContent = save.totalXp;
        this.elements.tabTrack.classList.toggle('active', this.shopTab === 'track');
        this.elements.tabOutfit.classList.toggle('active', this.shopTab === 'outfit');
        this._renderShopItems(save);
        this.elements.shopModal.classList.remove('hidden');
    },

    _renderShopItems(save) {
        this.elements.shopItems.innerHTML = '';

        if (this.shopTab === 'track') {
            for (const trackConst of CONSTANTS.TRACKS) {
                const config = CONSTANTS.getTrackConfig(trackConst.level);
                const unlocked = save.unlockedTracks.includes(trackConst.level);
                const isSelected = save.selectedTrack === trackConst.level;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'shop-item' + (isSelected ? ' active-item' : '');

                let actionHtml = '';
                if (isSelected) {
                    actionHtml = '<span class="equipped-badge">已选</span>';
                } else if (unlocked) {
                    actionHtml = `<button class="btn btn-secondary" data-select-shop-track="${trackConst.level}">选择</button>`;
                } else {
                    if (save.totalXp >= config.unlockCost) {
                        actionHtml = `<button class="btn btn-primary" data-buy-shop-track="${trackConst.level}">${config.unlockCost} XP 解锁</button>`;
                    } else {
                        actionHtml = `<button class="btn btn-secondary" disabled>${config.unlockCost} XP</button>`;
                    }
                }

                itemDiv.innerHTML = `
                    <div class="shop-item-info" style="flex: 1;">
                        <h3>${config.level} - ${config.name}</h3>
                        <p>${config.desc}</p>
                    </div>
                    <div class="shop-item-action">${actionHtml}</div>
                `;
                this.elements.shopItems.appendChild(itemDiv);
            }

            this.elements.shopItems.querySelectorAll('button[data-buy-shop-track]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const level = parseInt(btn.getAttribute('data-buy-shop-track'));
                    this._unlockTrack(level);
                });
            });
            this.elements.shopItems.querySelectorAll('button[data-select-shop-track]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const level = parseInt(btn.getAttribute('data-select-shop-track'));
                    this._selectTrack(level);
                });
            });

        } else {
            for (const outfit of CONSTANTS.OUTFITS) {
                const owned = save.ownedOutfits.includes(outfit.id);
                const equipped = save.equippedOutfit === outfit.id;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'shop-item' + (equipped ? ' active-item' : '');

                const iconCanvas = document.createElement('canvas');
                iconCanvas.className = 'shop-item-icon';
                iconCanvas.width = 60;
                iconCanvas.height = 70;
                const ictx = iconCanvas.getContext('2d');
                const p = new Player(0, 0, outfit.id);
                p.drawPreview(ictx, 30, 48, 0.7);

                let actionHtml = '';
                if (equipped) {
                    actionHtml = '<span class="equipped-badge">已装备</span>';
                } else if (owned) {
                    actionHtml = `<button class="btn btn-secondary" data-equip="${outfit.id}">装备</button>`;
                } else {
                    if (save.totalXp >= outfit.price) {
                        actionHtml = `<button class="btn btn-primary" data-buy="${outfit.id}">${outfit.price} XP</button>`;
                    } else {
                        actionHtml = `<button class="btn btn-secondary" disabled>${outfit.price} XP</button>`;
                    }
                }

                itemDiv.innerHTML = `
                    ${iconCanvas.outerHTML}
                    <div class="shop-item-info">
                        <h3>${outfit.name}</h3>
                        <p>${outfit.desc}</p>
                    </div>
                    <div class="shop-item-action">${actionHtml}</div>
                `;
                this.elements.shopItems.appendChild(itemDiv);
            }

            this.elements.shopItems.querySelectorAll('button[data-buy]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-buy');
                    this._buyOutfit(id);
                });
            });
            this.elements.shopItems.querySelectorAll('button[data-equip]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-equip');
                    this._equipOutfit(id);
                });
            });
        }
    },

    closeShop() {
        this.elements.shopModal.classList.add('hidden');
    },

    _buyOutfit(id) {
        const save = Storage.load();
        const outfit = CONSTANTS.OUTFITS.find(o => o.id === id);
        if (!outfit || save.ownedOutfits.includes(id) || save.totalXp < outfit.price) return;
        save.totalXp -= outfit.price;
        save.ownedOutfits.push(id);
        save.equippedOutfit = id;
        Storage.save(save);
        this.openShop();
        this._updateMenuStats();
        this._drawPreviewCharacter();
    },

    _equipOutfit(id) {
        const save = Storage.load();
        if (!save.ownedOutfits.includes(id)) return;
        save.equippedOutfit = id;
        Storage.save(save);
        this.openShop();
        this._updateMenuStats();
        this._drawPreviewCharacter();
    },

    // ================= 帮助 =================

    openHelp() {
        this.elements.helpModal.classList.remove('hidden');
    },

    closeHelp() {
        this.elements.helpModal.classList.add('hidden');
    },

    // ================= 按钮绑定 =================

    _bindButtons() {
        this.elements.btnPlay.addEventListener('click', () => {
            const save = Storage.load();
            this.showGame();
            this.game.start(save.equippedOutfit, save.selectedTrack, save.selectedSkill);
        });

        this.elements.btnChangeTrack.addEventListener('click', () => this.openTrackSelect());
        this.elements.btnChangeSkill.addEventListener('click', () => this.openSkillSelect());

        this.elements.btnShop.addEventListener('click', () => this.openShop());
        this.elements.btnHelp.addEventListener('click', () => this.openHelp());

        this.elements.btnRestart.addEventListener('click', () => {
            this.elements.resultModal.classList.add('hidden');
            const save = Storage.load();
            this.game.start(save.equippedOutfit, save.selectedTrack, save.selectedSkill);
        });

        this.elements.btnMenu.addEventListener('click', () => {
            this.elements.resultModal.classList.add('hidden');
            this.showMenu();
        });

        this.elements.btnResume.addEventListener('click', () => {
            this.game.togglePause();
        });

        this.elements.btnPauseMenu.addEventListener('click', () => {
            this.game.state = 'menu';
            this.elements.pauseModal.classList.add('hidden');
            this.showMenu();
        });

        this.elements.btnEndRun.addEventListener('click', () => {
            this.game.forceEnd();
            this.elements.pauseModal.classList.add('hidden');
        });

        // 技能按钮
        this.elements.skillBtn.addEventListener('click', () => {
            this.game.triggerSkill();
        });
        this.elements.btnMobileSkill.addEventListener('click', () => {
            this.game.triggerSkill();
        });
        this.elements.btnMobileSkill.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.triggerSkill();
        });

        this.elements.tabTrack.addEventListener('click', () => {
            this.shopTab = 'track';
            this.openShop();
        });

        this.elements.tabOutfit.addEventListener('click', () => {
            this.shopTab = 'outfit';
            this.openShop();
        });

        this.elements.btnCloseShop.addEventListener('click', () => this.closeShop());
        this.elements.btnCloseTrack.addEventListener('click', () => this.closeTrackSelect());
        this.elements.btnCloseSkill.addEventListener('click', () => this.closeSkillSelect());
        this.elements.btnCloseHelp.addEventListener('click', () => this.closeHelp());
    },
};
