// 红包数据
const packets = [
    { id: 1, amount: "0.88", desc: "幸运红包", icon: "💰", color: "#FFD700" },
    { id: 2, amount: "1.88", desc: "财运红包", icon: "💵", color: "#32CD32" },
    { id: 3, amount: "2.88", desc: "惊喜红包", icon: "🎁", color: "#FF69B4" },
    { id: 4, amount: "5.88", desc: "超级红包", icon: "💎", color: "#9370DB" },
    { id: 5, amount: "0.66", desc: "福气红包", icon: "🍀", color: "#00CED1" },
    { id: 6, amount: "3.88", desc: "吉祥红包", icon: "🎉", color: "#FF6347" },
    { id: 7, amount: "8.88", desc: "大发红包", icon: "🔥", color: "#FF4500" },
    { id: 8, amount: "6.66", desc: "顺利红包", icon: "✨", color: "#1E90FF" }
];

// 用户数据
let userData = {
    todayClicks: 0,
    totalClicks: 0,
    earnings: 0,
    userId: generateUserId(),
    sessionId: generateSessionId(),
    claimedPackets: []
};

// DOM元素
let currentUrl = window.location.href;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('动态红包系统初始化...');
    console.log('Monetag状态：', document.querySelector('meta[name="monetag"]') ? '已加载' : '未找到');
    
    // 显示当前网址
    document.getElementById('currentUrl').textContent = currentUrl;
    
    // 加载用户数据
    loadUserData();
    
    // 检查URL参数
    checkUrlParams();
    
    // 初始化红包
    initPackets();
    
    // 更新显示
    updateDisplay();
    
    // 检查每日重置
    checkDailyReset();
    
    console.log('初始化完成，用户ID:', userData.userId);
});

// 生成唯一用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 生成会话ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

// 加载用户数据
function loadUserData() {
    const saved = localStorage.getItem('dynamic_redpacket_data');
    if (saved) {
        const data = JSON.parse(saved);
        
        // 检查是否是今天的数据
        const today = new Date().toDateString();
        const savedDate = data.lastVisitDate || today;
        
        if (savedDate === today) {
            userData = { ...userData, ...data };
        } else {
            // 新的一天，重置今日数据
            userData.todayClicks = 0;
            userData.claimedPackets = [];
        }
        
        userData.lastVisitDate = today;
    }
}

// 保存用户数据
function saveUserData() {
    userData.lastVisitDate = new Date().toDateString();
    localStorage.setItem('dynamic_redpacket_data', JSON.stringify(userData));
}

// 初始化红包显示
function initPackets() {
    const container = document.getElementById('packetsGrid');
    container.innerHTML = '';
    
    packets.forEach(packet => {
        const isClaimed = userData.claimedPackets.includes(packet.id);
        
        const packetElement = document.createElement('div');
        packetElement.className = 'packet-item';
        packetElement.innerHTML = `
            <div class="packet-icon">${packet.icon}</div>
            <div class="packet-amount">${packet.amount}元</div>
            <div class="packet-desc">${packet.desc}</div>
            <div class="packet-click">${isClaimed ? '已领取 ✓' : '点击领取'}</div>
        `;
        
        packetElement.style.borderColor = packet.color;
        
        if (!isClaimed) {
            packetElement.onclick = () => clickPacket(packet);
        } else {
            packetElement.style.opacity = '0.6';
            packetElement.style.cursor = 'default';
            packetElement.onclick = () => {
                alert(`您已经领取过 ${packet.amount}元 ${packet.desc}了！`);
            };
        }
        
        container.appendChild(packetElement);
    });
}

// 点击红包
function clickPacket(packet) {
    // 检查次数限制
    if (userData.todayClicks >= 10) {
        alert('今日次数已用完，明天再来吧！');
        return;
    }
    
    // 检查是否已领取
    if (userData.claimedPackets.includes(packet.id)) {
        alert('您已经领取过这个红包了！');
        return;
    }
    
    // 生成动态链接
    const dynamicLink = generateDynamicLink(packet.id);
    
    // 显示动态链接
    document.getElementById('urlDisplay').innerHTML = `
        <i class="fas fa-link"></i> 动态链接已生成：<br>
        <a href="${dynamicLink}" target="_blank" style="color: #2196F3;">
            ${dynamicLink.substring(0, 60)}...
        </a>
    `;
    
    // 更新用户数据
    userData.todayClicks++;
    userData.totalClicks++;
    userData.earnings += parseFloat(packet.amount);
    userData.claimedPackets.push(packet.id);
    
    // 保存数据
    saveUserData();
    
    // 更新显示
    updateDisplay();
    
    // 显示奖励
    showReward(packet);
    
    // 触发广告
    triggerAd(packet.id);
    
    // 重新初始化红包（更新状态）
    initPackets();
    
    console.log('红包点击记录：', {
        packet: packet,
        dynamicLink: dynamicLink,
        userData: userData
    });
}

// 生成动态链接
function generateDynamicLink(packetId) {
    const params = generateDynamicParams(packetId);
    const baseUrl = currentUrl.split('?')[0];
    
    // 构建查询字符串
    const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    return baseUrl + '?' + queryString;
}

// 生成动态参数
function generateDynamicParams(packetId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    
    return {
        click_id: `click_${timestamp}_${random}`,
        user_id: userData.userId,
        session_id: userData.sessionId,
        packet_id: packetId,
        timestamp: timestamp,
        ref: `ref_${Math.random().toString(36).substr(2, 6)}`,
        source: 'redpacket_system',
        platform: 'mobile',
        version: '1.0.0'
    };
}

// 更新显示
function updateDisplay() {
    document.getElementById('todayCount').textContent = userData.todayClicks;
    document.getElementById('totalCount').textContent = userData.totalClicks;
    document.getElementById('remainingCount').textContent = 10 - userData.todayClicks;
    document.getElementById('earnings').textContent = userData.earnings.toFixed(2);
}

// 显示奖励
function showReward(packet) {
    document.getElementById('rewardAmount').textContent = packet.amount + '元';
    document.getElementById('rewardDesc').textContent = packet.desc;
    
    const modal = document.getElementById('rewardModal');
    modal.style.display = 'flex';
    
    // 5秒后自动关闭
    setTimeout(() => {
        closeModal();
    }, 5000);
}

// 关闭模态框
function closeModal() {
    document.getElementById('rewardModal').style.display = 'none';
}

// 触发广告
function triggerAd(packetId) {
    console.log('触发广告，Packet ID:', packetId);
    
    // Monetag会自动检测meta标签
    // 这里可以添加自定义广告触发逻辑
    
    // 模拟广告展示
    const adContainer = document.getElementById('adContainer');
    adContainer.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <i class="fas fa-ad" style="font-size: 50px; color: #FFD700;"></i>
            <h3 style="margin: 20px 0 10px;">广告展示中</h3>
            <p>感谢您的支持！广告收益已记录</p>
            <div style="margin-top: 20px; font-size: 12px; color: #666;">
                <i class="fas fa-info-circle"></i> 
                Monetag广告正在展示
            </div>
        </div>
    `;
}

// 检查URL参数
function checkUrlParams() {
    const params = getUrlParams();
    
    if (Object.keys(params).length > 0) {
        console.log('检测到URL参数：', params);
        
        // 如果有ref参数，记录来源
        if (params.ref) {
            console.log('来源追踪：', params.ref);
        }
        
        // 如果有packet_id参数，自动处理
        if (params.packet_id && !isNaN(params.packet_id)) {
            const packetId = parseInt(params.packet_id);
            const packet = packets.find(p => p.id === packetId);
            
            if (packet) {
                setTimeout(() => {
                    if (confirm(`来自分享链接，是否领取 ${packet.amount}元 ${packet.desc}？`)) {
                        clickPacket(packet);
                    }
                }, 1000);
            }
        }
    }
}

// 获取URL参数
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    
    if (queryString) {
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
    }
    
    return params;
}

// 生成分享链接
function generateShareLink() {
    const timestamp = Date.now();
    const shareId = `share_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;
    
    const shareUrl = currentUrl.split('?')[0] + '?ref=' + shareId;
    
    if (navigator.share) {
        navigator.share({
            title: '动态红包系统',
            text: '点击领取红包，支持广告收益！',
            url: shareUrl
        }).then(() => {
            console.log('分享成功');
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

// 复制动态URL
function copyDynamicUrl() {
    const urlDisplay = document.getElementById('urlDisplay');
    const link = urlDisplay.querySelector('a');
    
    if (link) {
        copyToClipboard(link.href);
    } else {
        alert('请先点击红包生成动态链接！');
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('链接已复制到剪贴板！');
    }).catch(err => {
        console.error('复制失败:', err);
        
        // 备用方法
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('链接已复制！');
    });
}

// 重置数据
function resetStats() {
    if (confirm('确定要重置所有数据吗？这将清除您的点击记录和收益数据。')) {
        userData = {
            todayClicks: 0,
            totalClicks: 0,
            earnings: 0,
            userId: generateUserId(),
            sessionId: generateSessionId(),
            claimedPackets: [],
            lastVisitDate: new Date().toDateString()
        };
        
        saveUserData();
        updateDisplay();
        initPackets();
        
        alert('数据已重置！');
    }
}

// 检查每日重置
function checkDailyReset() {
    const today = new Date().toDateString();
    const savedDate = userData.lastVisitDate || today;
    
    if (savedDate !== today) {
        // 新的一天，重置今日数据
        userData.todayClicks = 0;
        userData.claimedPackets = [];
        userData.lastVisitDate = today;
        
        saveUserData();
        updateDisplay();
        initPackets();
        
        console.log('每日数据已重置');
    }
}

// 防作弊检查
function checkFraud() {
    const now = Date.now();
    const lastClick = userData.lastClickTime || 0;
    
    // 防止快速连续点击
    if (now - lastClick < 1000) { // 1秒内
        console.warn('点击过快，可能作弊');
        return false;
    }
    
    userData.lastClickTime = now;
    return true;
}