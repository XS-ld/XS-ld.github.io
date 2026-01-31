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
            
            // 初始化事件监听
            this.initEventListeners();
            
            // 检查用户登录状态
            this.checkAuthStatus();
            
            console.log('应用程序初始化完成');
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
        }
    }
    
    // 检查认证状态
    checkAuthStatus() {
        if (window.userSystem.isLoggedIn) {
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
        console.log('初始化事件监听...');
        
        // 登录标签页切换
        document.getElementById('login-tab-btn').addEventListener('click', (e) => {
            this.switchTab('login');
        });
        
        document.getElementById('register-tab-btn').addEventListener('click', (e) => {
            this.switchTab('register');
        });
        
        // 关闭按钮
        document.getElementById('close-auth').addEventListener('click', () => {
            this.closeModal('auth-modal');
        });
        
        document.getElementById('close-ad-modal').addEventListener('click', () => {
            this.closeModal('ad-modal');
        });
        
        document.getElementById('close-admin-modal').addEventListener('click', () => {
            this.closeModal('admin-auth-modal');
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
        
        // 管理员登录链接
        document.getElementById('admin-login-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminLoginModal();
        });
        
        // 管理员登录按钮
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            this.handleAdminLogin();
        });
        
        // 广告操作按钮
        document.getElementById('start-ad-btn').addEventListener('click', () => {
            adSystem.onAdClick();
        });
        
        document.getElementById('complete-ad-btn').addEventListener('click', async () => {
            const result = await adSystem.onAdCompleted();
            if (result.success) {
                this.showSuccess(`恭喜！获得${result.reward}元奖励`);
                await this.loadUserData();
                await this.loadAds();
                await this.loadHistory();
                this.closeModal('ad-modal');
            } else {
                this.showError(result.message);
            }
        });
        
        document.getElementById('cancel-ad-btn').addEventListener('click', () => {
            adSystem.cancelAdView();
            this.closeModal('ad-modal');
        });
        
        console.log('事件监听初始化完成');
    }
    
    // 切换标签页
    switchTab(tabName) {
        // 更新按钮状态
        document.getElementById('login-tab-btn').classList.remove('active');
        document.getElementById('register-tab-btn').classList.remove('active');
        
        if (tabName === 'login') {
            document.getElementById('login-tab-btn').classList.add('active');
        } else {
            document.getElementById('register-tab-btn').classList.add('active');
        }
        
        // 更新内容显示
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('register-tab').classList.remove('active');
        
        if (tabName === 'login') {
            document.getElementById('login-tab').classList.add('active');
        } else {
            document.getElementById('register-tab').classList.add('active');
        }
    }
    
    // 处理用户登录
    async handleLogin() {
        const phone = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
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
            const result = await window.userSystem.login(phone, password);
            
            if (result.success) {
                this.showSuccess('登录成功！');
                this.showMainInterface();
                await this.loadUserData();
                await this.loadAds();
                await this.loadHistory();
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
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const nickname = document.getElementById('register-nickname').value.trim();
        
        if (!phone || !password || !nickname) {
            this.showError('请填写所有必填项');
            return;
        }
        
        console.log('尝试注册:', phone, nickname);
        
        try {
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
        if (!window.userSystem.isLoggedIn) {
            console.log('用户未登录，跳过加载用户数据');
            return;
        }
        
        console.log('加载用户数据...');
        
        const user = window.userSystem.currentUser;
        
        // 更新用户信息显示
        document.getElementById('user-nickname').textContent = user.username;
        document.getElementById('user-balance').textContent = (user.balance || 0).toFixed(2);
        
        // 获取最新统计数据
        const stats = await window.userSystem.getUserStats(user.id);
        
        if (stats) {
            document.getElementById('today-income').textContent = stats.todayEarnings.toFixed(2);
            document.getElementById('total-income').textContent = stats.totalEarnings.toFixed(2);
            document.getElementById('ads-count').textContent = stats.todayViews;
            document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        }
        
        console.log('用户数据加载完成');
    }
    
    // 加载广告列表
    async loadAds() {
        if (!window.userSystem.isLoggedIn) {
            console.log('用户未登录，跳过加载广告列表');
            return;
        }
        
        console.log('加载广告列表...');
        
        const userId = window.userSystem.currentUser.id;
        const adsGrid = document.getElementById('ads-grid');
        
        if (!adsGrid) {
            console.error('广告网格容器未找到');
            return;
        }
        
        try {
            const ads = await adSystem.getActiveAds();
            adsGrid.innerHTML = '';
            
            if (ads.length === 0) {
                adsGrid.innerHTML = '<div class="no-ads">暂无可用广告，请稍后再来</div>';
                console.log('没有可用广告');
                return;
            }
            
            console.log(`找到 ${ads.length} 个广告`);
            
            for (const ad of ads) {
                const hasViewed = await adSystem.hasUserViewedAd(userId, ad.id);
                
                const adElement = document.createElement('div');
                adElement.className = `ad-item ${hasViewed ? 'watched' : ''}`;
                adElement.dataset.adId = ad.id;
                adElement.innerHTML = `
                    <div class="ad-header">
                        <div class="ad-title">${ad.title}</div>
                        <div class="ad-reward">${ad.reward.toFixed(2)}元</div>
                    </div>
                    <div class="ad-duration">时长: ${ad.duration}秒</div>
                    <div class="ad-description">${ad.description}</div>
                `;
                
                if (!hasViewed) {
                    adElement.style.cursor = 'pointer';
                    adElement.addEventListener('click', () => {
                        console.log('点击广告:', ad.id, ad.title);
                        this.startAdView(ad.id);
                    });
                }
                
                adsGrid.appendChild(adElement);
            }
            
            console.log('广告列表加载完成');
            
        } catch (error) {
            console.error('加载广告列表失败:', error);
            adsGrid.innerHTML = '<div class="no-ads">加载广告失败，请刷新页面</div>';
        }
    }
    
    // 开始观看广告
    async startAdView(adId) {
        if (!window.userSystem.isLoggedIn) return;
        
        const userId = window.userSystem.currentUser.id;
        
        console.log('开始观看广告:', adId, '用户:', userId);
        
        try {
            const result = await adSystem.startAdView(adId, userId);
            
            if (result.success) {
                // 初始化广告容器
                adSystem.initAdContainer('ad-container');
                
                // 显示广告弹窗
                document.getElementById('ad-modal').style.display = 'flex';
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
        if (!window.userSystem.isLoggedIn) {
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
            const records = await window.userSystem.getUserViewRecords(userId, 10);
            historyList.innerHTML = '';
            
            if (records.length === 0) {
                historyList.innerHTML = '<div class="no-history">暂无观看记录</div>';
                console.log('没有观看记录');
                return;
            }
            
            console.log(`找到 ${records.length} 条观看记录`);
            
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
            
            console.log('观看历史加载完成');
            
        } catch (error) {
            console.error('加载观看历史失败:', error);
            historyList.innerHTML = '<div class="no-history">加载历史记录失败</div>';
        }
    }
    
    // 关闭弹窗
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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
        alert('成功: ' + message);
    }
    
    // 显示错误消息
    showError(message) {
        alert('错误: ' + message);
    }
}

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，启动应用程序...');
    window.app = new AdRewardApp();
});
