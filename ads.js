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
            
            // 初始化广告容器
            if (!this.adContainer) {
                this.initAdContainer('ad-content-container');
            }
            
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
    
    // 显示广告内容
    displayAdContent(ad) {
        if (!this.adContainer) return;
        
        // 清空容器
        this.adContainer.innerHTML = '';
        
        // 创建广告展示区域
        const adContent = document.createElement('div');
        adContent.className = 'ad-display';
        
        // 模拟广告内容（实际应该嵌入真实广告代码）
        adContent.innerHTML = `
            <div class="ad-preview">
                <div class="ad-image">
                    <i class="fas fa-ad" style="font-size: 3rem; color: #667eea;"></i>
                </div>
                <div class="ad-text">
                    <h3>${ad.title}</h3>
                    <p>${ad.description}</p>
                    <p class="ad-note">请点击下方按钮或广告内容开始观看</p>
                </div>
            </div>
            <div class="ad-click-area" id="ad-click-area">
                <button class="btn-primary" id="start-ad-btn">
                    <i class="fas fa-play-circle"></i> 点击开始观看广告
                </button>
                <p class="ad-hint">点击后请耐心等待广告加载完成</p>
            </div>
        `;
        
        this.adContainer.appendChild(adContent);
        
        // 添加点击事件
        setTimeout(() => {
            const clickArea = document.getElementById('ad-click-area');
            const startBtn = document.getElementById('start-ad-btn');
            
            if (clickArea) {
                clickArea.addEventListener('click', () => {
                    this.onAdClick();
                });
            }
            
            if (startBtn) {
                startBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.onAdClick();
                });
            }
        }, 100);
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
            
            // 显示完成按钮
            const completeBtn = document.getElementById('complete-ad-btn');
            if (completeBtn) {
                completeBtn.style.display = 'inline-block';
            }
            
            // 更新广告显示
            if (this.adContainer) {
                this.adContainer.innerHTML = `
                    <div class="ad-watching">
                        <div class="ad-loading">
                            <i class="fas fa-sync fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                            <p>广告播放中，请勿关闭页面...</p>
                            <p class="ad-warning">请保持页面打开，直到倒计时结束</p>
                        </div>
                    </div>
                `;
            }
            
            // 开始倒计时
            this.startCountdown();
            
            console.log('广告被点击，开始计时');
        }
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
        
        // 隐藏完成按钮
        const completeBtn = document.getElementById('complete-ad-btn');
        if (completeBtn) {
            completeBtn.style.display = 'none';
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
                
                // 根据进度改变颜色
                if (progress < 50) {
                    progressBar.style.background = '#e74c3c';
                } else if (progress < 80) {
                    progressBar.style.background = '#f39c12';
                } else {
                    progressBar.style.background = '#2ecc71';
                }
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
            await window.userSystem.addUserEarnings(userId, this.currentAd.reward, adId);
            
            // 更新广告观看次数
            await this.updateAdViews(adId);
            
            this.adCompleted = true;
            
            // 显示完成状态
            const statusElement = document.getElementById('ad-status');
            if (statusElement) {
                statusElement.textContent = '广告观看完成，奖励已发放';
                statusElement.style.color = '#2ecc71';
            }
            
            // 显示完成界面
            if (this.adContainer) {
                this.adContainer.innerHTML = `
                    <div class="ad-completed">
                        <div class="success-icon">
                            <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ecc71;"></i>
                        </div>
                        <h3>恭喜！广告观看完成</h3>
                        <p class="reward-amount">获得奖励: ¥${this.currentAd.reward.toFixed(2)}</p>
                        <p class="ad-thanks">感谢您的观看！</p>
                    </div>
                `;
            }
            
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
}

// 创建广告系统实例并导出
window.adSystem = new AdSystem();