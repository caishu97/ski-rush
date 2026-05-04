/**
 * 游戏入口
 */

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    UI.init(game);

    // 如果首次访问，自动初始化存档
    const save = Storage.load();
    Storage.save(save);
});
