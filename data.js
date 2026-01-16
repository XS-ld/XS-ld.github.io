// 游戏数据配置
const GameConfig = {
    // 卡片类型配置（用Emoji和颜色代替图片）
    cardTypes: [
        { id: 1, name: 'sheep', emoji: '🐑', color: '#f6e05e', textColor: '#1a202c' },
        { id: 2, name: 'grass', emoji: '🌿', color: '#48bb78', textColor: '#1a202c' },
        { id: 3, name: 'flower', emoji: '🌸', color: '#ed64a6', textColor: '#1a202c' },
        { id: 4, name: 'carrot', emoji: '🥕', color: '#ed8936', textColor: '#1a202c' },
        { id: 5, name: 'water', emoji: '💧', color: '#4299e1', textColor: '#1a202c' },
        { id: 6, name: 'sun', emoji: '☀️', color: '#ecc94b', textColor: '#1a202c' },
        { id: 7, name: 'moon', emoji: '🌙', color: '#a0aec0', textColor: '#1a202c' },
        { id: 8, name: 'star', emoji: '⭐', color: '#fefcbf', textColor: '#1a202c' }
    ],

    // 关卡配置
    levels: [
        {
            id: 1,
            name: '初级关卡',
            cards: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
            layout: [
                [1, 2, 3, 4],
                [1, 2, 3, 4],
                [1, 2, 3, 4]
            ],
            requiredMatches: 3,
            maxStack: 7,
            timeLimit: 300 // 5分钟
        },
        {
            id: 2,
            name: '中级关卡',
            cards: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
            layout: [
                [1, 2, 3, 4, 5],
                [1, 2, 3, 4, 5],
                [1, 2, 3, 4, 5]
            ],
            requiredMatches: 3,
            maxStack: 7,
            timeLimit: 240 // 4分钟
        },
        {
            id: 3,
            name: '高级关卡',
            cards: [1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7],
            layout: [
                [1, 2, 3, 4, 5, 6, 7],
                [1, 2, 3, 4, 5, 6, 7],
                [1, 2, 3, 4, 5, 6, 7]
            ],
            requiredMatches: 3,
            maxStack: 7,
            timeLimit: 180 // 3分钟
        }
    ],

    // 多语言文本
    translations: {
        'zh-CN': {
            // 界面文本
            'gameTitle': '羊了个羊',
            'level': '关卡',
            'score': '分数',
            'time': '时间',
            'newGame': '新游戏',
            'restart': '重新开始',
            'hint': '提示',
            'undo': '撤销',
            'stackZone': '堆叠区',
            'eliminateZone': '消除区',
            'welcomeMessage': '点击卡片开始游戏！',
            'howToPlay': '游戏规则',
            'rulesTitle': '游戏规则：',
            'rule1': '点击选择3个相同的卡片进行消除',
            'rule2': '卡片必须顶层无遮挡才能选择',
            'rule3': '堆叠区最多存放7张卡片',
            'rule4': '消除区需要3张相同卡片',
            'rule5': '消除所有卡片即可通关',
            'nextLevel': '下一关',
            'tryAgain': '再试一次',
            'finalTime': '用时',
            'finalScore': '得分',
            
            // 游戏状态消息
            'selectCard': '选择卡片',
            'cardAddedToStack': '卡片已放入堆叠区',
            'matchFound': '找到匹配！消除成功',
            'stackFull': '堆叠区已满！',
            'noAvailableCards': '没有可用的卡片',
            'levelComplete': '恭喜！关卡完成',
            'gameOver': '游戏结束',
            'timeUp': '时间到！',
            
            // 结果消息
            'winTitle': '🎉 恭喜通关！',
            'winMessage': '你成功完成了第{level}关！',
            'loseTitle': '😢 游戏结束',
            'loseMessage': '再接再厉！'
        },
        
        'en': {
            'gameTitle': 'Sheep Link',
            'level': 'Level',
            'score': 'Score',
            'time': 'Time',
            'newGame': 'New Game',
            'restart': 'Restart',
            'hint': 'Hint',
            'undo': 'Undo',
            'stackZone': 'Stack Zone',
            'eliminateZone': 'Eliminate Zone',
            'welcomeMessage': 'Click a card to start!',
            'howToPlay': 'How to Play',
            'rulesTitle': 'Game Rules:',
            'rule1': 'Click 3 identical cards to eliminate them',
            'rule2': 'Cards must be on top with no cover',
            'rule3': 'Stack zone can hold up to 7 cards',
            'rule4': 'Eliminate zone requires 3 identical cards',
            'rule5': 'Eliminate all cards to pass the level',
            'nextLevel': 'Next Level',
            'tryAgain': 'Try Again',
            'finalTime': 'Time',
            'finalScore': 'Score',
            
            'selectCard': 'Select card',
            'cardAddedToStack': 'Card added to stack',
            'matchFound': 'Match found! Eliminated',
            'stackFull': 'Stack is full!',
            'noAvailableCards': 'No available cards',
            'levelComplete': 'Congratulations! Level complete',
            'gameOver': 'Game Over',
            'timeUp': 'Time\'s up!',
            
            'winTitle': '🎉 Congratulations!',
            'winMessage': 'You completed level {level}!',
            'loseTitle': '😢 Game Over',
            'loseMessage': 'Try again!'
        },
        
        'ja': {
            'gameTitle': '羊の羊',
            'level': 'レベル',
            'score': 'スコア',
            'time': '時間',
            'newGame': '新しいゲーム',
            'restart': '再開する',
            'hint': 'ヒント',
            'undo': '元に戻す',
            'stackZone': 'スタックゾーン',
            'eliminateZone': '消去ゾーン',
            'welcomeMessage': 'カードをクリックして開始！',
            'howToPlay': '遊び方',
            'rulesTitle': 'ゲームルール：',
            'rule1': '同じカードを3枚クリックして消去します',
            'rule2': 'カードは上にあり、覆われていない必要があります',
            'rule3': 'スタックゾーンには最大7枚のカードを保持できます',
            'rule4': '消去ゾーンには同じカードが3枚必要です',
            'rule5': 'すべてのカードを消去してレベルをクリアします',
            'nextLevel': '次のレベル',
            'tryAgain': '再挑戦',
            'finalTime': '時間',
            'finalScore': 'スコア',
            
            'selectCard': 'カードを選択',
            'cardAddedToStack': 'カードがスタックに追加されました',
            'matchFound': '一致しました！消去成功',
            'stackFull': 'スタックがいっぱいです！',
            'noAvailableCards': '利用可能なカードがありません',
            'levelComplete': 'おめでとうございます！レベルクリア',
            'gameOver': 'ゲームオーバー',
            'timeUp': '時間切れ！',
            
            'winTitle': '🎉 おめでとうございます！',
            'winMessage': 'レベル{level}をクリアしました！',
            'loseTitle': '😢 ゲームオーバー',
            'loseMessage': 'もう一度挑戦してください！'
        }
    }
};

// 导出配置
window.GameConfig = GameConfig;