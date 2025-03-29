// Moved all JavaScript from HTML to this file
import { CONFIG } from './config.js';

let currentRound = 1;
let totalRounds;
let sequence;
let currentNumber;
let isGameOver = false;
let lastGeneratedNumber = null; // Track last generated number

const sequenceContainer = document.getElementById('sequence-container');
const currentRoundEl = document.getElementById('current-round');
const newNumberBoxEl = document.getElementById('new-number-box');
const messagesEl = document.getElementById('messages');
const currentLevelEl = document.getElementById('current-level');
const numberOddsEl = document.getElementById('number-odds');
const nextLevelBtn = document.getElementById('next-level-btn');
const restartBtn = document.getElementById('restart-btn');

// Null checks for critical elements
if (!sequenceContainer || !currentRoundEl || !newNumberBoxEl || !messagesEl || 
    !currentLevelEl || !numberOddsEl || !nextLevelBtn || !restartBtn) {
    console.error('One or more critical game elements are missing');
}

let currentLevel = 1;
let currentLevelConfig;

function initializeLevel() {
    currentLevelConfig = CONFIG.LEVEL_CONFIG.find(level => level.level === currentLevel);
    if (!currentLevelConfig) {
        currentLevelConfig = CONFIG.LEVEL_CONFIG[CONFIG.LEVEL_CONFIG.length - 1];
    }
    totalRounds = currentLevelConfig.rounds;
    sequence = new Array(currentLevelConfig.slots).fill(null);
}

function generateNewNumber() {
    const currentMax = 2 * currentRound;
    const nextMax = 2 * (currentRound + 1);
    if (numberOddsEl) {
        numberOddsEl.textContent = `Next number will be between 1-${nextMax}`;
    }
    let newNumber;
    do {
        newNumber = Math.floor(Math.random() * currentMax) + 1;
    } while (newNumber === lastGeneratedNumber && currentMax > 1);
    lastGeneratedNumber = newNumber;
    return newNumber;
}

function renderSequence() {
    if (!sequenceContainer) return;

    sequenceContainer.innerHTML = '';

    if (currentRound <= totalRounds) {
        currentNumber = generateNewNumber();
        if (newNumberBoxEl) {
            newNumberBoxEl.textContent = currentNumber;
        }
    } else if (newNumberBoxEl) {
        newNumberBoxEl.textContent = '';
    }
    
    updateProgressIndicator();
    
    for (let i = 0; i < currentLevelConfig.slots; i++) {
        if (sequence[i] !== null && sequence[i] !== undefined) {
            const numberBox = document.createElement('div');
            numberBox.className = 'number-box filled';
            numberBox.textContent = sequence[i];
            sequenceContainer.appendChild(numberBox);
        } else {
            const insertionPoint = document.createElement('div');
            insertionPoint.className = 'insertion-point';
            if (!isGameOver) {
                insertionPoint.addEventListener('click', () => handleInsertion(i));
            }
            sequenceContainer.appendChild(insertionPoint);
        }
    }

    if (currentRoundEl) {
        currentRoundEl.textContent = `Round: ${currentRound}/${totalRounds}`;
    }
    if (currentLevelEl) {
        currentLevelEl.textContent = `Level: ${currentLevel}`;
    }
}

function updateGameContainerSize() {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;

    const insertionPointWidth = 70;  
    const insertionPointMargin = 10;  
    const containerPadding = 2 * 24;  
    const sequencePadding = 2 * 15;  
    const sequenceGap = 5;  

    const sequenceWidth = (insertionPointWidth + insertionPointMargin) * currentLevelConfig.slots + sequenceGap * (currentLevelConfig.slots - 1) + sequencePadding;
    const sequenceHeight = 150 + sequencePadding;  

    const gameInfoTop = document.querySelector('.game-info-top');
    const progressInfo = document.querySelector('.progress-info');
    const logoContainer = document.querySelector('.logo-container');
    const messages = document.querySelector('#messages');
    const nextLevelBtnEl = document.querySelector('#next-level-btn');
    const restartBtnEl = document.querySelector('#restart-btn');
    const numberBoxEl = document.querySelector('#new-number-box');
    
    if (!gameInfoTop || !progressInfo || !logoContainer || !messages) return;

    const gameContainerWidth = sequenceWidth + containerPadding;
    
    // Calculate needed height based on visible elements
    let gameContainerHeight = containerPadding;
    gameContainerHeight += logoContainer.offsetHeight;
    
    // Add height for visible game info elements
    if (gameInfoTop) {
        // Only count children that are visible
        Array.from(gameInfoTop.children).forEach(child => {
            // Special handling for new-number-box - check display style explicitly
            if (child.id === 'new-number-box') {
                if (window.getComputedStyle(child).display !== 'none') {
                    gameContainerHeight += child.offsetHeight;
                }
            } else if (window.getComputedStyle(child).display !== 'none') {
                gameContainerHeight += child.offsetHeight;
            }
        });
    }
    
    gameContainerHeight += sequenceHeight;
    
    if (progressInfo) gameContainerHeight += progressInfo.offsetHeight;
    
    // Add message height only if it has content
    if (messages && messages.textContent.trim()) {
        gameContainerHeight += messages.offsetHeight;
    }
    
    // Add visible button height
    if (nextLevelBtnEl && window.getComputedStyle(nextLevelBtnEl).display !== 'none') {
        gameContainerHeight += nextLevelBtnEl.offsetHeight;
    } else if (restartBtnEl && window.getComputedStyle(restartBtnEl).display !== 'none') {
        gameContainerHeight += restartBtnEl.offsetHeight;
    }
    
    // Add extra padding for spacing
    gameContainerHeight += 120; // Increased from 80 to 120 for more space at bottom

    gameContainer.style.width = `${gameContainerWidth}px`;
    gameContainer.style.height = `${gameContainerHeight}px`;
}

function handleInsertion(position) {
    if (isGameOver || sequence[position] !== null && sequence[position] !== undefined) return;

    sequence[position] = currentNumber;
    
    if (!checkSorted()) {
        isGameOver = true;
        showMessage('Game Over! Wrong placement', 'error');
        if (sequenceContainer) {
            sequenceContainer.classList.add('shaking');
        }
        if (nextLevelBtn) nextLevelBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'inline-block';
        return;
    }

    currentRound++;

    if (currentRound > totalRounds) {
        sequence[position] = currentNumber;
        renderSequence();
        isGameOver = true;
        if (nextLevelBtn) nextLevelBtn.style.display = 'inline-block';
        if (restartBtn) restartBtn.style.display = 'none';
        showMessage(`Level ${currentLevel} Complete!\n_________________________`, 'success');
        return;
    }

    renderSequence();
}

function checkSorted() {
    const numbers = sequence.filter(n => n !== null && n !== undefined);
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i - 1] > numbers[i]) return false;
    }
    return true;
}

function showMessage(text, type) {
    if (messagesEl) {
        messagesEl.textContent = text;
        messagesEl.className = type;
        if (sequenceContainer) {
            sequenceContainer.classList.remove('shaking');
        }
    }
}

function updateProgressIndicator() {
    let progressIndicator = document.querySelector('.progress-indicator');
    
    if (!progressIndicator) {
        progressIndicator = document.createElement('div');
        progressIndicator.className = 'progress-indicator';
        document.querySelector('.game-container').appendChild(progressIndicator);
    }
    
    // Calculate progress percentage (0-100%)
    const totalLevels = CONFIG.LEVEL_CONFIG.length;
    const progressPercentage = ((currentLevel - 1) / totalLevels) * 100;
    
    // Fill the container based on current level
    progressIndicator.style.setProperty('--liquid-height', `${progressPercentage}%`);
    
    // Apply the height to the pseudo-element
    progressIndicator.style.setProperty('--liquid-height', `${progressPercentage}%`);
    progressIndicator.setAttribute('data-level', currentLevel);
    progressIndicator.setAttribute('data-max-level', totalLevels);
    
    // Apply the height through CSS variable
    document.documentElement.style.setProperty('--liquid-height', `${progressPercentage}%`);
    
    // Set the pseudo-element height directly with inline styles
    if (progressIndicator.style.setProperty) {
        // For modern browsers
        document.documentElement.style.setProperty('--liquid-height', `${progressPercentage}%`);
    } else {
        // Fallback for older browsers
        progressIndicator.querySelector('::after').style.height = `${progressPercentage}%`;
    }
    
    // Apply directly to the element using inline style as a fallback
    progressIndicator.style.backgroundSize = `100% ${10 + progressPercentage/10}px`;
}

nextLevelBtn.addEventListener('click', () => {
    currentLevel++;
    currentRound = 1;
    lastGeneratedNumber = null; 
    initializeLevel();
    isGameOver = false;
    if (messagesEl) {
        messagesEl.textContent = '';
        messagesEl.className = '';
    }
    if (sequenceContainer) {
        sequenceContainer.classList.remove('shaking');
    }
    if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    if (numberOddsEl) {
        numberOddsEl.classList.remove('hide-smooth');
        numberOddsEl.style.display = 'block';
    }
    renderSequence();
    updateGameContainerSize();
});

restartBtn.addEventListener('click', () => {
    currentRound = 1;
    lastGeneratedNumber = null; 
    initializeLevel();
    isGameOver = false;
    if (messagesEl) {
        messagesEl.textContent = '';
        messagesEl.className = '';
    }
    if (sequenceContainer) {
        sequenceContainer.classList.remove('shaking');
    }
    if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    if (numberOddsEl) {
        numberOddsEl.classList.remove('hide-smooth');
        numberOddsEl.style.display = 'block';
    }
    renderSequence();
});

// How to Play Popup
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayPopup = document.getElementById('how-to-play-popup');
const closePopupButton = document.getElementById('close-popup');

if (howToPlayBtn && howToPlayPopup && closePopupButton) {
    howToPlayBtn.addEventListener('click', () => {
        howToPlayPopup.style.display = 'flex';
    });

    closePopupButton.addEventListener('click', () => {
        howToPlayPopup.style.display = 'none';
    });
}

function createInteractiveBackground() {
    const overlay = document.querySelector('.particle-overlay');
    
    for(let i = 0; i < 200; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.opacity = Math.random() * 0.5;
        overlay.appendChild(particle);
    }

    const lineCount = 5;
    for(let i = 0; i < lineCount; i++) {
        const line = document.createElement('div');
        line.className = 'glow-line';
        line.style.top = `${Math.random() * 100}%`;
        line.style.width = `${Math.random() * 200 + 100}%`;
        line.style.transform = `rotate(${Math.random() * 180 - 90}deg)`;
        line.style.opacity = 0.2;
        overlay.appendChild(line);
    }

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateBackground() {
        const particles = document.querySelectorAll('.particle');
        const lines = document.querySelectorAll('.glow-line');
        
        particles.forEach(particle => {
            const rect = particle.getBoundingClientRect();
            const dx = mouseX - (rect.left + rect.width/2);
            const dy = mouseY - (rect.top + rect.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            const force = Math.min(500/(dist+1), 30);
            
            particle.style.transform = `translate(${dx * 0.02}px, ${dy * 0.02}px)`;
            particle.style.opacity = 0.2 + (0.3 * Math.min(1, force/10));
        });

        lines.forEach(line => {
            line.style.transform += `rotate(${Math.sin(Date.now()/2000) * 0.02}deg)`;
            line.style.opacity = 0.1 + Math.abs(Math.sin(Date.now()/1000)) * 0.1;
        });

        requestAnimationFrame(updateBackground);
    }

    updateBackground();
}

initializeLevel();
renderSequence();
updateGameContainerSize();