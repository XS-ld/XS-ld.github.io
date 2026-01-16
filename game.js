// 游戏状态管理
class SheepGame {
    constructor() {
        this.currentLevel = 0;
        this.score = 0;
        this.timeLeft = 0;
        this.timer = null;
        this.gameBoard = [];
        this.stack = [];
        this.slots = [];
        this.selectedCards = [];
        this.history = [];
        this.isGameActive = false;
        
        // 初始化游戏
        this.init();
    }
    
    init() {
        this.loadLevel(0);
        this.updateUI();
    }
    
    // 加载关卡
    loadLevel(levelIndex) {
        const level = GameConfig.levels[levelIndex];
        if (!level) return;
        
        this.currentLevel = levelIndex;
        this.gameBoard = [];
        this.stack = [];
        this.slots = [];
        this.selectedCards = [];
        this.history = [];
        this.score = 0;
        this.timeLeft = level.timeLimit;
        this.isGameActive = true;
        
        // 创建卡片
        this.createCards(level);
        
        // 开始计时器
        this.startTimer();
        
        // 更新状态
        this.updateStatusMessage('welcomeMessage');
    }
    
    // 创建卡片
    createCards(level) {
        this.gameBoard = [];
        let cardId = 0;
        
        // 根据布局创建卡片
        level.layout.forEach((row, rowIndex) => {
            row.forEach((cardTypeId, colIndex) => {
                const cardType = GameConfig.cardTypes.find(c => c.id === cardTypeId);
                if (cardType) {
                    this.gameBoard.push({
                        id: cardId++,
                        type: cardType,
                        position: { row: rowIndex, col: colIndex },
                        isSelected: false,
                        isDisabled: false,
                        layer: rowIndex // 层数，用于遮挡判断
                    });
                }
            });
        });
        
        // 打乱卡片顺序（Fisher-Yates洗牌算法）
        for (let i = this.gameBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.gameBoard[i], this.gameBoard[j]] = [this.gameBoard[j], this.gameBoard[i]];
        }
    }
    
    // 开始计时器
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateTimer();
                
                // 检查时间是否用完
                if (this.timeLeft <= 0) {
                    this.gameOver(false);
                }
            }
        }, 1000);
    }
    
    // 更新计时器显示
    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // 选择卡片
    selectCard(cardId) {
        if (!this.isGameActive) return;
        
        const card = this.gameBoard.find(c => c.id === cardId);
        if (!card || card.isDisabled) return;
        
        // 检查卡片是否被遮挡
        if (this.isCardBlocked(card)) {
            this.updateStatusMessage('cardBlocked');
            return;
        }
        
        // 切换选择状态
        card.isSelected = !card.isSelected;
        
        if (card.isSelected) {
            this.selectedCards.push(card);
            this.updateStatusMessage('selectCard');
        } else {
            this.selectedCards = this.selectedCards.filter(c => c.id !== cardId);
        }
        
        // 检查是否可以消除
        if (this.selectedCards.length >= 3) {
            this.checkForMatch();
        }
        
        this.updateUI();
    }
    
    // 检查卡片是否被遮挡
    isCardBlocked(card) {
        // 检查同一列下方是否有卡片
        return this.gameBoard.some(otherCard => 
            otherCard.position.col === card.position.col &&
            otherCard.position.row > card.position.row &&
            !otherCard.isDisabled
        );
    }
    
    // 检查匹配
    checkForMatch() {
        // 检查最后三个选中的卡片是否相同
        const recentCards = this.selectedCards.slice(-3);
        const firstType = recentCards[0].type.id;
        const allSame = recentCards.every(card => card.type.id === firstType);
        
        if (allSame && recentCards.length === 3) {
            // 保存到历史记录（用于撤销）
            this.history.push({
                action: 'eliminate',
                cards: [...recentCards.map(c => ({...c}))],
                stack: [...this.stack],
                slots: [...this.slots]
            });
            
            // 消除卡片
            recentCards.forEach(card => {
                card.isDisabled = true;
                card.isSelected = false;
            });
            
            // 清空选择
            this.selectedCards = [];
            
            // 增加分数
            this.score += 100;
            this.updateStatusMessage('matchFound');
            
            // 检查是否通关
            if (this.checkLevelComplete()) {
                this.levelComplete();
            }
        }
        
        this.updateUI();
    }
    
    // 将卡片移动到堆叠区
    moveToStack(cardId) {
        if (!this.isGameActive) return;
        
        const card = this.gameBoard.find(c => c.id === cardId);
        if (!card || card.isDisabled) return;
        
        const level = GameConfig.levels[this.currentLevel];
        
        // 检查堆叠区是否已满
        if (this.stack.length >= level.maxStack) {
            this.updateStatusMessage('stackFull');
            return;
        }
        
        // 保存到历史记录
        this.history.push({
            action: 'moveToStack',
            card: {...card},
            stack: [...this.stack],
            slots: [...this.slots]
        });
        
        // 移动到堆叠区
        card.isDisabled = true;
        this.stack.push({
            id: card.id,
            type: card.type,
            position: this.stack.length
        });
        
        this.updateStatusMessage('cardAddedToStack');
        this.updateUI();
    }
    
    // 撤销上一步
    undo() {
        if (this.history.length === 0 || !this.isGameActive) return;
        
        const lastAction = this.history.pop();
        
        if (lastAction.action === 'eliminate') {
            // 恢复消除的卡片
            lastAction.cards.forEach(cardData => {
                const card = this.gameBoard.find(c => c.id === cardData.id);
                if (card) {
                    card.isDisabled = false;
                    card.isSelected = false;
                }
            });
            
            // 恢复堆叠区和消除区
            this.stack = lastAction.stack;
            this.slots = lastAction.slots;
            
            // 减少分数
            this.score = Math.max(0, this.score - 100);
        }
        else if (lastAction.action === 'moveToStack') {
            // 从堆叠区移回
            const card = this.gameBoard.find(c => c.id === lastAction.card.id);
            if (card) {
                card.isDisabled = false;
            }
            
            this.stack = lastAction.stack;
            this.slots = lastAction.slots;
        }
        
        this.updateUI();
        this.updateStatusMessage('undoComplete');
    }
    
    // 检查关卡是否完成
    checkLevelComplete() {
        return this.gameBoard.every(card => card.isDisabled);
    }
    
    // 关卡完成
    levelComplete() {
        this.isGameActive = false;
        clearInterval(this.timer);
        
        // 计算奖励分数
        const timeBonus = Math.floor(this.timeLeft * 10);
        this.score += timeBonus;
        
        // 显示胜利界面
        this.showResult(true);
    }
    
    // 游戏结束
    gameOver(isWin) {
        this.isGameActive = false;
        clearInterval(this.timer);
        this.showResult(isWin);
    }
    
    // 显示结果
    showResult(isWin) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');
        const finalTime = document.getElementById('finalTime');
        const finalScore = document.getElementById('finalScore');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        
        if (isWin) {
            const i18n = this.getI18n();
            title.textContent = i18n.winTitle;
            message.textContent = i18n.winMessage.replace('{level}', this.currentLevel + 1);
            
            // 如果有下一关，显示下一关按钮
            if (this.currentLevel < GameConfig.levels.length - 1) {
                nextLevelBtn.style.display = 'block';
            } else {
                nextLevelBtn.style.display = 'none';
            }
        } else {
            const i18n = this.getI18n();
            title.textContent = i18n.loseTitle;
            message.textContent = i18n.loseMessage;
            nextLevelBtn.style.display = 'none';
        }
        
        // 显示时间和分数
        const minutes = Math.floor((GameConfig.levels[this.currentLevel].timeLimit - this.timeLeft) / 60);
        const seconds = (GameConfig.levels[this.currentLevel].timeLimit - this.timeLeft) % 60;
        finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        finalScore.textContent = this.score;
        
        modal.classList.add('show');
    }
    
    // 提示功能
    giveHint() {
        if (!this.isGameActive) return;
        
        // 寻找可消除的组合
        const availableCards = this.gameBoard.filter(card => !card.isDisabled && !this.isCardBlocked(card));
        
        // 按类型分组
        const groups = {};
        availableCards.forEach(card => {
            if (!groups[card.type.id]) {
                groups[card.type.id] = [];
            }
            groups[card.type.id].push(card);
        });
        
        // 寻找有3个或以上的类型
        for (const typeId in groups) {
            if (groups[typeId].length >= 3) {
                // 高亮显示这些卡片
                groups[typeId].slice(0, 3).forEach(card => {
                    card.isSelected = true;
                    this.selectedCards.push(card);
                });
                
                this.updateStatusMessage('hintUsed');
                this.updateUI();
                
                // 3秒后自动消除
                setTimeout(() => {
                    this.checkForMatch();
                }, 3000);
                return;
            }
        }
        
        this.updateStatusMessage('noHintAvailable');
    }
    
    // 更新UI
    updateUI() {
        this.updateGameBoard();
        this.updateStack();
        this.updateSlots();
        this.updateStats();
    }
    
    // 更新游戏棋盘
    updateGameBoard() {
        const boardElement = document.getElementById('gameBoard');
        if (!boardElement) return;
        
        boardElement.innerHTML = '';
        
        this.gameBoard.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.id = `card-${card.id}`;
            
            if (card.isDisabled) {
                cardElement.classList.add('disabled');
            }
            if (card.isSelected) {
                cardElement.classList.add('selected');
            }
            
            // 设置卡片样式
            cardElement.style.background = card.type.color;
            cardElement.style.color = card.type.textColor;
            cardElement.style.boxShadow = `0 4px 6px ${card.type.color}40`;
            
            // 卡片内容
            cardElement.innerHTML = `
                <span class="card-emoji">${card.type.emoji}</span>
                ${card.isSelected ? '<div class="selection-indicator">✓</div>' : ''}
            `;
            
            // 添加点击事件
            if (!card.isDisabled) {
                cardElement.addEventListener('click', () => this.selectCard(card.id));
                cardElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.moveToStack(card.id);
                });
            }
            
            boardElement.appendChild(cardElement);
        });
    }
    
    // 更新堆叠区
    updateStack() {
        const stackElement = document.getElementById('stackSlots');
        const countElement = document.getElementById('stackCount');
        
        if (!stackElement || !countElement) return;
        
        stackElement.innerHTML = '';
        countElement.textContent = this.stack.length;
        
        // 创建堆叠槽位
        const maxStack = GameConfig.levels[this.currentLevel].maxStack;
        for (let i = 0; i < maxStack; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot';
            
            if (i < this.stack.length) {
                const card = this.stack[i];
                slotElement.classList.add('filled');
                slotElement.style.background = card.type.color;
                slotElement.innerHTML = `<span class="slot-emoji">${card.type.emoji}</span>`;
            }
            
            stackElement.appendChild(slotElement);
        }
    }
    
    // 更新消除区
    updateSlots() {
        const slotsElement = document.getElementById('cardSlots');
        const countElement = document.getElementById('slotCount');
        
        if (!slotsElement || !countElement) return;
        
        slotsElement.innerHTML = '';
        countElement.textContent = this.slots.length;
        
        // 创建消除槽位（固定3个）
        for (let i = 0; i < 3; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot';
            
            if (i < this.slots.length) {
                const card = this.slots[i];
                slotElement.classList.add('filled');
                slotElement.style.background = card.type.color;
                slotElement.innerHTML = `<span class="slot-emoji">${card.type.emoji}</span>`;
            }
            
            slotsElement.appendChild(slotElement);
        }
    }
    
    // 更新统计信息
    updateStats() {
        document.getElementById('currentLevel').textContent = this.currentLevel + 1;
        document.getElementById('score').textContent = this.score;
        this.updateTimer();
    }
    
    // 更新状态消息
    updateStatusMessage(messageKey) {
        const statusElement = document.getElementById('statusMessage');
        if (!statusElement) return;
        
        const i18n = this.getI18n();
        if (i18n[messageKey]) {
            statusElement.textContent = i18n[messageKey];
        } else {
            statusElement.textContent = messageKey;
        }
    }
    
    // 获取当前语言文本
    getI18n() {
        const language = document.getElementById('languageSelect')?.value || 'zh-CN';
        return GameConfig.translations[language] || GameConfig.translations['zh-CN'];
    }
}

// 初始化游戏
window.Game = new SheepGame();