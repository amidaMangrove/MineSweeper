class Minesweeper {
    constructor() {
        this.board = [];
        this.gameState = 'title'; // title, ready, playing, won, lost
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;
        
        // 難易度設定
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 },
            expert: { rows: 24, cols: 30, mines: 180 }
        };
        
        this.currentDifficulty = 'easy';
        this.settings = this.difficulties[this.currentDifficulty];
        
        this.initializeElements();
        this.setupEventListeners();
        this.showTitleScreen();
    }
    
    initializeElements() {
        this.titleScreen = document.getElementById('title-screen');
        this.gameContainer = document.getElementById('game-container');
        this.startBtn = document.getElementById('start-game');
        this.difficultyCards = document.querySelectorAll('.difficulty-card');
        this.backToTitleBtn = document.getElementById('back-to-title-btn');
        
        this.gameBoard = document.getElementById('game-board');
        this.mineCountDisplay = document.getElementById('mine-count');
        this.timerDisplay = document.getElementById('timer');
        this.resetBtn = document.getElementById('reset-btn');
        this.modal = document.getElementById('game-over-modal');
        this.gameResult = document.getElementById('game-result');
        this.gameMessage = document.getElementById('game-message');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.backToTitleBtn.addEventListener('click', () => this.showTitleScreen());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.newGameBtn.addEventListener('click', () => this.closeModal());
        
        // タイトル画面の難易度選択
        this.difficultyCards.forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectDifficultyCard(e.currentTarget);
            });
        });
        
        // ゲーム画面の難易度選択
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeDifficulty(e.target.dataset.difficulty);
            });
        });
        
        // 右クリック無効化
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'playing' || this.gameState === 'ready') {
                    this.resetGame();
                }
            }
            if (e.key === 'Escape') {
                if (this.gameState !== 'title') {
                    this.showTitleScreen();
                }
            }
        });
    }
    
    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.settings = this.difficulties[difficulty];
        
        // ボタンのactive状態を更新
        this.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        
        this.resetGame();
    }
    
    initializeGame() {
        this.gameState = 'ready';
        this.timer = 0;
        this.firstClick = true;
        this.flaggedCells = 0;
        
        this.createBoard();
        this.renderBoard();
        this.updateDisplay();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.settings.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.settings.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.settings.mines) {
            const row = Math.floor(Math.random() * this.settings.rows);
            const col = Math.floor(Math.random() * this.settings.cols);
            
            // 最初のクリック位置とその周囲には地雷を置かない
            if (Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1) {
                continue;
            }
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let row = 0; row < this.settings.rows; row++) {
            for (let col = 0; col < this.settings.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.settings.rows && 
                    c >= 0 && c < this.settings.cols && 
                    this.board[r][c].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.settings.cols}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.settings.rows}, 1fr)`;
        
        for (let row = 0; row < this.settings.rows; row++) {
            for (let col = 0; col < this.settings.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleCellClick(e) {
        if (this.gameState === 'won' || this.gameState === 'lost' || this.gameState === 'title') {
            return;
        }
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isFlagged || cell.isRevealed) {
            return;
        }
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.gameState = 'playing';
            this.startTimer();
        }
        
        if (cell.isMine) {
            this.gameOver(false, row, col);
        } else {
            this.revealCell(row, col);
            this.checkWinCondition();
        }
        
        this.updateDisplay();
    }
    
    handleRightClick(e) {
        e.preventDefault();
        
        if (this.gameState === 'won' || this.gameState === 'lost' || this.gameState === 'title') {
            return;
        }
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed) {
            return;
        }
        
        cell.isFlagged = !cell.isFlagged;
        this.flaggedCells += cell.isFlagged ? 1 : -1;
        
        this.updateDisplay();
    }
    
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }
        
        cell.isRevealed = true;
        
        // セル開示エフェクト
        this.createRevealEffect(row, col);
        
        // 周囲に地雷がない場合、隣接セルも自動的に開く
        if (cell.neighborMines === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < this.settings.rows && 
                        c >= 0 && c < this.settings.cols) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
    }
    
    createRevealEffect(row, col) {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cellElement) return;
        
        // パーティクルエフェクト
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            const rect = cellElement.getBoundingClientRect();
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / 5;
            const velocity = 50 + Math.random() * 30;
            const deltaX = Math.cos(angle) * velocity;
            const deltaY = Math.sin(angle) * velocity;
            
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${deltaX}px, ${deltaY}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }
    
    checkWinCondition() {
        let revealedCount = 0;
        for (let row = 0; row < this.settings.rows; row++) {
            for (let col = 0; col < this.settings.cols; col++) {
                if (this.board[row][col].isRevealed) {
                    revealedCount++;
                }
            }
        }
        
        const totalCells = this.settings.rows * this.settings.cols;
        if (revealedCount === totalCells - this.settings.mines) {
            this.gameOver(true);
        }
    }
    
    gameOver(won, mineRow = -1, mineCol = -1) {
        this.gameState = won ? 'won' : 'lost';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // すべての地雷を表示
        for (let row = 0; row < this.settings.rows; row++) {
            for (let col = 0; col < this.settings.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
        
        this.updateDisplay();
        
        // 爆発アニメーション
        if (!won && mineRow >= 0 && mineCol >= 0) {
            const triggeredCell = document.querySelector(`[data-row="${mineRow}"][data-col="${mineCol}"]`);
            if (triggeredCell) {
                triggeredCell.classList.add('mine-triggered');
                this.createExplosionEffect(mineRow, mineCol);
            }
        } else if (won) {
            this.createWinEffect();
        }
        
        // モーダル表示
        setTimeout(() => {
            this.showGameOverModal(won);
        }, 500);
        
        // リセットボタンの表情変更
        this.resetBtn.textContent = won ? '😎' : '😵';
    }
    
    createExplosionEffect(row, col) {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cellElement) return;
        
        // 爆発パーティクル
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = `hsl(${Math.random() * 60}, 100%, 50%)`; // 赤〜オレンジ
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.boxShadow = '0 0 10px currentColor';
            
            const rect = cellElement.getBoundingClientRect();
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 80 + Math.random() * 60;
            const deltaX = Math.cos(angle) * velocity;
            const deltaY = Math.sin(angle) * velocity;
            
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${deltaX}px, ${deltaY + 100}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                document.body.removeChild(particle);
            };
        }
    }
    
    createWinEffect() {
        // 勝利時の花火エフェクト
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.position = 'fixed';
                particle.style.width = '6px';
                particle.style.height = '6px';
                particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
                particle.style.borderRadius = '50%';
                particle.style.pointerEvents = 'none';
                particle.style.zIndex = '1000';
                particle.style.boxShadow = '0 0 10px currentColor';
                
                particle.style.left = `${Math.random() * window.innerWidth}px`;
                particle.style.top = `${Math.random() * window.innerHeight}px`;
                
                document.body.appendChild(particle);
                
                particle.animate([
                    { 
                        transform: 'scale(0)',
                        opacity: 0
                    },
                    { 
                        transform: 'scale(1)',
                        opacity: 1
                    },
                    { 
                        transform: 'scale(0)',
                        opacity: 0
                    }
                ], {
                    duration: 2000,
                    easing: 'ease-in-out'
                }).onfinish = () => {
                    document.body.removeChild(particle);
                };
            }, i * 50);
        }
    }
    
    showGameOverModal(won) {
        this.gameResult.textContent = won ? '🎉 クリア！' : '💥 ゲームオーバー';
        this.gameMessage.textContent = won ? 
            `おめでとうございます！時間: ${this.timer}秒` : 
            '地雷を踏んでしまいました...';
        this.modal.classList.remove('hidden');
    }
    
    closeModal() {
        this.modal.classList.add('hidden');
        this.resetGame();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    
    updateDisplay() {
        // 残り地雷数表示
        const remainingMines = this.settings.mines - this.flaggedCells;
        this.mineCountDisplay.textContent = remainingMines.toString().padStart(3, '0');
        
        // タイマー表示
        this.timerDisplay.textContent = this.timer.toString().padStart(3, '0');
        
        // ボードの更新
        for (let row = 0; row < this.settings.rows; row++) {
            for (let col = 0; col < this.settings.cols; col++) {
                const cell = this.board[row][col];
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                
                // クラスをリセット
                cellElement.className = 'cell';
                cellElement.textContent = '';
                
                if (cell.isFlagged) {
                    cellElement.classList.add('flagged');
                    cellElement.textContent = '🚩';
                } else if (cell.isRevealed) {
                    cellElement.classList.add('revealed');
                    
                    if (cell.isMine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellElement.textContent = cell.neighborMines;
                        cellElement.dataset.count = cell.neighborMines;
                    }
                }
            }
        }
    }
    
    resetGame() {
        this.resetBtn.textContent = '🙂';
        this.initializeGame();
    }
    
    showTitleScreen() {
        this.gameState = 'title';
        this.titleScreen.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        this.modal.classList.add('hidden');
        
        // タイトル画面のアニメーション
        this.titleScreen.style.opacity = '0';
        setTimeout(() => {
            this.titleScreen.style.transition = 'opacity 0.5s ease';
            this.titleScreen.style.opacity = '1';
        }, 100);
        
        // 現在選択されている難易度をハイライト
        this.updateDifficultyCards();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    startGame() {
        this.gameState = 'ready';
        this.titleScreen.style.display = 'none';
        this.gameContainer.style.display = 'block';
        
        // ゲーム画面のアニメーション
        this.gameContainer.style.opacity = '0';
        setTimeout(() => {
            this.gameContainer.style.transition = 'opacity 0.5s ease';
            this.gameContainer.style.opacity = '1';
        }, 100);
        
        this.initializeGame();
    }
    
    selectDifficultyCard(card) {
        // 他のカードの選択を解除
        this.difficultyCards.forEach(c => c.classList.remove('selected'));
        
        // 選択されたカードをハイライト
        card.classList.add('selected');
        
        // 難易度を設定
        const difficulty = card.dataset.difficulty;
        this.currentDifficulty = difficulty;
        this.settings = this.difficulties[difficulty];
        
        // カードクリックアニメーション
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }
    
    updateDifficultyCards() {
        this.difficultyCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.difficulty === this.currentDifficulty);
        });
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
