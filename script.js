// Game state
let gameState = {
    stage: 'coin', // 'coin', 'twoDice', 'threeDice', 'complete'
    flipCount: 0,
    currentScore: 0,
    scoreHistory: [],
    isAnimating: false
};

// DOM elements
const coinButton = document.getElementById('coin-button');
const twoDiceButton = document.getElementById('two-dice-button');
const threeDiceButton = document.getElementById('three-dice-button');
const resetButton = document.getElementById('reset-button');
const coinDisplay = document.getElementById('coin-display');
const twoDiceDisplay = document.getElementById('two-dice-display');
const threeDiceDisplay = document.getElementById('three-dice-display');
const coinStatus = document.getElementById('coin-status');
const twoDiceStatus = document.getElementById('two-dice-status');
const threeDiceStatus = document.getElementById('three-dice-status');
const currentScoreEl = document.getElementById('current-score');
const scoreHistoryEl = document.getElementById('score-history');
const gamesPlayedEl = document.getElementById('games-played');
const averageScoreEl = document.getElementById('average-score');
const stage1Box = document.getElementById('stage-1');
const stage2Box = document.getElementById('stage-2');
const stage3Box = document.getElementById('stage-3');
const trackerHistoryEl = document.getElementById('tracker-history');
const cumulativeDiffEl = document.getElementById('cumulative-diff');
const averageDiffEl = document.getElementById('average-diff');
const progressStepsEl = document.getElementById('progress-steps');
const progressTotalEl = document.getElementById('progress-total');

// Expected value constant (at game start)
const EXPECTED_VALUE = 1.25;

// Progress tracking for current game
let progressSteps = [];

// Initialize the game
function init() {
    updateUI();
    initializeProgressTracker();
    
    coinButton.addEventListener('click', flipCoin);
    twoDiceButton.addEventListener('click', rollTwoDice);
    threeDiceButton.addEventListener('click', rollThreeDice);
    resetButton.addEventListener('click', resetGame);
}

// Initialize progress tracker for new game
function initializeProgressTracker() {
    progressSteps = [
        { step: 'Start', previous: 0, current: 1.25, status: 'completed' }
    ];
    updateProgressDisplay();
}

// Coin flip logic
function flipCoin() {
    if (gameState.isAnimating) return;
    
    gameState.isAnimating = true;
    gameState.flipCount++;
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    
    coinDisplay.innerHTML = `<div class="coin">${result.toUpperCase()}</div>`;
    
    setTimeout(() => {
        if (result === 'heads') {
            coinStatus.textContent = '✅ Heads! Unlocked Stage 2';
            coinStatus.style.color = '#28a745';
            stage1Box.classList.add('completed');
            stage1Box.classList.remove('active');
            
            // Add progress step - coin flip successful
            const prevExpected = progressSteps[progressSteps.length - 1].current;
            progressSteps.push({
                step: `Coin Flip (Heads)`,
                previous: prevExpected,
                current: 2.5, // After getting heads, expected value for rest of game is 2.5
                status: 'completed'
            });
            updateProgressDisplay();
            
            // Unlock stage 2
            gameState.stage = 'twoDice';
            stage2Box.classList.remove('locked');
            stage2Box.classList.add('active');
            twoDiceButton.disabled = false;
            coinButton.disabled = true;
            
            gameState.isAnimating = false;
        } else {
            coinStatus.textContent = '❌ Tails! Game restarted...';
            coinStatus.style.color = '#ef4444';
            
            setTimeout(() => {
                resetGame();
                gameState.isAnimating = false;
            }, 1500);
        }
        
        updateUI();
    }, 600);
}

// Two dice roll logic
function rollTwoDice() {
    if (gameState.isAnimating) return;
    
    gameState.isAnimating = true;
    
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const sum = die1 + die2;
    
    twoDiceDisplay.innerHTML = `
        <div class="die small" style="background: linear-gradient(145deg, #fafafa, #e5e5e5);">
            ${getDiceDots(die1)}
        </div>
        <div class="die small" style="background: linear-gradient(145deg, #fafafa, #e5e5e5);">
            ${getDiceDots(die2)}
        </div>
    `;
    
    setTimeout(() => {
        if (sum === 7) {
            twoDiceStatus.textContent = `🎲 ${die1} + ${die2} = 7! Game Reset!`;
            twoDiceStatus.style.color = '#ef4444';
            
            // Add progress step - rolled 7, game over
            const prevExpected = progressSteps[progressSteps.length - 1].current;
            progressSteps.push({
                step: `Two Dice (${die1}+${die2}=7) - Reset`,
                previous: prevExpected,
                current: 0, // Game ends, expected value goes to 0
                status: 'completed'
            });
            updateProgressDisplay();
            
            setTimeout(() => {
                resetGame();
                gameState.isAnimating = false;
            }, 2000);
        } else {
            twoDiceStatus.textContent = `✅ ${die1} + ${die2} = ${sum}! Stage 3 Unlocked`;
            twoDiceStatus.style.color = '#28a745';
            stage2Box.classList.add('completed');
            stage2Box.classList.remove('active');
            
            // Add progress step - successful two dice roll
            const prevExpected = progressSteps[progressSteps.length - 1].current;
            const newExpected = 3.0; // E[3 dice with new rules] = 3.0
            progressSteps.push({
                step: `Two Dice (${die1}+${die2}=${sum})`,
                previous: prevExpected,
                current: newExpected,
                status: 'completed'
            });
            updateProgressDisplay();
            
            // Unlock stage 3
            gameState.stage = 'threeDice';
            stage3Box.classList.remove('locked');
            stage3Box.classList.add('active');
            threeDiceButton.disabled = false;
            twoDiceButton.disabled = true;
            
            gameState.isAnimating = false;
        }
    }, 500);
}

// Three dice roll logic
function rollThreeDice() {
    if (gameState.isAnimating) return;
    
    gameState.isAnimating = true;
    
    const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    
    // Check if all even, all odd, or mixed
    const allEven = dice.every(d => d % 2 === 0);
    const allOdd = dice.every(d => d % 2 === 1);
    
    let score;
    let formula;
    
    if (allEven) {
        // All even: sum them all (positive)
        score = dice[0] + dice[1] + dice[2];
        formula = `${dice[0]} + ${dice[1]} + ${dice[2]} = ${score} (All Even)`;
    } else if (allOdd) {
        // All odd: sum them all and make negative
        score = -(dice[0] + dice[1] + dice[2]);
        formula = `-(${dice[0]} + ${dice[1]} + ${dice[2]}) = ${score} (All Odd)`;
    } else {
        // Mixed: first - second + third
        score = dice[0] - dice[1] + dice[2];
        formula = `${dice[0]} - ${dice[1]} + ${dice[2]} = ${score} (Mixed)`;
    }
    
    let diceHTML = '';
    
    dice.forEach((die, index) => {
        let dieClass = '';
        if (allEven) {
            dieClass = 'positive'; // All green
        } else if (allOdd) {
            dieClass = 'negative'; // All red
        } else {
            // Mixed: first and third green, second red
            dieClass = (index === 0 || index === 2) ? 'positive' : 'negative';
        }
        
        diceHTML += `<div class="die small ${dieClass}">${getDiceDots(die)}</div>`;
    });
    
    threeDiceDisplay.innerHTML = diceHTML;
    gameState.currentScore = score;
    
    // Add progress steps for each die
    const prevExpected = progressSteps[progressSteps.length - 1].current;
    
    if (allEven || allOdd) {
        // For all even or all odd, show as single step
        progressSteps.push({
            step: allEven ? `All Even: ${dice.join('+')}` : `All Odd: -(${dice.join('+')})`,
            previous: prevExpected,
            current: score,
            status: 'completed'
        });
    } else {
        // For mixed, show each die
        // Die 1 (positive)
        progressSteps.push({
            step: `Die 1: +${dice[0]}`,
            previous: prevExpected,
            current: dice[0] - 3.5 + 3.5,
            status: 'completed'
        });
        
        // Die 2 (negative)
        const afterDie1 = progressSteps[progressSteps.length - 1].current;
        progressSteps.push({
            step: `Die 2: -${dice[1]}`,
            previous: afterDie1,
            current: dice[0] - dice[1] + 3.5,
            status: 'completed'
        });
        
        // Die 3 (positive)
        const afterDie2 = progressSteps[progressSteps.length - 1].current;
        progressSteps.push({
            step: `Die 3: +${dice[2]}`,
            previous: afterDie2,
            current: score,
            status: 'completed'
        });
    }
    
    updateProgressDisplay();
    
    setTimeout(() => {
        threeDiceStatus.innerHTML = `🎯 ${formula}`;
        threeDiceStatus.style.color = score >= 0 ? '#28a745' : '#ef4444';
        
        stage3Box.classList.add('completed');
        stage3Box.classList.remove('active');
        threeDiceButton.disabled = true;
        
        // Add to history
        gameState.scoreHistory.push({
            score: score,
            timestamp: new Date().toLocaleTimeString()
        });
        
        updateScoreHistory();
        updateExpectedTracker();
        
        gameState.stage = 'complete';
        updateUI();
        gameState.isAnimating = false;
    }, 500);
}

// Generate dice dots based on value
function getDiceDots(value) {
    const dotPatterns = {
        1: '<span class="dot dot-1"></span>',
        2: '<span class="dot dot-2a"></span><span class="dot dot-2b"></span>',
        3: '<span class="dot dot-3a"></span><span class="dot dot-3b"></span><span class="dot dot-3c"></span>',
        4: '<span class="dot dot-4a"></span><span class="dot dot-4b"></span><span class="dot dot-4c"></span><span class="dot dot-4d"></span>',
        5: '<span class="dot dot-5a"></span><span class="dot dot-5b"></span><span class="dot dot-5c"></span><span class="dot dot-5d"></span><span class="dot dot-5e"></span>',
        6: '<span class="dot dot-6a"></span><span class="dot dot-6b"></span><span class="dot dot-6c"></span><span class="dot dot-6d"></span><span class="dot dot-6e"></span><span class="dot dot-6f"></span>'
    };
    return dotPatterns[value];
}

// Reset game
function resetGame() {
    coinDisplay.innerHTML = '';
    twoDiceDisplay.innerHTML = '';
    threeDiceDisplay.innerHTML = '';
    coinStatus.textContent = '';
    twoDiceStatus.textContent = '';
    threeDiceStatus.textContent = '';
    
    gameState.stage = 'coin';
    gameState.flipCount = 0;
    gameState.currentScore = 0;
    gameState.isAnimating = false;
    
    // Reset stage boxes
    stage1Box.classList.remove('completed', 'locked');
    stage1Box.classList.add('active');
    stage2Box.classList.add('locked');
    stage2Box.classList.remove('active', 'completed');
    stage3Box.classList.add('locked');
    stage3Box.classList.remove('active', 'completed');
    
    // Reset buttons
    coinButton.disabled = false;
    twoDiceButton.disabled = true;
    threeDiceButton.disabled = true;
    
    // Reset progress tracker
    initializeProgressTracker();
    
    updateUI();
}

// Update progress display
function updateProgressDisplay() {
    progressStepsEl.innerHTML = progressSteps.map((step, index) => {
        const change = step.current - step.previous;
        let changeClass = 'neutral';
        let changeText = '0.00';
        
        if (change > 0) {
            changeClass = 'increase';
            changeText = '+' + change.toFixed(2);
        } else if (change < 0) {
            changeClass = 'decrease';
            changeText = change.toFixed(2);
        }
        
        const rowClass = index === progressSteps.length - 1 ? 'active' : 'completed';
        
        return `
            <div class="progress-row ${rowClass}">
                <div class="step-name">${step.step}</div>
                <div class="expected-val">${step.previous.toFixed(2)}</div>
                <div class="expected-val">${step.current.toFixed(2)}</div>
                <div class="change-val ${changeClass}">${changeText}</div>
            </div>
        `;
    }).join('');
    
    // Add total row
    if (progressSteps.length > 0) {
        const finalExpected = progressSteps[progressSteps.length - 1].current;
        const totalChange = finalExpected - progressSteps[0].current;
        const changeClass = totalChange >= 0 ? 'increase' : 'decrease';
        const changeText = totalChange >= 0 ? '+' + totalChange.toFixed(2) : totalChange.toFixed(2);
        
        progressTotalEl.innerHTML = `
            <div class="progress-row total-row">
                <div class="step-name"><strong>Total</strong></div>
                <div class="expected-val"><strong>${progressSteps[0].current.toFixed(2)}</strong></div>
                <div class="expected-val"><strong>${finalExpected.toFixed(2)}</strong></div>
                <div class="change-val ${changeClass}"><strong>${changeText}</strong></div>
            </div>
        `;
    }
}

// Update UI based on game state
function updateUI() {
    currentScoreEl.textContent = gameState.currentScore;
}

// Update score history display
function updateScoreHistory() {
    const history = gameState.scoreHistory;
    
    scoreHistoryEl.innerHTML = history.map((entry, index) => `
        <div class="score-entry ${entry.score >= 0 ? 'positive' : 'negative'}">
            <div>
                <strong>Game ${index + 1}</strong> - ${entry.timestamp}
            </div>
            <div class="score-value ${entry.score >= 0 ? 'positive' : 'negative'}">
                ${entry.score >= 0 ? '+' : ''}${entry.score}
            </div>
        </div>
    `).reverse().join('');
    
    gamesPlayedEl.textContent = history.length;
    
    if (history.length > 0) {
        const average = history.reduce((sum, entry) => sum + entry.score, 0) / history.length;
        averageScoreEl.textContent = average.toFixed(2);
    }
}

// Update expected value tracker
function updateExpectedTracker() {
    const history = gameState.scoreHistory;
    
    trackerHistoryEl.innerHTML = history.map((entry, index) => {
        const difference = entry.score - EXPECTED_VALUE;
        const diffClass = difference >= 0 ? 'positive' : 'negative';
        const diffSign = difference >= 0 ? '+' : '';
        
        return `
            <div class="tracker-row">
                <div class="game-num">${index + 1}</div>
                <div class="actual-score">${entry.score}</div>
                <div class="expected-score">${EXPECTED_VALUE.toFixed(2)}</div>
                <div class="difference ${diffClass}">${diffSign}${difference.toFixed(2)}</div>
            </div>
        `;
    }).reverse().join('');
    
    if (history.length > 0) {
        // Calculate cumulative difference
        const cumulativeDiff = history.reduce((sum, entry) => sum + (entry.score - EXPECTED_VALUE), 0);
        const avgDiff = cumulativeDiff / history.length;
        
        cumulativeDiffEl.textContent = (cumulativeDiff >= 0 ? '+' : '') + cumulativeDiff.toFixed(2);
        cumulativeDiffEl.style.color = cumulativeDiff >= 0 ? '#22c55e' : '#ef4444';
        
        averageDiffEl.textContent = (avgDiff >= 0 ? '+' : '') + avgDiff.toFixed(2);
        averageDiffEl.style.color = avgDiff >= 0 ? '#22c55e' : '#ef4444';
    } else {
        cumulativeDiffEl.textContent = '0.00';
        cumulativeDiffEl.style.color = '#ff69b4';
        averageDiffEl.textContent = '0.00';
        averageDiffEl.style.color = '#ff69b4';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
