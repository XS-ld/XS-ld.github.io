// 用户界面交互管理
class GameUI {
    constructor() {
        this.game = window.Game;
        this.initEventListeners();
        this.initTheme();
        this.initLanguage();
    }
    
    // 初始化事件监听
    initEventListeners() {
        // 新游戏按钮
        document.getElementById('newGameBtn')?.addEventListener('click', () => {
            this.game.loadLevel(0);
            this.closeModal();
        });
        
        // 重新开始按钮
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.game.loadLevel(this.game.currentLevel);
            this.closeModal();
        });
        
        // 提示按钮
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            this.game.giveHint();
        });
        
        // 撤销按钮
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            this.game.undo();
        });
        
        // 下一关按钮
        document.getElementById('nextLevelBtn')?.addEventListener('click', () => {
            if (this.game.currentLevel < GameConfig.levels.length - 1) {
                this.game.loadLevel(this.game.currentLevel + 1);
                this.closeModal();
            }
        });
        
        // 重试按钮
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.game.loadLevel(this.game.currentLevel);
            this.closeModal();
        });
        
        // 游戏规则切换
        document.getElementById('rulesToggle')?.addEventListener('click', () => {
            const rulesContent = document.getElementById('rulesContent');
            rulesContent.classList.toggle('show');
        });
        
        // 点击模态框外部关闭
        document.getElementById('resultModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }
    
    // 初始化主题
    initTheme() {
        const themeBtn = document.getElementById('themeBtn');
        const themeIcon = themeBtn.querySelector('i');
        
        // 检查本地存储的主题
        const savedTheme = localStorage.getItem('game-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme, themeIcon);
        
        // 主题切换
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('game-theme', newTheme);
            this.updateThemeIcon(newTheme, themeIcon);
        });
    }
    
    // 更新主题图标
    updateThemeIcon(theme, iconElement) {
        if (theme === 'light') {
            iconElement.className = 'fas fa-sun';
            iconElement.style.color = '#f6ad55';
        } else {
            iconElement.className = 'fas fa-moon';
            iconElement.style.color = '#a0aec0';
        }
    }
    
    // 初始化语言
    initLanguage() {
        const languageSelect = document.getElementById('languageSelect');
        
        // 检查本地存储的语言
        const savedLanguage = localStorage.getItem('game-language') || 'zh-CN';
        languageSelect.value = savedLanguage;
        this.updateLanguage(savedLanguage);
        
        // 语言切换
        languageSelect.addEventListener('change', (e) => {
            const newLanguage = e.target.value;
            localStorage.setItem('game-language', newLanguage);
            this.updateLanguage(newLanguage);
        });
    }
    
    // 更新语言
    updateLanguage(language) {
        // 获取对应语言的文本
        const translations = GameConfig.translations[language] || GameConfig.translations['zh-CN'];
        
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
        
        // 更新游戏状态消息
        if (this.game) {
            const statusElement = document.getElementById('statusMessage');
            if (statusElement && statusElement.textContent) {
                const currentText = statusElement.textContent;
                const reverseTranslations = {};
                
                // 创建反向翻译映射（找到当前文本对应的key）
                Object.entries(GameConfig.translations['zh-CN']).forEach(([key, value]) => {
                    if (value === currentText) {
                        this.game.updateStatusMessage(key);
                        return;
                    }
                });
            }
        }
    }
    
    // 关闭模态框
    closeModal() {
        document.getElementById('resultModal').classList.remove('show');
    }
    
    // 显示加载状态
    showLoading() {
        // 可以添加加载动画
        console.log('游戏加载中...');
    }
    
    // 隐藏加载状态
    hideLoading() {
        console.log('游戏加载完成');
    }
}

// 初始化UI
document.addEventListener('DOMContentLoaded', () => {
    window.GameUI = new GameUI();
    
    // 显示加载完成消息
    console.log('🐑 羊了个羊游戏已加载完成！');
    console.log('🎮 游戏功能：');
    console.log('   • 三消玩法');
    console.log('   • 深色/浅色模式');
    console.log('   • 多语言支持');
    console.log('   • 撤销功能');
    console.log('   • 提示系统');
    console.log('   • 关卡进度');
    console.log('🌐 访问地址：https://xs-ld.github.io');
});