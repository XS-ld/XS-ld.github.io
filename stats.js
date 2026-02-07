// 数据统计系统
class StatisticsSystem {
    constructor() {
        this.dailyResetInterval = null;
        this.init();
    }
    
    async init() {
        // 设置每日重置任务
        this.setupDailyReset();
        
        // 检查今日统计
        await this.checkDailyStats();
    }
    
    // 检查并创建今日统计
    async checkDailyStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            let todayStat = await DatabaseService.statDB.getByIndex('date', today);
            
            if (!todayStat) {
                todayStat = {
                    date: today,
                    type: 'daily',
                    totalViews: 0,
                    totalEarnings: 0,
                    uniqueUsers: 0,
                    completionRate: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await DatabaseService.statDB.add(todayStat);
                console.log('今日统计数据已创建');
            }
            
            return todayStat;
            
        } catch (error) {
            console.error('检查今日统计失败:', error);
            return null;
        }
    }
    
    // 设置每日重置
    setupDailyReset() {
        // 清除旧的定时器
        if (this.dailyResetInterval) {
            clearInterval(this.dailyResetInterval);
        }
        
        // 计算到午夜的时间
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight - now;
        
        // 设置定时器在午夜执行
        setTimeout(() => {
            this.resetDailyData();
            // 然后设置每24小时执行一次
            this.dailyResetInterval = setInterval(() => {
                this.resetDailyData();
            }, 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
        
        console.log('每日重置定时器已设置');
    }
    
    // 重置每日数据
    async resetDailyData() {
        try {
            console.log('开始重置每日数据...');
            
            // 获取所有用户
            const users = await DatabaseService.userDB.getAll();
            
            // 重置每个用户的每日数据
            for (const user of users) {
                await DatabaseService.userDB.update(user.id, {
                    todayEarnings: 0,
                    todayViews: 0,
                    updatedAt: new Date().toISOString()
                });
            }
            
            console.log(`已重置 ${users.length} 个用户的每日数据`);
            
            // 创建新的每日统计记录
            await this.checkDailyStats();
            
            // 触发数据更新事件
            this.triggerDataUpdated();
            
        } catch (error) {
            console.error('重置每日数据失败:', error);
        }
    }
    
    // 触发数据更新事件
    triggerDataUpdated() {
        const event = new CustomEvent('dataUpdated', {
            detail: { type: 'dailyReset', timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }
    
    // 获取实时统计数据
    async getRealTimeStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 获取今日统计
            const todayStat = await DatabaseService.statDB.getByIndex('date', today);
            
            // 获取在线用户（最近15分钟活跃）
            const users = await DatabaseService.userDB.getAll();
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            
            const onlineUsers = users.filter(user => {
                const lastActive = new Date(user.lastActive);
                return lastActive > fifteenMinutesAgo;
            });
            
            // 获取当前广告活动数
            const ads = await DatabaseService.adDB.getAll();
            const activeAds = ads.filter(ad => ad.isActive);
            
            // 获取最近1小时的观看记录
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const records = await DatabaseService.recordDB.getAll();
            const recentRecords = records.filter(record => 
                new Date(record.viewedAt) > new Date(oneHourAgo)
            );
            
            // 计算每小时趋势
            const hourlyTrends = this.calculateHourlyTrends();
            
            return {
                todayViews: todayStat ? todayStat.totalViews : 0,
                todayEarnings: todayStat ? todayStat.totalEarnings : 0,
                onlineUsers: onlineUsers.length,
                activeAds: activeAds.length,
                hourViews: recentRecords.length,
                hourlyTrends: hourlyTrends,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('获取实时统计失败:', error);
            return null;
        }
    }
    
    // 计算每小时趋势
    calculateHourlyTrends() {
        const trends = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(now.getHours() - i);
            hour.setMinutes(0, 0, 0);
            
            trends.push({
                hour: hour.getHours(),
                time: hour.toLocaleTimeString('zh-CN', { hour: '2-digit' }),
                views: Math.floor(Math.random() * 100),
                earnings: Math.random() * 15
            });
        }
        
        return trends;
    }
    
    // 获取用户统计数据
    async getUserStats(userId) {
        try {
            const user = await DatabaseService.userDB.get(userId);
            if (!user) return null;
            
            // 获取用户的观看记录
            const records = await DatabaseService.recordDB.getAllByIndex('userId', userId);
            const completedRecords = records.filter(r => r.completed);
            
            // 获取用户的收益记录
            const earnings = await DatabaseService.earningDB.getAllByIndex('userId', userId);
            
            // 计算每日收益
            const dailyEarnings = {};
            earnings.forEach(earning => {
                const date = earning.date;
                if (!dailyEarnings[date]) {
                    dailyEarnings[date] = 0;
                }
                dailyEarnings[date] += earning.amount;
            });
            
            // 转换为数组
            const dailyEarningsArray = Object.keys(dailyEarnings)
                .map(date => ({
                    date,
                    earnings: dailyEarnings[date]
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-30); // 最近30天
            
            return {
                userId: user.id,
                username: user.username,
                totalEarnings: user.totalEarnings || 0,
                balance: user.balance || 0,
                totalViews: records.length,
                completedViews: completedRecords.length,
                completionRate: records.length > 0 ? (completedRecords.length / records.length * 100).toFixed(1) : 0,
                averageEarningsPerView: completedRecords.length > 0 ? 
                    (user.totalEarnings || 0) / completedRecords.length : 0,
                dailyEarnings: dailyEarningsArray,
                lastActive: user.lastActive,
                createdAt: user.createdAt
            };
            
        } catch (error) {
            console.error('获取用户统计失败:', error);
            return null;
        }
    }
    
    // 获取广告效果统计
    async getAdPerformanceStats() {
        try {
            const ads = await DatabaseService.adDB.getAll();
            const stats = [];
            
            for (const ad of ads) {
                const adStats = await window.adSystem.getAdStats(ad.id);
                if (adStats) {
                    stats.push(adStats);
                }
            }
            
            // 按收益排序
            return stats.sort((a, b) => b.totalEarnings - a.totalEarnings);
            
        } catch (error) {
            console.error('获取广告效果统计失败:', error);
            return [];
        }
    }
    
    // 获取收入报告
    async getIncomeReport(startDate, endDate) {
        try {
            const earnings = await DatabaseService.earningDB.getAll();
            const filteredEarnings = earnings.filter(earning => {
                const earningDate = new Date(earning.date);
                return earningDate >= new Date(startDate) && earningDate <= new Date(endDate);
            });
            
            // 按类型分组
            const groupedByType = filteredEarnings.reduce((groups, earning) => {
                const type = earning.type;
                if (!groups[type]) {
                    groups[type] = {
                        count: 0,
                        total: 0,
                        items: []
                    };
                }
                groups[type].count++;
                groups[type].total += earning.amount;
                groups[type].items.push(earning);
                return groups;
            }, {});
            
            // 按日期分组
            const groupedByDate = filteredEarnings.reduce((groups, earning) => {
                const date = earning.date;
                if (!groups[date]) {
                    groups[date] = {
                        count: 0,
                        total: 0
                    };
                }
                groups[date].count++;
                groups[date].total += earning.amount;
                return groups;
            }, {});
            
            // 转换为数组
            const dateArray = Object.keys(groupedByDate)
                .map(date => ({
                    date,
                    count: groupedByDate[date].count,
                    total: groupedByDate[date].total
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            return {
                period: { startDate, endDate },
                totalEarnings: filteredEarnings.reduce((sum, e) => sum + e.amount, 0),
                totalViews: filteredEarnings.filter(e => e.type === 'ad_view').length,
                byType: groupedByType,
                byDate: dateArray,
                rawData: filteredEarnings
            };
            
        } catch (error) {
            console.error('获取收入报告失败:', error);
            return null;
        }
    }
    
    // 导出数据
    async exportData(type, format = 'json') {
        try {
            let data;
            
            switch (type) {
                case 'users':
                    data = await DatabaseService.userDB.getAll();
                    break;
                case 'ads':
                    data = await DatabaseService.adDB.getAll();
                    break;
                case 'records':
                    data = await DatabaseService.recordDB.getAll();
                    break;
                case 'earnings':
                    data = await DatabaseService.earningDB.getAll();
                    break;
                case 'stats':
                    data = await DatabaseService.statDB.getAll();
                    break;
                default:
                    throw new Error('不支持的数据类型');
            }
            
            if (format === 'json') {
                return JSON.stringify(data, null, 2);
            } else if (format === 'csv') {
                return this.convertToCSV(data);
            } else {
                throw new Error('不支持的格式');
            }
            
        } catch (error) {
            console.error('导出数据失败:', error);
            throw error;
        }
    }
    
    // 转换为CSV格式
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => JSON.stringify(row[header] || '')).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }
}

// 创建统计系统实例并导出
window.statsSystem = new StatisticsSystem();