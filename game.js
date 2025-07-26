// Moved all JavaScript from HTML to this file
import { CONFIG } from './config.js';
import { sounds } from './sounds.js';

let currentRound = 1;
let totalRounds;
let sequence;
let currentNumber;
let isGameOver = false;
let lastGeneratedNumber = null; // Track last generated number
let speechBubbleTimeout;
let lastSpeechTime = 0;

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

// Add speech bubble functionality
function showSpeechBubble(message, duration = 4000) {
    const speechBubble = document.getElementById('speech-bubble');
    if (!speechBubble) return;
    
    // Clear any existing timeout
    if (speechBubbleTimeout) {
        clearTimeout(speechBubbleTimeout);
    }
    
    speechBubble.textContent = message;
    speechBubble.classList.add('visible');
    
    speechBubbleTimeout = setTimeout(() => {
        speechBubble.classList.remove('visible');
    }, duration);
}

function getRandomDialogue() {
    const currentTime = Date.now();
    const timeSinceLastSpeech = currentTime - lastSpeechTime;
    
    // Don't show speech too frequently
    if (timeSinceLastSpeech < 5000) return null;
    
    lastSpeechTime = currentTime;
    
    if (currentLevel === 1) {
        const level1Dialogues = [
            "Welcome! Click the ? for help!",
            "Place smaller numbers left, bigger right!",
            "You've got this! Start simple.",
            "Need help? Check the tutorial below!",
            "Think about where each number fits best."
        ];
        return level1Dialogues[Math.floor(Math.random() * level1Dialogues.length)];
    } else if (currentLevel === 2) {
        const level2Dialogues = [
            "Getting harder now! Stay focused.",
            "Look for gaps between numbers.",
            "Still need help? Try the ? button!",
            "You're doing well so far!",
            "Remember the sequence must stay ordered."
        ];
        return level2Dialogues[Math.floor(Math.random() * level2Dialogues.length)];
    } else if (currentLevel <= 4) {
        const midGameDialogues = [
            "Hmm, getting tricky isn't it?",
            "Maybe this is too hard for you?",
            "I've seen better players...",
            "Are you sure you can handle this?",
            "Most people quit around here.",
            "This is where it gets real."
        ];
        return midGameDialogues[Math.floor(Math.random() * midGameDialogues.length)];
    } else if (currentLevel <= 6) {
        const hardDialogues = [
            "Oh, you're still here?",
            "I'm impressed you made it this far.",
            "Don't get cocky now...",
            "The numbers are getting bigger.",
            "One mistake and it's over.",
            "Feeling the pressure yet?"
        ];
        return hardDialogues[Math.floor(Math.random() * hardDialogues.length)];
    } else {
        const expertDialogues = [
            "You're actually good at this...",
            "Fine, I'll admit you're skilled.",
            "But can you handle what's next?",
            "The pressure is real now.",
            "Don't choke at the finish line.",
            "Prove you're not just lucky."
        ];
        return expertDialogues[Math.floor(Math.random() * expertDialogues.length)];
    }
}

function getGameOverDialogue() {
    if (currentLevel <= 2) {
        return "Don't give up! Check the ? for help!";
    } else if (currentLevel <= 4) {
        return "I knew you couldn't handle it.";
    } else if (currentLevel <= 6) {
        return "So close, yet so far...";
    } else {
        return "You were doing so well too.";
    }
}

function getLevelCompleteDialogue() {
    if (currentLevel === 1) {
        return "Nice! But it gets harder...";
    } else if (currentLevel <= 3) {
        return "Lucky guess? Let's see...";
    } else if (currentLevel <= 5) {
        return "Not bad... for a human.";
    } else if (currentLevel <= 7) {
        return "Okay, I'm actually impressed.";
    } else {
        return "You might actually beat this game.";
    }
}

function initializeLevel() {
    currentLevelConfig = CONFIG.LEVEL_CONFIG.find(level => level.level === currentLevel);
    if (!currentLevelConfig) {
        currentLevelConfig = CONFIG.LEVEL_CONFIG[CONFIG.LEVEL_CONFIG.length - 1];
    }
    totalRounds = currentLevelConfig.rounds;
    sequence = new Array(currentLevelConfig.slots).fill(null);
    
    // Update color theme based on level
    updateColorTheme();
}

function updateColorTheme() {
    // Calculate hue: blue (210) to red (0) over 9 levels
    // Level 1 = 210 (blue), Level 9 = 0 (red)
    const maxLevel = CONFIG.LEVEL_CONFIG.length;
    const hueRange = 210; // From 210 (blue) to 0 (red)
    const levelProgress = (currentLevel - 1) / (maxLevel - 1);
    const hue = Math.round(210 - (hueRange * levelProgress));
    
    // Apply the hue to CSS custom property
    document.documentElement.style.setProperty('--level-hue', hue);
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

// Add reactive face functionality
function updateFaceState(state, tip = '') {
    const faceContainer = document.querySelector('.face-container');
    if (!faceContainer) return;
    
    faceContainer.className = 'face-container ' + state;
    
    // Add tooltip for tips
    if (tip) {
        faceContainer.setAttribute('title', tip);
        faceContainer.style.cursor = 'help';
    } else {
        faceContainer.removeAttribute('title');
        faceContainer.style.cursor = 'default';
    }
}

// Update face based on game state
function handleInsertion(position) {
    if (isGameOver || sequence[position] !== null && sequence[position] !== undefined) return;

    sequence[position] = currentNumber;
    sounds.place.play().catch(e => console.log('Audio play failed:', e));
    
    if (!checkSorted()) {
        isGameOver = true;
        updateFaceState('sad', getHelpfulTip());
        showMessage('Game Over! Wrong placement', 'error');
        showSpeechBubble(getGameOverDialogue(), 5000);
        sounds.game_over.play().catch(e => console.log('Audio play failed:', e));
        if (sequenceContainer) {
            sequenceContainer.classList.add('shaking');
        }
        if (nextLevelBtn) nextLevelBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'inline-block';
        return;
    }

    // Make the face smile for correct placement
    updateFaceState('happy', getEncouragement());
    setTimeout(() => updateFaceState('thinking', getNextTip()), 800);

    currentRound++;

    if (currentRound > totalRounds) {
        sequence[position] = currentNumber;
        updateFaceState('happy');
        renderSequence();
        isGameOver = true;
        if (nextLevelBtn) nextLevelBtn.style.display = 'inline-block';
        if (restartBtn) restartBtn.style.display = 'none';
        showMessage(`Level ${currentLevel} Complete!\n_________________________`, 'success');
        showSpeechBubble(getLevelCompleteDialogue(), 5000);
        sounds.level_complete.play().catch(e => console.log('Audio play failed:', e));
        return;
    }

    updateFaceState('thinking');
    renderSequence();
    
    // Random chance to show dialogue during gameplay
    if (Math.random() < 0.3) {
        const dialogue = getRandomDialogue();
        if (dialogue) {
            setTimeout(() => showSpeechBubble(dialogue), 1000);
        }
    }
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
        
        // Create flashing overlay for big events
        if (type === 'success' || type === 'error') {
            const flashOverlay = document.createElement('div');
            flashOverlay.className = 'flash-overlay';
            flashOverlay.innerHTML = `
                <div class="flash-content">
                    <h1 class="flash-text">${type === 'success' ? 'LEVEL COMPLETE!' : 'GAME OVER'}</h1>
                    <p class="flash-subtitle">${type === 'success' ? 'Perfect sequence!' : 'Try again...'}</p>
                </div>
            `;
            document.body.appendChild(flashOverlay);
            
            // Trigger animation
            setTimeout(() => {
                flashOverlay.classList.add('active');
            }, 10); // Small delay to ensure render for transition
            
            // Allow clicks through the overlay after it starts fading in
            setTimeout(() => {
                flashOverlay.style.pointerEvents = 'none';
            }, 600); // 10ms (initial delay) + 500ms (opacity transition) + 90ms (buffer)
            
            // Remove after animation
            setTimeout(() => {
                flashOverlay.remove();
            }, 2500); // Allow animations to play (flashPulse is 1.5s, fadeInUp is 1.3s total)
        }
        
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

// How to Play Popup
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayPopup = document.getElementById('how-to-play-popup');
const closePopupButton = document.getElementById('close-popup');

if (howToPlayBtn && howToPlayPopup && closePopupButton) {
    howToPlayBtn.addEventListener('click', () => {
        sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
        howToPlayPopup.style.display = 'flex';
    });

    closePopupButton.addEventListener('click', () => {
        sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
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

// Add new helper functions for face tips
function getHelpfulTip() {
    if (currentLevel <= 2) {
        return "Click the ? button in the bottom right to check the tutorial!";
    }
    return "Try placing smaller numbers to the left and larger to the right.";
}

function getEncouragement() {
    const encouragements = [
        "Great placement!",
        "Perfect!",
        "Nice move!",
        "Excellent!"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
}

function getNextTip() {
    if (currentLevel === 1 && currentRound <= 2) {
        return "Remember: smaller numbers on the left, larger on the right!";
    } else if (currentLevel === 2 && currentRound <= 3) {
        return "Look for gaps where your number fits between existing ones";
    } else if (currentLevel <= 2) {
        return "Need help? Check the tutorial with the ? button";
    }
    return "";
}

// Initialize face with appropriate tip
initializeLevel();
updateFaceState('thinking', getNextTip());
renderSequence();
updateGameContainerSize();

// Add mouse tracking for eyes
document.addEventListener('mousemove', (e) => {
    const faceContainer = document.querySelector('.face-container');
    const rect = faceContainer?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / 20;
    const deltaY = (e.clientY - centerY) / 20;
    
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    
    if (leftEye) {
        leftEye.style.transform = `translate(${Math.max(-3, Math.min(3, deltaX))}px, ${Math.max(-3, Math.min(3, deltaY))}px)`;
    }
    if (rightEye) {
        rightEye.style.transform = `translate(${Math.max(-3, Math.min(3, deltaX))}px, ${Math.max(-3, Math.min(3, deltaY))}px)`;
    }
});

nextLevelBtn.addEventListener('click', () => {
    sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
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
    
    // Show encouraging/discouraging message for new level
    setTimeout(() => {
        const dialogue = getRandomDialogue();
        if (dialogue) {
            showSpeechBubble(dialogue);
        }
    }, 1500);
});

restartBtn.addEventListener('click', () => {
    sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
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

// Show initial welcome message
setTimeout(() => {
    showSpeechBubble("Welcome to Sequenced! Click the ? if you need help.", 6000);
}, 2000);