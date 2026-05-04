/**
 * 本地存档管理
 * v3: 增加技能小人选择存档
 */

const Storage = (function () {
    const KEY = "ski_rush_save_v3";

    const defaultData = {
        totalXp: 0,              // 生涯总经验（累计 XP）
        unlockedTracks: [1],     // 已解锁的赛道等级列表
        selectedTrack: 1,        // 当前选择的赛道
        ownedOutfits: ["default"], // 已拥有的滑雪服
        equippedOutfit: "default", // 当前装备
        selectedSkill: "invincible", // 当前携带的技能小人
        firstPlay: true,
    };

    function migrate() {
        for (const oldKey of ["ski_rush_save_v2", "ski_rush_save_v1"]) {
            try {
                const raw = localStorage.getItem(oldKey);
                if (raw) {
                    const data = JSON.parse(raw);
                    const migrated = {
                        ...defaultData,
                        totalXp: data.totalXp || 0,
                        unlockedTracks: data.unlockedTracks || [1],
                        selectedTrack: data.selectedTrack || 1,
                        ownedOutfits: data.ownedOutfits || ["default"],
                        equippedOutfit: data.equippedOutfit || "default",
                    };
                    if (oldKey === "ski_rush_save_v1") {
                        if (data.totalXp >= 400) migrated.unlockedTracks.push(5);
                        if (data.totalXp >= 300) migrated.unlockedTracks.push(4);
                        if (data.totalXp >= 200) migrated.unlockedTracks.push(3);
                        if (data.totalXp >= 100) migrated.unlockedTracks.push(2);
                    }
                    localStorage.setItem(KEY, JSON.stringify(migrated));
                    localStorage.removeItem(oldKey);
                    return migrated;
                }
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) return { ...defaultData, ...JSON.parse(raw) };
        } catch (e) {
            const migrated = migrate();
            if (migrated) return migrated;
        }
        return { ...defaultData };
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("存档保存失败", e);
        }
    }

    function reset() {
        localStorage.removeItem(KEY);
        localStorage.removeItem("ski_rush_save_v2");
        localStorage.removeItem("ski_rush_save_v1");
    }

    return { load, save, reset };
})();
