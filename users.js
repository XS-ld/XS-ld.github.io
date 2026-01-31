// 用户系统
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }
    
    async init() {
        // 从localStorage恢复登录状态
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;
                console.log('用户状态已恢复:', this.currentUser.username);
            } catch (error) {
                console.error('恢复用户状态失败:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }
    
    // 用户注册
    async register(userData) {
        try {
            // 验证手机号格式
            if (!this.validatePhone(userData.phone)) {
                throw new Error('手机号格式不正确');
            }
            
            // 验证密码长度
            if (userData.password.length < 6 || userData.password.length > 20) {
                throw new Error('密码长度必须在6-20位之间');
            }
            
            // 检查手机号是否已注册
            const existingUser = await DatabaseService.userDB.getByIndex('phone', userData.phone);
            if (existingUser) {
                throw new Error('该手机号已注册');
            }
            
            // 创建用户对象
            const newUser = {
                phone: userData.phone,
                username: userData.nickname || `用户_${userData.phone.slice(-4)}`,
                password: this.hashPassword(userData.password),
                balance: 0,
                totalEarnings: 0,
                todayEarnings: 0,
                todayViews: 0,
                totalViews: 0,
                lastActive: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'active',
                level: 1,
                inviteCode: this.generateInviteCode()
            };
            
            // 保存到数据库
            const userId = await DatabaseService.userDB.add(newUser);
            
            // 更新用户ID
            newUser.id = userId;
            
            // 记录注册统计
            await this.logUserAction(userId, 'register');
            
            return {
                success: true,
                message: '注册成功',
                user: newUser
            };
            
        } catch (error) {
            console.error('用户注册失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 用户登录
    async login(phone, password) {
        try {
            // 查找用户
            const user = await DatabaseService.userDB.getByIndex('phone', phone);
            
            if (!user) {
                throw new Error('用户不存在');
            }
            
            // 验证密码
            if (this.hashPassword(password) !== user.password) {
                throw new Error('密码错误');
            }
            
            // 检查用户状态
            if (user.status !== 'active') {
                throw new Error('账号已被禁用');
            }
            
            // 更新最后活跃时间
            await DatabaseService.userDB.update(user.id, {
                lastActive: new Date().toISOString()
            });
            
            // 设置当前用户
            this.currentUser = user;
            this.isLoggedIn = true;
            
            // 保存到localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // 记录登录统计
            await this.logUserAction(user.id, 'login');
            
            return {
                success: true,
                message: '登录成功',
                user: user
            };
            
        } catch (error) {
            console.error('用户登录失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 用户登出
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        console.log('用户已登出');
    }
    
    // 获取用户信息
    async getUserInfo(userId) {
        try {
            return await DatabaseService.userDB.get(userId);
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
    
    // 更新用户信息
    async updateUser(userId, updates) {
        try {
            const result = await DatabaseService.userDB.update(userId, updates);
            
            // 如果更新的是当前用户，更新本地存储
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = { ...this.currentUser, ...updates };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
            
            return {
                success: true,
                message: '更新成功',
                user: result
            };
            
        } catch (error) {
            console.error('更新用户信息失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // 增加用户收益
    async addUserEarnings(userId, amount, adId) {
        try {
            const user = await DatabaseService.userDB.get(userId);
            if (!user) {
                throw new Error('用户不存在');
            }
            
            const today = new Date().toISOString().split('T')[0];
            const userTodayEarnings = user.todayEarnings || 0;
            const userTotalEarnings = user.totalEarnings || 0;
            
            // 更新用户余额和收益
            const updates = {
                balance: (user.balance || 0) + amount,
                todayEarnings: userTodayEarnings + amount,
                totalEarnings: userTotalEarnings + amount,
                totalViews: (user.totalViews || 0) + 1,
                todayViews: (user.todayViews || 0) + 1,
                lastActive: new Date().toISOString()
            };
            
            await DatabaseService.userDB.update(userId, updates);
            
            // 记录收益详情
            await DatabaseService.earningDB.add({
                userId: userId,
                amount: amount,
                type: 'ad_view',
                adId: adId,
                date: today,
                description: `观看广告收益`,
                createdAt: new Date().toISOString()
            });
            
            // 更新当前用户信息
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = { ...this.currentUser, ...updates };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
            
            // 更新今日统计数据
            await this.updateDailyStats(amount);
            
            return {
                success: true,
                message: '收益添加成功',
                newBalance: updates.balance
            };
            
        } catch (error) {
            console.error('增加用户收益失败:', error);
            throw error;
        }
    }
    
    // 更新每日统计
    async updateDailyStats(earningsAmount) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 获取今日统计
            let todayStat = await DatabaseService.statDB.getByIndex('date', today);
            
            if (!todayStat) {
                todayStat = {
                    date: today,
                    type: 'daily',
                    totalViews: 0,
                    totalEarnings: 0,
                    uniqueUsers: 0,
                    completionRate: 0,
                    updatedAt: new Date().toISOString()
                };
                await DatabaseService.statDB.add(todayStat);
            }
            
            // 更新统计
            await DatabaseService.statDB.update(todayStat.id, {
                totalViews: (todayStat.totalViews || 0) + 1,
                totalEarnings: (todayStat.totalEarnings || 0) + earningsAmount,
                updatedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('更新每日统计失败:', error);
        }
    }
    
    // 获取用户观看记录
    async getUserViewRecords(userId, limit = 50) {
        try {
            const records = await DatabaseService.recordDB.getAllByIndex('userId', userId);
            return records.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)).slice(0, limit);
        } catch (error) {
            console.error('获取用户观看记录失败:', error);
            return [];
        }
    }
    
    // 获取用户收益记录
    async getUserEarnings(userId, limit = 50) {
        try {
            const earnings = await DatabaseService.earningDB.getAllByIndex('userId', userId);
            return earnings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
        } catch (error) {
            console.error('获取用户收益记录失败:', error);
            return [];
        }
    }
    
    // 记录用户行为
    async logUserAction(userId, action, details = {}) {
        try {
            console.log(`用户行为记录: ${userId} - ${action}`, details);
        } catch (error) {
            console.error('记录用户行为失败:', error);
        }
    }
    
    // 验证手机号格式
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    
    // 密码哈希函数
    hashPassword(password) {
        return btoa(unescape(encodeURIComponent(password + 'salt')));
    }
    
    // 生成邀请码
    generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // 获取用户统计数据
    async getUserStats(userId) {
        try {
            const user = await DatabaseService.userDB.get(userId);
            if (!user) return null;
            
            // 获取今日收益记录
            const today = new Date().toISOString().split('T')[0];
            const earnings = await DatabaseService.earningDB.getAllByIndex('userId', userId);
            const todayEarnings = earnings
                .filter(e => e.date === today && e.type === 'ad_view')
                .reduce((sum, e) => sum + e.amount, 0);
            
            // 获取观看记录
            const records = await DatabaseService.recordDB.getAllByIndex('userId', userId);
            const todayRecords = records.filter(r => r.viewedAt.startsWith(today));
            const completedRecords = records.filter(r => r.completed);
            
            return {
                userId: user.id,
                username: user.username,
                balance: user.balance || 0,
                totalEarnings: user.totalEarnings || 0,
                todayEarnings: todayEarnings,
                totalViews: user.totalViews || 0,
                todayViews: todayRecords.length,
                lastActive: user.lastActive,
                successRate: records.length > 0 ? (completedRecords.length / records.length * 100).toFixed(1) : 0
            };
            
        } catch (error) {
            console.error('获取用户统计数据失败:', error);
            return null;
        }
    }
}

// 创建用户系统实例并导出
window.userSystem = new UserSystem();