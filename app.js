// 主应用程序
class AdRewardApp {
    constructor() {
        this.currentAdId = null;
        this.init();
    }
    
    async init() {
        try {
            console.log('开始初始化应用程序...');
            
            // 初始化数据库
            await DatabaseService.initDatabase();
            
            // 初始化默认数据
            await DatabaseService.initDefaultData();
            
            // 检查用户登录状态
            this.checkAuthStatus();
            
            // 初始化事件监听
            this.initEventListeners();
            
            console.log('应用程序初始化完成');
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }
    
    // 检查认证状态
    checkAuthStatus() {
        if (window.userSystem && window.userSystem.isLoggedIn) {
            console.log('用户已登录，显示主界面');
            this.showMainInterface();
            this.loadUserData();
            this.loadAds();
            this.loadHistory();
        } else {
            console.log('用户未登录，显示登录弹窗');
            this.showAuthModal();
        }
    }
    
    // 显示认证弹窗
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'flex';
        
        // 显示登录表单
        this.showLoginForm();
    }
    
    // 隐藏认证弹窗
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
    }
    
    // 显示主界面
    showMainInterface() {
        this.hideAuthModal();
        
        // 显示用户信息
        const userSection = document.getElementById('user-section');
        const statsSection = document.getElementById('stats-section');
        const historySection = document.getElementById('history-section');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userSection) userSection.style.display = 'block';
        if (statsSection) statsSection.style.display = 'grid';
        if (historySection) historySection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
    }
    
    // 显示登录表单
    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
        const registerTab = document.querySelector('.tab-btn[data-tab="register"]');
        
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
    }
    
    // 显示注册表单
    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
        const registerTab = document.querySelector('.tab-btn[data-tab="register"]');
        
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
    }
    
    // 初始化事件监听
    initEventListeners() {
        console.log('初始化事件监听...');
        
        // 登录标签页切换
        const loginTabBtn = document.getElementById('login-tab-btn');
        const registerTabBtn = document.getElementById('register-tab-btn');
        
        if (loginTabBtn) {
            loginTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
        
        if (registerTabBtn) {
            registerTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }
        
        // 登录按钮
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }
        
        // 注册按钮
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.handleRegister();
            });
        }
        
        // 退出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // 个人中心登录按钮
        const profileLoginBtn = document.getElementById('profile-login-btn');
        if (profileLoginBtn) {
            profileLoginBtn.addEventListener('click', () => {
                this.showAuthModal();
            });
        }
        
        // 收益页面登录按钮
        const earningsLoginBtn = document.getElementById('earnings-login-btn');
        if (earningsLoginBtn) {
            earningsLoginBtn.addEventListener('click', () => {
                this.showAuthModal();
            });
        }
        
        console.log('事件监听初始化完成');
    }
    
    // 处理用户登录
    async handleLogin() {
        const phone = document.getElementById('login-phone') ? document.getElementById('login-phone').value.trim() : '';
        const password = document.getElementById('login-password') ? document.getElementById('login-password').value.trim() : '';
        
        if (!phone) {
            this.showError('请输入手机号');
            return;
        }
        
        if (!password) {
            this.showError('请输入密码');
            return;
        }
        
        console.log('尝试登录:', phone);
        
        try {
            if (!window.userSystem) {
                this.showError('用户系统未初始化');
                return;
            }
            
            const result = await window.userSystem.login(phone, password);
            
            if (result.success) {
                this.showSuccess('登录成功！');
                this.showMainInterface();
                await this.loadUserData();
                await this.loadAds();
                await this.loadHistory();
                this.hideAuthModal();
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            console.error('登录过程出错:', error);
            this.showError('登录失败，请稍后重试');
        }
    }
    
    // 处理用户注册
    async handleRegister() {
        const phone = document.getElementById('register-phone') ? document.getElementById('register-phone').value.trim() : '';
        const password = document.getElementById('register-password') ? document.getElementById('register-password').value.trim() : '';
        const nickname = document.getElementById('register-nickname') ? document.getElementById('register-nickname').value.trim() : '';
        
        if (!phone || !password || !nickname) {
            this.showError('请填写所有必填项');
            return;
        }
        
        console.log('尝试注册:', phone, nickname);
        
        try {
            if (!window.userSystem) {
                this.showError('用户系统未初始化');
                return;
            }
            
            const result = await window.userSystem.register({
                phone,
                password,
                nickname
            });
            
            if (result.success) {
                this.showSuccess('注册成功！');
                // 注册后自动登录
                const loginResult = await window.userSystem.login(phone, password);
                if (loginResult.success) {
                    this.showSuccess('自动登录成功！');
                    this.showMainInterface();
                    await this.loadUserData();
                    await this.loadAds();
                    await this.loadHistory();
                    this.hideAuthModal();
                }
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            console.error('注册过程出错:', error);
            this.showError('注册失败，请稍后重试');
        }
    }
    
    // 处理用户退出
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            if (window.userSystem) {
                window.userSystem.logout();
            }
            
            // 清空显示数据
            this.clearUserData();
            this.clearAds();
            this.clearHistory();
            
            // 显示登录弹窗
            this.showAuthModal();
            
            this.showSuccess('已成功退出登录');
        }
    }
    
    // 清空用户数据显示
    clearUserData() {
        const elements = {
            'user-nickname': '游客',
            'user-id': '未登录',
            'user-balance': '¥0.00',
            'today-income': '¥0.00',
            'ads-count': '0',
            'total-income': '¥0.00',
            'success-rate': '0%'
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
        
        // 隐藏用户信息部分
        const userSection = document.getElementById('user-section');
        const statsSection = document.getElementById('stats-section');
        const historySection = document.getElementById('history-section');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userSection) userSection.style.display = 'none';
        if (statsSection) statsSection.style.display = 'none';
        if (historySection) historySection.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
    
    // 清空广告列表
    clearAds() {
        const adsContainer = document.getElementById('ads-container');
        if (adsContainer) {
            adsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-ad"></i>
                    </div>
                    <p>请登录查看广告</p>
                    <button onclick="app.showAuthModal()" class="watch-btn" style="max-width:200px;margin:20px auto;">
                        <i class="fas fa-sign-in-alt"></i> 登录查看广告
                    </button>
                </div>
            `;
        }
    }
    
    // 清空观看历史
    clearHistory() {
        const historyList = document.getElementById('history-list');
        if (historyList) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <p>请登录查看观看记录</p>
                    <button onclick="app.showAuthModal()" class="watch-btn" style="max-width:200px;margin:20px auto;">
                        <i class="fas fa-sign-in-alt"></i> 登录查看记录
                    </button>
                </div>
            `;
        }
    }
    
    // 加载用户数据
    async loadUserData() {
        if (!window.userSystem || !window.userSystem.isLoggedIn) {
            console.log('用户未登录，跳过加载用户数据');
            return;
        }
        
        console.log('加载用户数据...');
        
        const user = window.userSystem.currentUser;
        
        // 更新用户信息显示
        const nicknameElement = document.getElementById('user-nickname');
        const idElement = document.getElementById('user-id');
        const balanceElement = document.getElementById('user-balance');
        
        if (nicknameElement) nicknameElement.textContent = user.username || '用户';
        if (idElement) idElement.textContent = user.id ? `ID: ${user.id}` : 'ID: 未登录';
        if (balanceElement) balanceElement.innerHTML = `<i class="fas fa-wallet"></i> ¥${(user.balance || 0).toFixed(2)}`;
        
        // 获取最新统计数据
        if (window.userSystem.getUserStats) {
            const stats = await window.userSystem.getUserStats(user.id);
            
            if (stats) {
                const todayIncomeElement = document.getElementById('today-income');
                const adsCountElement = document.getElementById('ads-count');
                const totalIncomeElement = document.getElementById('total-income');
                const successRateElement = document.getElementById('success-rate');
                
                if (todayIncomeElement) todayIncomeElement.textContent = `¥${stats.todayEarnings.toFixed(2)}`;
                if (adsCountElement) adsCountElement.textContent = stats.todayViews;
                if (totalIncomeElement) totalIncomeElement.textContent = `¥${stats.totalEarnings.toFixed(2)}`;
                if (successRateElement) successRateElement.textContent = `${stats.successRate}%`;
            }
        }
        
        console.log('用户数据加载完成');
    }
    
    // 加载广告列表
    async loadAds() {
        if (!window.userSystem || !window.userSystem.isLoggedIn) {
            console.log('用户未登录，跳过加载广告列表');
            return;
        }
        
        console.log('加载广告列表...');
        
        const userId = window.userSystem.currentUser.id;
        const adsContainer = document.getElementById('ads-container');
        
        if (!adsContainer) {
            console.error('广告容器未找到');
            return;
        }
        
        try {
            if (!window.adSystem || !window.adSystem.getActiveAds) {
                console.error('广告系统未初始化');
                adsContainer.innerHTML = '<div class="empty-state"><p>广告系统初始化中...</p></div>';
                return;
            }
            
            const ads = await window.adSystem.getActiveAds();
            adsContainer.innerHTML = '';
            
            if (ads.length === 0) {
                adsContainer.innerHTML = '<div class="empty-state"><p>暂无可用广告，请稍后再来</p></div>';
                console.log('没有可用广告');
                return;
            }
            
            console.log(`找到 ${ads.length} 个广告`);
            
            for (const ad of ads) {
                // 检查用户是否观看过此广告
                let hasViewed = false;
                if (window.adSystem.hasUserViewedAd) {
                    hasViewed = await window.adSystem.hasUserViewedAd(userId, ad.id);
                }
                
                const adElement = document.createElement('div');
                adElement.className = `ad-card ${hasViewed ? 'watched' : ''}`;
                adElement.dataset.adId = ad.id;
                adElement.innerHTML = `
                    <div class="ad-header">
                        <div class="ad-title">${ad.title || '广告'}</div>
                        <div class="ad-reward">¥${(ad.reward || 0).toFixed(2)}</div>
                    </div>
                    <div class="ad-description">${ad.description || '观看完整广告内容获得收益'}</div>
                    <div class="ad-meta">
                        <div class="ad-duration">
                            <i class="fas fa-clock"></i> ${ad.duration || 30}秒
                        </div>
                        <div class="ad-views">
                            <i class="fas fa-eye"></i> ${ad.currentViews || 0}/${ad.maxViews || 1000}
                        </div>
                    </div>
                    <div class="ad-action">
                        <button class="watch-btn ${hasViewed ? 'disabled' : ''}" 
                                onclick="app.startAdView(${ad.id})"
                                ${hasViewed ? 'disabled' : ''}>
                            ${hasViewed ? '<i class="fas fa-check"></i> 已观看' : '<i class="fas fa-play"></i> 立即观看'}
                        </button>
                    </div>
                `;
                
                adsContainer.appendChild(adElement);
            }
            
            console.log('广告列表加载完成');
            
        } catch (error) {
            console.error('加载广告列表失败:', error);
            adsContainer.innerHTML = '<div class="empty-state"><p>加载广告失败，请刷新页面</p></div>';
        }
    }
    
    // 开始观看广告
    async startAdView(adId) {
        if (!window.userSystem || !window.userSystem.isLoggedIn) {
            this.showError('请先登录');
            this.showAuthModal();
            return;
        }
        
        const userId = window.userSystem.currentUser.id;
        
        console.log('开始观看广告:', adId, '用户:', userId);
        
        try {
            if (!window.adSystem || !window.adSystem.startAdView) {
                this.showError('广告系统未初始化');
                return;
            }
            
            const result = await window.adSystem.startAdView(adId, userId);
            
            if (result.success) {
                // 显示广告弹窗
                const modal = document.getElementById('ad-modal');
                if (modal) {
                    modal.style.display = 'flex';
                }
                
                // 更新广告弹窗信息
                const titleElement = document.getElementById('ad-modal-title');
                const rewardElement = document.getElementById('ad-modal-reward');
                
                if (titleElement && result.ad) {
                    titleElement.textContent = result.ad.title;
                }
                
                if (rewardElement && result.ad) {
                    rewardElement.textContent = `¥${result.ad.reward.toFixed(2)}`;
                }
                
                this.currentAdId = adId;
            } else {
                this.showError(result.message);
            }
            
        } catch (error) {
            console.error('开始观看广告失败:', error);
            this.showError('无法开始观看广告，请重试');
        }
    }
    
    // 加载观看历史
    async loadHistory() {
        if (!window.userSystem || !window.userSystem.isLoggedIn) {
            console.log('用户未登录，跳过加载历史记录');
            return;
        }
        
        console.log('加载观看历史...');
        
        const userId = window.userSystem.currentUser.id;
        const historyList = document.getElementById('history-list');
        
        if (!historyList) {
            console.error('历史记录容器未找到');
            return;
        }
        
        try {
            if (!window.userSystem.getUserViewRecords) {
                console.error('用户系统方法不可用');
                historyList.innerHTML = '<div class="empty-state"><p>历史记录功能开发中...</p></div>';
                return;
            }
            
            const records = await window.userSystem.getUserViewRecords(userId, 10);
            historyList.innerHTML = '';
            
            if (records.length === 0) {
                historyList.innerHTML = '<div class="empty-state"><p>暂无观看记录</p></div>';
                console.log('没有观看记录');
                return;
            }
            
            console.log(`找到 ${records.length} 条观看记录`);
            
            for (const record of records) {
                // 获取广告信息
                let adTitle = '广告';
                if (window.adSystem && window.adSystem.getAd) {
                    const ad = await window.adSystem.getAd(record.adId);
                    if (ad) {
                        adTitle = ad.title;
                    }
                }
                
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                const time = new Date(record.viewedAt);
                const timeStr = time.toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const rewardAmount = record.reward || 0;
                const isCompleted = record.completed || false;
                
                historyItem.innerHTML = `
                    <div class="history-info">
                        <h4>${adTitle}</h4>
                        <div class="history-time">${timeStr}</div>
                    </div>
                    <div class="history-amount ${isCompleted ? '' : 'failed'}">
                        ${isCompleted ? `+¥${rewardAmount.toFixed(2)}` : '未完成'}
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            }
            
            console.log('观看历史加载完成');
            
        } catch (error) {
            console.error('加载观看历史失败:', error);
            historyList.innerHTML = '<div class="empty-state"><p>加载历史记录失败</p></div>';
        }
    }
    
    // 显示成功消息
    showSuccess(message) {
        if (window.showMessage) {
            window.showMessage(message, 'success');
        } else {
            alert('成功: ' + message);
        }
    }
    
    // 显示错误消息
    showError(message) {
        if (window.showMessage) {
            window.showMessage(message, 'error');
        } else {
            alert('错误: ' + message);
        }
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，启动应用程序...');
    window.app = new AdRewardApp();
});