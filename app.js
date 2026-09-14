class BadmintonScorer {
    constructor() {
        this.gameState = {
            player1: { name: 'Player 1', score: 0, setsWon: 0 },
            player2: { name: 'Player 2', score: 0, setsWon: 0 },
            pointsToWin: 21,
            currentSet: 1,
            gameActive: false,
            history: [],
            startTime: null,
            gameTime: 0
        };

        this.history = [];
        this.timerInterval = null;

        this.loadState();
        this.initializeEventListeners();
    }

    saveState() {
        localStorage.setItem('badmintonGame', JSON.stringify(this.gameState));
    }

    loadState() {
        const saved = localStorage.getItem('badmintonGame');
        if (saved) {
            try {
                this.gameState = JSON.parse(saved);
            } catch (e) {
                console.log('Fresh start');
            }
        }
    }

    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('p1Plus').addEventListener('click', () => this.addPoint(1));
        document.getElementById('p1Minus').addEventListener('click', () => this.subtractPoint(1));
        document.getElementById('p2Plus').addEventListener('click', () => this.addPoint(2));
        document.getElementById('p2Minus').addEventListener('click', () => this.subtractPoint(2));
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('nextSetBtn').addEventListener('click', () => this.nextSet());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
    }

    startGame() {
        const player1 = document.getElementById('player1').value.trim() || 'Player 1';
        const player2 = document.getElementById('player2').value.trim() || 'Player 2';
        const pointsToWin = parseInt(document.getElementById('winPoints').value);

        this.gameState = {
            player1: { name: player1, score: 0, setsWon: 0 },
            player2: { name: player2, score: 0, setsWon: 0 },
            pointsToWin,
            currentSet: 1,
            gameActive: true,
            history: [],
            startTime: Date.now(),
            gameTime: 0
        };

        this.history = [];
        this.saveState();
        this.render();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.gameState.gameTime = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.gameState.gameTime / 60);
        const seconds = this.gameState.gameTime % 60;
        document.getElementById('gameTime').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    addPoint(player) {
        if (!this.gameState.gameActive) return;

        this.history.push(JSON.parse(JSON.stringify(this.gameState)));

        if (player === 1) {
            this.gameState.player1.score++;
        } else {
            this.gameState.player2.score++;
        }

        this.checkSetWinner();
        this.saveState();
        this.render();
    }

    subtractPoint(player) {
        if (!this.gameState.gameActive) return;

        const currentScore = player === 1 ? 
            this.gameState.player1.score : 
            this.gameState.player2.score;

        if (currentScore > 0) {
            this.history.push(JSON.parse(JSON.stringify(this.gameState)));

            if (player === 1) {
                this.gameState.player1.score--;
            } else {
                this.gameState.player2.score--;
            }

            this.saveState();
            this.render();
        }
    }

    checkSetWinner() {
        const p1 = this.gameState.player1.score;
        const p2 = this.gameState.player2.score;
        const pointsToWin = this.gameState.pointsToWin;

        if (p1 >= pointsToWin && p1 - p2 >= 2) {
            this.setWinner(1);
        } else if (p2 >= pointsToWin && p2 - p1 >= 2) {
            this.setWinner(2);
        }
    }

    setWinner(player) {
        if (player === 1) {
            this.gameState.player1.setsWon++;
        } else {
            this.gameState.player2.setsWon++;
        }

        this.gameState.gameActive = false;
        this.saveState();
        this.render();
    }

    nextSet() {
        if (!this.gameState.gameActive && 
            (this.gameState.player1.setsWon + this.gameState.player2.setsWon) < 3) {
            
            this.gameState.currentSet++;
            this.gameState.player1.score = 0;
            this.gameState.player2.score = 0;
            this.gameState.gameActive = true;
            this.history = [];

            this.saveState();
            this.render();
        }
    }

    undo() {
        if (this.history.length > 0) {
            this.gameState = this.history.pop();
            this.saveState();
            this.render();
        }
    }

    endGame() {
        if (confirm('Are you sure you want to end the game?')) {
            clearInterval(this.timerInterval);
            this.gameState.gameActive = false;
            this.saveState();
            this.render();
        }
    }

    resetGame() {
        localStorage.removeItem('badmintonGame');
        this.gameState = {
            player1: { name: 'Player 1', score: 0, setsWon: 0 },
            player2: { name: 'Player 2', score: 0, setsWon: 0 },
            pointsToWin: 21,
            currentSet: 1,
            gameActive: false,
            history: [],
            startTime: null,
            gameTime: 0
        };
        this.history = [];
        clearInterval(this.timerInterval);
        this.render();
    }

    getServe() {
        const totalPoints = this.gameState.player1.score + this.gameState.player2.score;
        
        if (this.gameState.player1.score >= 20 && this.gameState.player2.score >= 20) {
            return (totalPoints % 2 === 0) ? 1 : 2;
        }
        
        return (Math.floor(totalPoints / 2) % 2 === 0) ? 1 : 2;
    }

    render() {
        const gameActive = this.gameState.gameActive;
        const p1SetsWon = this.gameState.player1.setsWon;
        const p2SetsWon = this.gameState.player2.setsWon;
        const isGameOver = this.isGameOver();

        document.getElementById('gameSetup').classList.toggle('hidden', gameActive || isGameOver);
        document.getElementById('scoreboard').classList.toggle('hidden', !gameActive && !isGameOver);
        document.getElementById('matchHistory').classList.toggle('hidden', !isGameOver);

        if (!gameActive && !isGameOver) return;

        document.getElementById('matchTitle').textContent = 
            `${this.gameState.player1.name} vs ${this.gameState.player2.name}`;
        document.getElementById('currentSet').textContent = this.gameState.currentSet;

        document.getElementById('p1Name').textContent = this.gameState.player1.name;
        document.getElementById('p1Score').textContent = this.gameState.player1.score;
        document.getElementById('p2Name').textContent = this.gameState.player2.name;
        document.getElementById('p2Score').textContent = this.gameState.player2.score;

        const serve = this.getServe();
        document.getElementById('serveIndicator').textContent = 
            serve === 1 ? this.gameState.player1.name : this.gameState.player2.name;

        const totalPoints = this.gameState.player1.score + this.gameState.player2.score;
        document.getElementById('rallyCount').textContent = totalPoints;

        this.updateGameStatus();

        const nextSetBtn = document.getElementById('nextSetBtn');
        const isSetWon = !this.gameState.gameActive && 
                        (p1SetsWon + p2SetsWon) < 3;
        nextSetBtn.classList.toggle('hidden', !isSetWon);

        if (isGameOver) {
            this.showMatchSummary();
        }
    }

    updateGameStatus() {
        const status = document.getElementById('gameStatus');
        const p1 = this.gameState.player1.score;
        const p2 = this.gameState.player2.score;
        const pointsToWin = this.gameState.pointsToWin;

        if (!this.gameState.gameActive) {
            if (p1 >= pointsToWin && p1 - p2 >= 2) {
                status.textContent = `🎉 ${this.gameState.player1.name} wins Set ${this.gameState.currentSet}!`;
                status.classList.add('winner');
            } else if (p2 >= pointsToWin && p2 - p1 >= 2) {
                status.textContent = `🎉 ${this.gameState.player2.name} wins Set ${this.gameState.currentSet}!`;
                status.classList.add('winner');
            }
        } else {
            status.classList.remove('winner');
            
            if (p1 >= pointsToWin - 2 || p2 >= pointsToWin - 2) {
                status.textContent = 'Close match! 🔥';
            } else if (p1 > p2 + 5) {
                status.textContent = `${this.gameState.player1.name} is leading`;
            } else if (p2 > p1 + 5) {
                status.textContent = `${this.gameState.player2.name} is leading`;
            } else {
                status.textContent = 'Evenly matched! 💪';
            }
        }
    }

    isGameOver() {
        return (this.gameState.player1.setsWon >= 2 || this.gameState.player2.setsWon >= 2) 
            && !this.gameState.gameActive;
    }

    showMatchSummary() {
        const summaryContent = document.getElementById('summaryContent');
        const p1 = this.gameState.player1;
        const p2 = this.gameState.player2;

        let winner = p1.setsWon > p2.setsWon ? p1.name : p2.name;
        const minutes = Math.floor(this.gameState.gameTime / 60);
        const seconds = this.gameState.gameTime % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        summaryContent.innerHTML = `
            <p class="winner">${winner} Wins! 🏆</p>
            <p><strong>${p1.name}</strong> - ${p1.setsWon} set${p1.setsWon !== 1 ? 's' : ''}</p>
            <p><strong>${p2.name}</strong> - ${p2.setsWon} set${p2.setsWon !== 1 ? 's' : ''}</p>
            <p class="sets-info">Match Duration: ${duration}</p>
        `;
    }
}

let scorer;
document.addEventListener('DOMContentLoaded', () => {
    scorer = new BadmintonScorer();
    const setupSection = document.querySelector('.game-setup');
    if (!setupSection.id) {
        setupSection.id = 'gameSetup';
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}