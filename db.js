// 数据库配置
const DB_NAME = 'AdRewardPlatform';
const DB_VERSION = 1;

// 数据库对象
let db = null;

// 初始化数据库
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('数据库打开失败:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('数据库打开成功');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // 创建用户表
            if (!database.objectStoreNames.contains('users')) {
                const userStore = database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                userStore.createIndex('phone', 'phone', { unique: true });
                userStore.createIndex('username', 'username', { unique: false });
                userStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
            
            // 创建广告表
            if (!database.objectStoreNames.contains('ads')) {
                const adStore = database.createObjectStore('ads', { keyPath: 'id', autoIncrement: true });
                adStore.createIndex('title', 'title', { unique: false });
                adStore.createIndex('isActive', 'isActive', { unique: false });
                adStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
            
            // 创建观看记录表
            if (!database.objectStoreNames.contains('view_records')) {
                const recordStore = database.createObjectStore('view_records', { keyPath: 'id', autoIncrement: true });
                recordStore.createIndex('userId', 'userId', { unique: false });
                recordStore.createIndex('adId', 'adId', { unique: false });
                recordStore.createIndex('viewedAt', 'viewedAt', { unique: false });
            }
            
            // 创建收益记录表
            if (!database.objectStoreNames.contains('earnings')) {
                const earningStore = database.createObjectStore('earnings', { keyPath: 'id', autoIncrement: true });
                earningStore.createIndex('userId', 'userId', { unique: false });
                earningStore.createIndex('date', 'date', { unique: false });
                earningStore.createIndex('type', 'type', { unique: false });
            }
            
            // 创建管理员表
            if (!database.objectStoreNames.contains('admins')) {
                const adminStore = database.createObjectStore('admins', { keyPath: 'id', autoIncrement: true });
                adminStore.createIndex('username', 'username', { unique: true });
                adminStore.createIndex('role', 'role', { unique: false });
            }
            
            // 创建统计数据表
            if (!database.objectStoreNames.contains('statistics')) {
                const statStore = database.createObjectStore('statistics', { keyPath: 'id', autoIncrement: true });
                statStore.createIndex('date', 'date', { unique: true });
                statStore.createIndex('type', 'type', { unique: false });
            }
            
            console.log('数据库表创建完成');
        };
    });
}

// 通用数据库操作类
class Database {
    constructor(storeName) {
        this.storeName = storeName;
    }
    
    // 添加数据
    async add(data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(data);
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    // 更新数据
    async update(id, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const updated = { ...existing, ...data };
                const putRequest = store.put(updated);
                
                putRequest.onsuccess = () => resolve(updated);
                putRequest.onerror = (event) => reject(event.target.error);
            };
            
            getRequest.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 获取单个数据
    async get(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 获取所有数据
    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 通过索引查询
    async getByIndex(indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index(indexName);
            const request = index.get(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 通过索引查询所有
    async getAllByIndex(indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 删除数据
    async delete(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // 计数
    async count() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// 导出数据库实例
const userDB = new Database('users');
const adDB = new Database('ads');
const recordDB = new Database('view_records');
const earningDB = new Database('earnings');
const adminDB = new Database('admins');
const statDB = new Database('statistics');

// 初始化默认数据
async function initDefaultData() {
    try {
        // 检查是否有管理员账号
        const adminCount = await adminDB.count();
        if (adminCount === 0) {
            const defaultAdmin = {
                username: 'admin',
                password: 'admin123',
                role: 'super_admin',
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            await adminDB.add(defaultAdmin);
            console.log('默认管理员账号创建成功');
        }
        
        // 检查是否有广告数据
        const adCount = await adDB.count();
        if (adCount === 0) {
            const defaultAds = [
                {
                    title: "Monetag游戏广告",
                    description: "体验最新手游，赢取丰厚奖励",
                    reward: 0.15,
                    duration: 30,
                    isActive: true,
                    maxViews: 1000,
                    currentViews: 0,
                    adType: 'monetag',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Monetag电商推广",
                    description: "发现优质商品，享受购物乐趣",
                    reward: 0.15,
                    duration: 25,
                    isActive: true,
                    maxViews: 800,
                    currentViews: 0,
                    adType: 'monetag',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Monetag理财广告",
                    description: "了解理财知识，实现财富增值",
                    reward: 0.20,
                    duration: 40,
                    isActive: true,
                    maxViews: 500,
                    currentViews: 0,
                    adType: 'monetag',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Monetag教育平台",
                    description: "提升技能，开启职业新篇章",
                    reward: 0.18,
                    duration: 35,
                    isActive: true,
                    maxViews: 600,
                    currentViews: 0,
                    adType: 'monetag',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            for (const ad of defaultAds) {
                await adDB.add(ad);
            }
            console.log('默认广告数据创建成功');
        }
        
        // 初始化今日统计数据
        const today = new Date().toISOString().split('T')[0];
        const todayStat = await statDB.getByIndex('date', today);
        if (!todayStat) {
            const defaultStat = {
                date: today,
                type: 'daily',
                totalViews: 0,
                totalEarnings: 0,
                uniqueUsers: 0,
                completionRate: 0,
                updatedAt: new Date().toISOString()
            };
            await statDB.add(defaultStat);
            console.log('今日统计数据初始化成功');
        }
        
    } catch (error) {
        console.error('初始化默认数据失败:', error);
    }
}

// 导出功能
window.DatabaseService = {
    initDatabase,
    initDefaultData,
    userDB,
    adDB,
    recordDB,
    earningDB,
    adminDB,
    statDB
};