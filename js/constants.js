/**
 * 游戏常量配置
 */

const CONSTANTS = {
    // canvas
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 1200,

    // 物理参数
    BASE_SPEED: 150,
    MAX_SPEED: 600,
    BOOST_SPEED: 450,
    ACCELERATION: 400,
    FRICTION: 200,
    TURN_SPEED: 280,
    TURN_ACCEL: 800,
    OFFROAD_FRICTION_MULT: 3.0,
    CRASH_STUN_DURATION: 0.5,

    // 经验相关
    XP_PER_KM: 1,
    OFFROAD_XP_PENALTY_CD: 10,

    // 障碍尺寸
    TREE_WIDTH: 40,
    TREE_HEIGHT: 50,
    ROCK_WIDTH: 30,
    ROCK_HEIGHT: 24,

    // 滑雪服 — 用 XP 购买
    OUTFITS: [
        { id: "default", name: "新手滑雪服", bonus: 1.0,  price: 0,    colorBody: "#e74c3c", colorScarf: "#f1c40f", desc: "普通滑雪服，无加成" },
        { id: "pro",     name: "专业滑雪服", bonus: 1.3,  price: 100,  colorBody: "#3498db", colorScarf: "#fff",     desc: "+30% 经验加成" },
        { id: "champ",   name: "冠军滑雪服", bonus: 1.6,  price: 300,  colorBody: "#9b59b6", colorScarf: "#f39c12",  desc: "+60% 经验加成" },
        { id: "legend",  name: "传说滑雪服", bonus: 2.0,  price: 800,  colorBody: "#1abc9c", colorScarf: "#f39c12",  desc: "+100% 经验加成" },
        { id: "myth",    name: "神话滑雪服", bonus: 2.5,  price: 1500, colorBody: "#e91e63", colorScarf: "#00e5ff",  desc: "+150% 经验加成" },
        { id: "star",    name: "星空滑雪服", bonus: 3.0,  price: 3000, colorBody: "#3f51b5", colorScarf: "#ffeb3b",  desc: "+200% 经验加成" },
        { id: "eternal", name: "永恒滑雪服", bonus: 4.0,  price: 6000, colorBody: "#212121", colorScarf: "#ff5722",  desc: "+300% 经验加成" },
        { id: "panda",   name: "熊猫滑雪服", bonus: 5.0,  price: 12000, colorBody: "#000000", colorScarf: "#4caf50",  desc: "+400% 经验加成" },
        { id: "dragon",  name: "神龙滑雪服", bonus: 6.0,  price: 25000, colorBody: "#d32f2f", colorScarf: "#ffd700",  desc: "+500% 经验加成" },
        { id: "nebula",  name: "星云滑雪服", bonus: 8.0,  price: 50000, colorBody: "#4a148c", colorScarf: "#00bcd4",  desc: "+700% 经验加成" },
        { id: "void",    name: "虚空滑雪服", bonus: 12.0, price: 99999, colorBody: "#0d0042", colorScarf: "#e040fb",  desc: "+1100% 经验加成" },
    ],

    // 技能小人（4个基础免费 + 4个高级抽卡限定，每局选择1个携带上场，统一按空格触发）
    SKILLS: [
        {
            id: "invincible",
            name: "无畏冲刺",
            icon: "🔴",
            color: "#e74c3c",
            cooldown: 10,
            duration: 3,
            desc: "3秒无敌冲刺（免疫碰撞+速度提升）",
            free: true,
        },
        {
            id: "freeze",
            name: "急冻术",
            icon: "🔵",
            color: "#3498db",
            cooldown: 10,
            duration: 5,
            desc: "冻结移动障碍5秒，免疫冰面减速",
            free: true,
        },
        {
            id: "ghost",
            name: "幽灵形态",
            icon: "🟢",
            color: "#2ecc71",
            cooldown: 10,
            duration: 5,
            desc: "碰撞体积减半，持续5秒",
            free: true,
        },
        {
            id: "doublexp",
            name: "经验加速",
            icon: "🟡",
            color: "#f1c40f",
            cooldown: 10,
            duration: 8,
            desc: "XP获取翻倍，持续8秒",
            free: true,
        },
        {
            id: "fire_rush",
            name: "烈焰冲刺",
            icon: "🔥",
            color: "#e65100",
            cooldown: 8,
            duration: 4,
            desc: "4秒烈焰无敌，自动满速冲刺",
            free: false,
        },
        {
            id: "time_stop",
            name: "时间凝滞",
            icon: "⏱️",
            color: "#7c4dff",
            cooldown: 12,
            duration: 5,
            desc: "凝滞时间5秒，所有障碍静止",
            free: false,
        },
        {
            id: "shadow",
            name: "暗影形态",
            icon: "👤",
            color: "#424242",
            cooldown: 10,
            duration: 6,
            desc: "完全无视碰撞6秒，如入无人之境",
            free: false,
        },
        {
            id: "gold_rush",
            name: "淘金热",
            icon: "💰",
            color: "#ffd700",
            cooldown: 12,
            duration: 10,
            desc: "XP获取3倍，持续10秒",
            free: false,
        },
    ],

    // 抽卡卡包配置
    CARD_PACKS: [
        {
            id: "common",
            name: "普通卡包",
            icon: "🥉",
            price: 50,
            desc: "有机会获得技能卡或经验值",
            color: "#cd7f32",
            xpMin: 20,
            xpMax: 80,
            xpRate: 0.60,
            skillRate: 0.40,
            skillWeights: [5, 5, 5, 5, 1, 1, 1, 1], // 对应 SKILLS 的权重
            duplicateXp: 40,
        },
        {
            id: "rare",
            name: "稀有卡包",
            icon: "🥈",
            price: 150,
            desc: "更高概率获得高级技能卡",
            color: "#c0c0c0",
            xpMin: 80,
            xpMax: 200,
            xpRate: 0.35,
            skillRate: 0.65,
            skillWeights: [3, 3, 3, 3, 2, 2, 2, 2],
            duplicateXp: 100,
        },
        {
            id: "legendary",
            name: "传说卡包",
            icon: "🥇",
            price: 400,
            desc: "大概率获得高级技能卡或大量经验",
            color: "#ffd700",
            xpMin: 200,
            xpMax: 500,
            xpRate: 0.20,
            skillRate: 0.80,
            skillWeights: [1, 1, 1, 1, 3, 3, 3, 3],
            duplicateXp: 250,
        },
    ],

    // 赛道 XP 定价
    TRACKS: [
        { level: 1, name: "新手雪道",   unlockCost: 0,   desc: "最宽的雪道，障碍稀少，适合入门" },
        { level: 2, name: "初级雪道",   unlockCost: 100, desc: "宽度略减，树木开始增多" },
        { level: 3, name: "中级雪道",   unlockCost: 250, desc: "出现少量移动障碍" },
        { level: 4, name: "高级雪道",   unlockCost: 450, desc: "冰面地带加入，操控更困难" },
        { level: 5, name: "极限雪道",   unlockCost: 700, desc: "大量移动障碍 + 冰面，难度陡升" },
        { level: 6, name: "地狱雪道",   unlockCost: 1000, desc: "移动障碍速度加快，冰面密集" },
        { level: 7, name: "传说雪道",   unlockCost: 1400, desc: "几乎全是移动障碍，极限反应" },
        { level: 8, name: "神话雪道",   unlockCost: 2000, desc: "最窄雪道，地狱般的速度" },
    ],

    // 视野与生成
    SPAWN_DISTANCE: 900,
    DESPAWN_DISTANCE: 200,
    OBSTACLE_MIN_GAP: 70,
};

/**
 * 动态生成赛道配置
 */
CONSTANTS.getTrackConfig = function(level) {
    const colors = ["#f0f8ff", "#e8f6f3", "#eafaf1", "#d5f5e3", "#abebc6", "#d4e6f1", "#e8daef", "#fadbd8"];
    const colorIndex = (level - 1) % colors.length;

    let width;
    if (level <= 5) {
        width = Math.max(300, 500 - (level - 1) * 40);
    } else {
        width = Math.max(220, 320 - (level - 5) * 20);
    }

    let obstacleCount, movingRatio, iceChance, movingSpeed;

    if (level <= 5) {
        obstacleCount = 0.003 + (level - 1) * 0.002;
        movingRatio = level >= 3 ? (level - 2) * 0.15 : 0;
        iceChance = level >= 4 ? (level - 3) * 0.004 : 0;
        movingSpeed = 30 + (level - 1) * 8;
    } else {
        obstacleCount = 0.010 - (level - 5) * 0.0005;
        obstacleCount = Math.max(0.007, obstacleCount);
        movingRatio = 0.50 + (level - 5) * 0.08;
        movingRatio = Math.min(movingRatio, 0.95);
        iceChance = 0.008 + (level - 5) * 0.003;
        movingSpeed = 65 + (level - 5) * 12;
    }

    const trackInfo = CONSTANTS.TRACKS[level - 1] || {
        level, name: `赛道 ${level}`, unlockCost: 9999, desc: "未知"
    };

    return {
        level,
        name: trackInfo.name,
        unlockCost: trackInfo.unlockCost,
        desc: trackInfo.desc,
        width,
        obstacleCount,
        movingObstacles: movingRatio > 0,
        movingRatio,
        icePatches: iceChance > 0,
        iceChance,
        color: colors[colorIndex],
        treeColor: "#196f3d",
        movingSpeed,
    };
};
