// 广告系统
class AdSystem {
    constructor() {
        this.currentAd = null;
        this.adTimer = null;
        this.adStartTime = null;
        this.adDuration = 0;
        this.adClicked = false;
        this.adCompleted = false;
        this.adContainer = null;
    }
    
    // 初始化广告容器
    initAdContainer(containerId) {
        this.adContainer = document.getElementById(containerId);
        if (!this.adContainer) {
            console.error('广告容器未找到:', containerId);
            return false;
        }
        return true;
    }
    
    // 获取所有有效广告
    async getActiveAds() {
        try {
            const allAds = await DatabaseService.adDB.getAll();
            return allAds.filter(ad => ad.isActive === true);
        } catch (error) {
            console.error('获取广告列表失败:', error);
            return [];
        }
    }
    
    // 获取单个广告
    async getAd(adId) {
        try {
            return await DatabaseService.adDB.get(adId);
        } catch (error) {
            console.error('获取广告失败:', error);
            return null;
        }
    }
    
    // 用户是否观看过此广告
    async hasUserViewedAd(userId, adId) {
        try {
            const records = await DatabaseService.recordDB.getAllByIndex('userId', userId);
            return records.some(record => record.adId === adId);
        } catch (error) {
            console.error('检查观看记录失败:', error);
            return false;
        }
    }
    
    // 开始观看广告
    async startAdView(adId, userId) {
        try {
            // 获取广告信息
            const ad = await this.getAd(adId);
            if (!ad) {
                throw new Error('广告不存在');
            }
            
            // 检查广告是否有效
            if (!ad.isActive) {
                throw new Error('广告已下架');
            }
            
            // 检查是否达到最大观看次数
            if (ad.currentViews >= ad.maxViews) {
                throw new Error('广告观看次数已达上限');
            }
            
            // 检查用户是否已观看过
            const hasViewed = await this.hasUserViewedAd(userId, adId);
            if (hasViewed) {
                throw new Error('您已观看过此广告');
            }
            
            // 设置当前广告
            this.currentAd = ad;
            this.adDuration = ad.duration;
            this.adClicked = false;
            this.adCompleted = false;
            
            // 显示广告内容
            this.displayAdContent(ad);
            
            // 初始化计时器
            this.initAdTimer();
            
            return {
                success: true,
                ad: ad
            };
            
        } catch (error) {
            console.error('开始观看广告失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 显示广告内容 - 直接嵌入Monetag广告代码
    displayAdContent(ad) {
        if (!this.adContainer) return;
        
        // 清空容器
        this.adContainer.innerHTML = '';
        
        // 直接嵌入Monetag广告代码
        const monetagCode = `
            <!-- Monetag广告代码开始 -->
            <div id="monetag-971fc7f9c364052405cfa604324c8040"></div>
            <script type="text/javascript">
                (function() {
                    var script = document.createElement('script');
                    script.src = "https://api.monetag.com/ads.js";
                    script.async = true;
                    document.head.appendChild(script);
                })();
            </script>
            <!-- Monetag广告代码结束 -->
        `;
        
        this.adContainer.innerHTML = monetagCode;
        
        // 添加广告点击追踪
        this.addAdClickTracking();
        
        // 更新弹窗中的广告信息
        this.updateAdInfoInModal(ad);
    }
    
    // 添加广告点击追踪
    addAdClickTracking() {
        if (!this.adContainer) return;
        
        // 延迟执行，等待广告加载完成
        setTimeout(() => {
            // 为所有链接添加点击追踪
            const links = this.adContainer.getElementsByTagName('a');
            for (let link of links) {
                link.addEventListener('click', () => {
                    this.onAdClick();
                });
            }
            
            // 为所有按钮添加点击追踪
            const buttons = this.adContainer.getElementsByTagName('button');
            for (let button of buttons) {
                button.addEventListener('click', () => {
                    this.onAdClick();
                });
            }
            
            // 为所有图片添加点击追踪
            const images = this.adContainer.getElementsByTagName('img');
            for (let image of images) {
                image.addEventListener('click', () => {
                    this.onAdClick();
                });
            }
            
            // 为整个广告容器添加点击追踪
            this.adContainer.addEventListener('click', (e) => {
                if (e.target === this.adContainer) {
                    this.onAdClick();
                }
            });
            
        }, 1000); // 延迟1秒确保广告加载完成
    }
    
    // 广告被点击
    onAdClick() {
        if (!this.adClicked) {
            this.adClicked = true;
            this.adStartTime = new Date();
            
            // 显示状态更新
            const statusElement = document.getElementById('ad-status');
            if (statusElement) {
                statusElement.textContent = '广告已点击，开始计时';
                statusElement.style.color = '#2ecc71';
            }
            
            // 启用完成按钮
            const completeBtn = document.getElementById('complete-ad-btn');
            if (completeBtn) {
                completeBtn.style.display = 'inline-block';
            }
            
            // 开始倒计时
            this.startCountdown();
            
            console.log('广告被点击，开始计时');
            
            // 记录广告点击
            this.logAdClick();
        }
    }
    
    // 记录广告点击
    logAdClick() {
        if (!this.currentAd || !window.userSystem.currentUser) return;
        
        // 这里可以发送点击统计到服务器
        console.log(`广告点击记录: 用户 ${window.userSystem.currentUser.id}, 广告 ${this.currentAd.id}`);
    }
    
    // 更新弹窗中的广告信息
    updateAdInfoInModal(ad) {
        const titleElement = document.getElementById('ad-title');
        const rewardElement = document.getElementById('ad-reward-amount');
        const durationElement = document.getElementById('ad-duration');
        
        if (titleElement) titleElement.textContent = ad.title;
        if (rewardElement) rewardElement.textContent = ad.reward.toFixed(2);
        if (durationElement) durationElement.textContent = ad.duration;
    }
    
    // 初始化计时器
    initAdTimer() {
        // 重置计时器
        if (this.adTimer) {
            clearInterval(this.adTimer);
        }
        
        // 重置进度条
        const progressBar = document.getElementById('timer-progress');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        // 重置倒计时显示
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.textContent = this.adDuration;
        }
        
        // 重置状态
        const statusElement = document.getElementById('ad-status');
        if (statusElement) {
            statusElement.textContent = '等待点击广告开始计时';
            statusElement.style.color = '#e74c3c';
        }
    }
    
    // 开始倒计时
    startCountdown() {
        let timeLeft = this.adDuration;
        
        // 更新倒计时显示
        const countdownElement = document.getElementById('countdown');
        const progressBar = document.getElementById('timer-progress');
        
        if (this.adTimer) {
            clearInterval(this.adTimer);
        }
        
        this.adTimer = setInterval(() => {
            timeLeft--;
            
            if (countdownElement) {
                countdownElement.textContent = timeLeft;
            }
            
            if (progressBar) {
                const progress = ((this.adDuration - timeLeft) / this.adDuration) * 100;
                progressBar.style.width = `${progress}%`;
            }
            
            if (timeLeft <= 0) {
                this.onAdCompleted();
                clearInterval(this.adTimer);
            }
        }, 1000);
    }
    
    // 广告完成
    async onAdCompleted() {
        try {
            if (!this.adClicked) {
                throw new Error('请先点击广告');
            }
            
            const userId = window.userSystem.currentUser.id;
            const adId = this.currentAd.id;
            
            // 验证观看时长
            const viewDuration = (new Date() - this.adStartTime) / 1000;
            if (viewDuration < this.adDuration * 0.8) { // 至少观看80%时长
                throw new Error('观看时长不足');
            }
            
            // 记录观看记录
            await this.recordAdView(userId, adId, true);
            
            // 给用户添加收益
            await userSystem.addUserEarnings(userId, this.currentAd.reward, adId);
            
            // 更新广告观看次数
            await this.updateAdViews(adId);
            
            this.adCompleted = true;
            
            // 显示完成状态
            const statusElement = document.getElementById('ad-status');
            if (statusElement) {
                statusElement.textContent = '广告观看完成，奖励已发放';
                statusElement.style.color = '#2ecc71';
            }
            
            // 通知用户
            this.showCompletionMessage();
            
            console.log('广告观看完成，奖励已发放');
            
            return {
                success: true,
                reward: this.currentAd.reward
            };
            
        } catch (error) {
            console.error('广告完成处理失败:', error);
            
            // 记录失败的观看
            if (this.currentAd && window.userSystem.currentUser) {
                await this.recordAdView(window.userSystem.currentUser.id, this.currentAd.id, false);
            }
            
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 记录广告观看
    async recordAdView(userId, adId, completed) {
        try {
            const record = {
                userId: userId,
                adId: adId,
                viewedAt: new Date().toISOString(),
                completed: completed,
                duration: completed ? this.adDuration : 0,
                reward: completed ? this.currentAd.reward : 0,
                adTitle: this.currentAd.title,
                adType: 'monetag'
            };
            
            await DatabaseService.recordDB.add(record);
            console.log('广告观看记录已保存');
            
        } catch (error) {
            console.error('记录广告观看失败:', error);
        }
    }
    
    // 更新广告观看次数
    async updateAdViews(adId) {
        try {
            const ad = await this.getAd(adId);
            if (!ad) return;
            
            await DatabaseService.adDB.update(adId, {
                currentViews: (ad.currentViews || 0) + 1,
                updatedAt: new Date().toISOString()
            });
            
            console.log('广告观看次数已更新');
            
        } catch (error) {
            console.error('更新广告观看次数失败:', error);
        }
    }
    
    // 显示完成消息
    showCompletionMessage() {
        const message = `恭喜！您已成功观看广告，获得 ${this.currentAd.reward} 元奖励！`;
        alert(message);
    }
    
    // 取消观看
    cancelAdView() {
        if (this.adTimer) {
            clearInterval(this.adTimer);
            this.adTimer = null;
        }
        
        // 记录失败的观看
        if (this.currentAd && window.userSystem.currentUser && this.adClicked) {
            this.recordAdView(window.userSystem.currentUser.id, this.currentAd.id, false);
        }
        
        this.currentAd = null;
        this.adClicked = false;
        this.adCompleted = false;
    }
    
    // 创建新广告
    async createAd(adData) {
        try {
            const newAd = {
                title: adData.title,
                description: adData.description,
                reward: parseFloat(adData.reward),
                duration: parseInt(adData.duration),
                isActive: adData.isActive || true,
                maxViews: parseInt(adData.maxViews) || 1000,
                currentViews: 0,
                adType: 'monetag',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const adId = await DatabaseService.adDB.add(newAd);
            newAd.id = adId;
            
            return {
                success: true,
                message: '广告创建成功',
                ad: newAd
            };
            
        } catch (error) {
            console.error('创建广告失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 更新广告
    async updateAd(adId, updates) {
        try {
            const result = await DatabaseService.adDB.update(adId, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: '广告更新成功',
                ad: result
            };
            
        } catch (error) {
            console.error('更新广告失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 获取广告统计数据
    async getAdStats(adId = null) {
        try {
            if (adId) {
                // 获取单个广告的统计
                const ad = await this.getAd(adId);
                if (!ad) return null;
                
                const records = await DatabaseService.recordDB.getAll();
                const adRecords = records.filter(r => r.adId === adId);
                const completedRecords = adRecords.filter(r => r.completed);
                
                // 计算今日数据
                const today = new Date().toISOString().split('T')[0];
                const todayRecords = adRecords.filter(r => r.viewedAt.startsWith(today));
                const todayCompleted = todayRecords.filter(r => r.completed);
                
                return {
                    adId: ad.id,
                    title: ad.title,
                    totalViews: adRecords.length,
                    completedViews: completedRecords.length,
                    completionRate: adRecords.length > 0 ? (completedRecords.length / adRecords.length * 100).toFixed(1) : 0,
                    totalEarnings: completedRecords.reduce((sum, r) => sum + r.reward, 0),
                    todayViews: todayRecords.length,
                    todayEarnings: todayCompleted.reduce((sum, r) => sum + r.reward, 0),
                    maxViews: ad.maxViews,
                    currentViews: ad.currentViews,
                    remainingViews: ad.maxViews - ad.currentViews,
                    isActive: ad.isActive,
                    adType: ad.adType || 'monetag'
                };
            } else {
                // 获取所有广告的统计
                const ads = await this.getActiveAds();
                const stats = [];
                
                for (const ad of ads) {
                    const adStat = await this.getAdStats(ad.id);
                    if (adStat) {
                        stats.push(adStat);
                    }
                }
                
                return stats;
            }
            
        } catch (error) {
            console.error('获取广告统计失败:', error);
            return null;
        }
    }
    
    // 获取平台统计数据
    async getPlatformStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 获取今日统计
            const todayStat = await DatabaseService.statDB.getByIndex('date', today);
            
            // 获取用户总数
            const users = await DatabaseService.userDB.getAll();
            
            // 获取总收益
            const earnings = await DatabaseService.earningDB.getAll();
            const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
            
            // 获取总观看次数
            const records = await DatabaseService.recordDB.getAll();
            const completedRecords = records.filter(r => r.completed);
            
            // 获取最近7天数据
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // 获取该日期的记录
                const dayRecords = records.filter(r => r.viewedAt.startsWith(dateStr));
                const dayCompleted = dayRecords.filter(r => r.completed);
                
                last7Days.push({
                    date: dateStr,
                    views: dayRecords.length,
                    earnings: dayCompleted.reduce((sum, r) => sum + r.reward, 0)
                });
            }
            
            return {
                totalUsers: users.length,
                activeUsers: users.filter(u => {
                    const lastActive = new Date(u.lastActive);
                    const daysSinceActive = (new Date() - lastActive) / (1000 * 60 * 60 * 24);
                    return daysSinceActive < 7;
                }).length,
                totalViews: records.length,
                completedViews: completedRecords.length,
                totalEarnings: totalEarnings,
                todayViews: todayStat ? todayStat.totalViews : 0,
                todayEarnings: todayStat ? todayStat.totalEarnings : 0,
                completionRate: records.length > 0 ? (completedRecords.length / records.length * 100).toFixed(1) : 0,
                last7Days: last7Days,
                monetagAds: records.filter(r => r.adType === 'monetag').length,
                revenuePerView: completedRecords.length > 0 ? (totalEarnings / completedRecords.length).toFixed(2) : 0
            };
            
        } catch (error) {
            console.error('获取平台统计失败:', error);
            return null;
        }
    }
}

// 创建广告系统实例并导出
window.adSystem = new AdSystem();
