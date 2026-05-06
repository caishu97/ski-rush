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

    // 传奇滑手 — 用 XP 解锁
    OUTFITS: [
        { id: "default", name: "自由滑手", bonus: 1.0,  price: 0,    colorBody: "#e74c3c", colorScarf: "#f1c40f", desc: "普通滑雪者，无加成" },
        { id: "eileen_gu", name: "谷爱凌", bonus: 1.3,  price: 100,  colorBody: "#e91e63", colorScarf: "#ffd700", desc: "中国自由式滑雪天才，+30% 经验" },
        { id: "su_yiming", name: "苏翊鸣", bonus: 1.6,  price: 300,  colorBody: "#1a237e", colorScarf: "#ff5722", desc: "中国单板大跳台奥运冠军，+60% 经验" },
        { id: "hermann",   name: "Hermann Maier", bonus: 2.0,  price: 800,  colorBody: "#d32f2f", colorScarf: "#fff",     desc: "奥地利速降传奇"Herminator"，+100% 经验" },
        { id: "lindsey",   name: "Lindsey Vonn", bonus: 2.5,  price: 1500, colorBody: "#1976d2", colorScarf: "#ff9800", desc: "美国女子速降女王，+150% 经验" },
        { id: "hirscher",  name: "Marcel Hirscher", bonus: 3.0,  price: 3000, colorBody: "#7b1fa2", colorScarf: "#ffeb3b", desc: "奥地利全能王，8届世界杯总冠军，+200% 经验" },
        { id: "shiffrin",  name: "Mikaela Shiffrin", bonus: 4.0,  price: 6000, colorBody: "#f57c00", colorScarf: "#00bcd4", desc: "美国回转女王，史上最多世界杯胜场，+300% 经验" },
        { id: "tomba",     name: "Alberto Tomba", bonus: 5.0,  price: 12000, colorBody: "#00695c", colorScarf: "#fff",     desc: "意大利回转之王"La Bomba"，+400% 经验" },
        { id: "stenmark",  name: "Ingemar Stenmark", bonus: 6.0,  price: 25000, colorBody: "#fdd835", colorScarf: "#004d40", desc: "瑞典回转传奇，86个世界杯冠军，+500% 经验" },
        { id: "killy",     name: "Jean-Claude Killy", bonus: 8.0,  price: 50000, colorBody: "#1565c0", colorScarf: "#e040fb", desc: "法国三金王，1968冬奥会传奇，+700% 经验" },
        { id: "bode",      name: "Bode Miller", bonus: 12.0, price: 99999, colorBody: "#212121", colorScarf: "#f44336", desc: "美国天才滑手，最狂野的速降风格，+1100% 经验" },
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
        { level: 1, name: "亚布力滑雪场",   unlockCost: 0,    desc: "中国最老牌滑雪场，雪道宽阔，适合入门" },
        { level: 2, name: "云顶滑雪公园",   unlockCost: 100,  desc: "冬奥会场地，雪质优异，树木开始增多" },
        { level: 3, name: "二世谷 Niseko",  unlockCost: 250,  desc: "日本粉雪天堂，出现少量移动障碍" },
        { level: 4, name: "采尔马特 Zermatt", unlockCost: 450, desc: "瑞士马特洪峰下，冰面地带加入，操控更困难" },
        { level: 5, name: "阿斯彭 Aspen",   unlockCost: 700,  desc: "美国顶级滑雪胜地，大量移动障碍 + 冰面" },
        { level: 6, name: "霞慕尼 Chamonix", unlockCost: 1000, desc: "法国阿尔卑斯腹地，欧洲极限运动发源地" },
        { level: 7, name: "基茨比厄尔 Streif", unlockCost: 1400, desc: "奥地利传奇速降赛道，最陡峭危险的赛道" },
        { level: 8, name: "哈嫩卡姆 Streif",  unlockCost: 2000, desc: " Hahnenkamm 速降之王，滑雪界终极挑战" },
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
