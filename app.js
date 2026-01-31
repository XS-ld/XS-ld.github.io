// 主应用程序
class AdRewardApp {
    constructor() {
        this.init();
    }
    
    async init() {
        try {
            // 初始化数据库
            await DatabaseService.initDatabase();
            
            // 初始化默认数据
            await DatabaseService.initDefaultData();
            
            // 初始化事件监听
            this.initEventListeners();
            
            // 检查用户登录状态
            this.checkAuthStatus();
            
            // 开始实时更新
            this.startRealTimeUpdates();
            
            console.log('应用程序初始化完成');
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }
    
    // 检查认证状态
    checkAuthStatus() {
        if (window.userSystem.isLoggedIn) {
            this.showMainInterface();
            this.loadUserData();
        } else {
            this.showAuthModal();
        }
    }
    
    // 显示认证弹窗
    showAuthModal() {
        document.getElementById('auth-modal').style.display = 'flex';
        document.getElementById('main-container').style.display = 'none';
    }
    
    // 显示主界面
    showMainInterface() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
    }
    
    // 初始化事件监听
    initEventListeners() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // 登录按钮
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });
        
        // 注册按钮
        document.getElementById('register-btn').addEventListener('click', () => {
            this.handleRegister();
        });
        
        // 退出按钮
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // 管理员登录
        document.getElementById('admin-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminLoginModal();
        });
        
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            this.handleAdminLogin();
        });
        
        // 关闭按钮
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // 广告开始按钮
        document.getElementById('start-ad-btn').addEventListener('click', () => {
            adSystem.onAdClick();
        });
        
        // 广告完成按钮
        document.getElementById('complete-ad-btn').addEventListener('click', async () => {
            const result = await adSystem.onAdCompleted();
            if (result.success) {
                // 重新加载用户数据
                await this.loadUserData();
                // 重新加载广告列表
                await this.loadAds();
                // 重新加载历史记录
                await this.loadHistory();
                // 关闭广告弹窗
                this.closeAllModals();
            } else {
                this.showError(result.message);
            }
        });
        
        // 广告取消按钮
        document.getElementById('cancel-ad-btn').addEventListener('click', () => {
            adSystem.cancelAdView();
            this.closeAllModals();
        });
        
        // 数据更新事件监听
        document.addEventListener('dataUpdated', () => {
            this.loadUserData();
        });
        
        // 监听表单提交（按Enter键）
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (document.getElementById('login-tab').classList.contains('active')) {
                        this.handleLogin();
                    } else if (document.getElementById('register-tab').classList.contains('active')) {
                        this.handleRegister();
                    }
                }
            });
        });
    }
    
    // 切换标签页
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            }
        });
    }
    
    // 处理用户登录
    async handleLogin() {
        const phone = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!phone || !password) {
            this.showError('请输入手机号和密码');
            return;
        }
        
        const result = await window.userSystem.login(phone, password);
        
        if (result.success) {
            this.showMainInterface();
            await this.loadUserData();
            await this.loadAds();
            await this.loadHistory();
            this.showSuccess('登录成功！');
        } else {
            this.showError(result.message);
        }
    }
    
    // 处理用户注册
    async handleRegister() {
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const nickname = document.getElementById('register-nickname').value.trim();
        
        if (!phone || !password || !nickname) {
            this.showError('请填写所有必填项');
            return;
        }
        
        const result = await window.userSystem.register({
            phone,
            password,
            nickname
        });
        
        if (result.success) {
            // 注册后自动登录
            const loginResult = await window.userSystem.login(phone, password);
            if (loginResult.success) {
                this.showMainInterface();
                await this.loadUserData();
                await this.loadAds();
                await this.loadHistory();
                this.showSuccess('注册成功！欢迎使用广告红包平台');
            }
        } else {
            this.showError(result.message);
        }
    }
    
    // 处理用户退出
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            window.userSystem.logout();
            this.showAuthModal();
            this.clearFormData();
            this.showSuccess('已成功退出登录');
        }
    }
    
    // 显示管理员登录弹窗
    showAdminLoginModal() {
        document.getElementById('admin-auth-modal').style.display = 'flex';
    }
    
    // 处理管理员登录
    async handleAdminLogin() {
        const account = document.getElementById('admin-account').value.trim();
        const password = document.getElementById('admin-password').value.trim();
        
        if (!account || !password) {
            this.showError('请输入管理员账号和密码');
            return;
        }
        
        try {
            // 验证管理员账号
            const admin = await DatabaseService.adminDB.getByIndex('username', account);
            
            if (!admin || admin.password !== password) {
                this.showError('管理员账号或密码错误');
                return;
            }
            
            // 更新最后登录时间
            await DatabaseService.adminDB.update(admin.id, {
                lastLogin: new Date().toISOString()
            });
            
            // 保存登录状态
            localStorage.setItem('adminLoggedIn', 'true');
            
            // 跳转到管理后台
            window.location.href = 'admin.html';
            
        } catch (error) {
            console.error('管理员登录失败:', error);
            this.showError('登录失败，请稍后重试');
        }
    }
    
    // 加载用户数据
    async loadUserData() {
        if (!window.userSystem.isLoggedIn) return;
        
        const user = window.userSystem.currentUser;
        const stats = await window.userSystem.getUserStats(user.id);
        
        if (stats) {
            // 更新用户信息显示
            document.getElementById('user-nickname').textContent = user.username;
            document.getElementById('user-balance').textContent = stats.balance.toFixed(2);
            
            // 更新统计数据
            document.getElementById('today-income').textContent = stats.todayEarnings.toFixed(2);
            document.getElementById('total-income').textContent = stats.totalEarnings.toFixed(2);
            document.getElementById('ads-count').textContent = stats.todayViews;
            document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        }
    }
    
    // 加载广告列表
    async loadAds() {
        if (!window.userSystem.isLoggedIn) return;
        
        const userId = window.userSystem.currentUser.id;
        const ads = await adSystem.getActiveAds();
        const adsGrid = document.getElementById('ads-grid');
        
        if (!adsGrid) return;
        
        adsGrid.innerHTML = '';
        
        for (const ad of ads) {
            const hasViewed = await adSystem.hasUserViewedAd(userId, ad.id);
            
            const adElement = document.createElement('div');
            adElement.className = `ad-item ${hasViewed ? 'watched' : ''}`;
            adElement.innerHTML = `
                <div class="ad-header">
                    <div class="ad-title">${ad.title}</div>
                    <div class="ad-reward">${ad.reward.toFixed(2)}元</div>
                </div>
                <div class="ad-duration">时长: ${ad.duration}秒</div>
                <div class="ad-description">${ad.description}</div>
            `;
            
            if (!hasViewed) {
                adElement.addEventListener('click', () => {
                    this.startAdView(ad.id);
                });
            }
            
            adsGrid.appendChild(adElement);
        }
        
        if (ads.length === 0) {
            adsGrid.innerHTML = '<div class="no-ads">暂无可用广告，请稍后再来</div>';
        }
    }
    
    // 开始观看广告
    async startAdView(adId) {
        if (!window.userSystem.isLoggedIn) return;
        
        const userId = window.userSystem.currentUser.id;
        const result = await adSystem.startAdView(adId, userId);
        
        if (result.success) {
            // 初始化广告容器
            adSystem.initAdContainer('ad-container');
            
            // 显示广告弹窗
            document.getElementById('ad-modal').style.display = 'flex';
        } else {
            this.showError(result.message);
        }
    }
    
    // 加载观看历史
    async loadHistory() {
        if (!window.userSystem.isLoggedIn) return;
        
        const userId = window.userSystem.currentUser.id;
        const records = await window.userSystem.getUserViewRecords(userId, 10);
        const historyList = document.getElementById('history-list');
        
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (records.length === 0) {
            historyList.innerHTML = '<div class="no-history">暂无观看记录</div>';
            return;
        }
        
        for (const record of records) {
            // 获取广告信息
            const ad = await adSystem.getAd(record.adId);
            if (!ad) continue;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const time = new Date(record.viewedAt);
            const timeStr = time.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-ad-name">${ad.title}</div>
                    <div class="history-time">${timeStr}</div>
                </div>
                <div class="history-reward ${record.completed ? '' : 'failed'}">
                    ${record.completed ? `+${ad.reward.toFixed(2)}元` : '未完成'}
                </div>
            `;
            
            historyList.appendChild(historyItem);
        }
    }
    
    // 开始实时更新
    startRealTimeUpdates() {
        // 每30秒更新一次数据
        setInterval(async () => {
            if (window.userSystem.isLoggedIn) {
                await this.loadUserData();
            }
        }, 30000);
        
        // 每5分钟更新一次广告列表
        setInterval(async () => {
            if (window.userSystem.isLoggedIn) {
                await this.loadAds();
            }
        }, 300000);
    }
    
    // 关闭所有弹窗
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // 清空表单数据
    clearFormData() {
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-phone').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-nickname').value = '';
        document.getElementById('admin-account').value = '';
        document.getElementById('admin-password').value = '';
    }
    
    // 显示成功消息
    showSuccess(message) {
        alert(message);
    }
    
    // 显示错误消息
    showError(message) {
        alert('错误: ' + message);
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AdRewardApp();
});