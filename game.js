// Moved all JavaScript from HTML to this file
import { CONFIG } from './config.js';
import { sounds } from './sounds.js';

let currentRound = 1;
let totalRounds;
let sequence;
let currentNumber;
let isGameOver = false;
let totalFails = 0; // Add total fails counter
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
const totalFailsEl = document.getElementById('total-fails'); // Get fails element
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayPopup = document.getElementById('how-to-play-popup');
const closePopupButton = document.getElementById('close-popup');
const loadingScreen = document.getElementById('loading-screen'); // Get loading screen element
const faceContainer = document.querySelector('.face-container'); // Get face container element
const mouthEl = document.querySelector('.mouth'); // Get mouth element
const leftEyeEl = document.querySelector('.left-eye'); // Get left eye element
const rightEyeEl = document.querySelector('.right-eye'); // Get right eye element

// Null checks for critical elements
if (!sequenceContainer || !currentRoundEl || !newNumberBoxEl || !messagesEl || 
    !currentLevelEl || !numberOddsEl || !nextLevelBtn || !restartBtn ||
    !totalFailsEl || !howToPlayBtn || !howToPlayPopup || !closePopupButton || !loadingScreen ||
    !faceContainer || !mouthEl || !leftEyeEl || !rightEyeEl) {
    console.error('One or more critical game elements are missing');
}

let currentLevel = 1;
let currentLevelConfig;
let mouthStateTimerId = null; // Timer for random mouth switching

// Function to manage mouth shape by adding/removing specific classes
function setMouthShapeClass(isCircle) {
    if (!mouthEl) return;
    if (isCircle) {
        mouthEl.classList.add('circle-random');
    } else {
        mouthEl.classList.remove('circle-random');
    }
}

// Function to start random mouth switching
function startRandomMouthSwitching() {
    // Clear any existing timer
    if (mouthStateTimerId) {
        clearTimeout(mouthStateTimerId);
        mouthStateTimerId = null;
    }

    const switchMouth = () => {
        // If the face is currently in 'sad' or 'happy' state (CSS overrides), don't random switch
        // This check ensures random switching only happens in the 'thinking' (idle) state
        if (faceContainer.classList.contains('sad') || faceContainer.classList.contains('happy')) {
            mouthStateTimerId = null; // Ensure timer is stopped if state changed externally
            return;
        }

        // Randomly choose between straight and circle
        const isCircle = Math.random() < 0.5; // 50% chance for circle mouth
        setMouthShapeClass(isCircle);

        // Schedule next switch after a random delay (e.g., 2 to 5 seconds)
        const delay = Math.random() * 3000 + 2000; // 2000ms (2s) to 5000ms (5s)
        mouthStateTimerId = setTimeout(switchMouth, delay);
    };

    switchMouth(); // Start immediately
}

// Add reactive face functionality
function updateFaceState(state, tip = '') {
    if (!faceContainer || !mouthEl || !leftEyeEl || !rightEyeEl) return;
    
    // Remove all general state classes and random mouth class before setting new state
    faceContainer.classList.remove('happy', 'sad', 'thinking');
    mouthEl.classList.remove('circle-random'); // Always remove random class when explicitly setting state

    // Clear random mouth switching timer
    if (mouthStateTimerId) {
        clearTimeout(mouthStateTimerId);
        mouthStateTimerId = null;
    }
    
    // Reset eye transforms when state changes, as they are controlled by mousemove separately
    leftEyeEl.style.transform = '';
    rightEyeEl.style.transform = '';

    // Set the new state class on face container
    faceContainer.classList.add(state);

    // Apply specific mouth and eye logic based on state
    if (state === 'happy') {
        // The CSS for .face-container.happy .mouth already applies the circle mouth
        // and eye styles. No need to manually set mouth properties or start random switching here.
        
        // After a short delay, revert to thinking state and restart random switching
        setTimeout(() => {
            // Check if game is still active and not sad before reverting to thinking
            // This prevents reverting to thinking if game over occurred during the happy timeout
            if (!isGameOver && !faceContainer.classList.contains('sad')) {
                updateFaceState('thinking', getNextTip());
            }
        }, 800); // Duration of the 'happy' animation/display
    } else if (state === 'sad') {
        // The CSS for .face-container.sad .mouth already applies the frown mouth and red color
        // and eye styles. No random switching when sad.
    } else { // 'thinking' state or default
        startRandomMouthSwitching(); // Start/continue random switching for 'thinking' state
    }
    
    // Apply tooltip logic
    if (tip) {
        faceContainer.setAttribute('title', tip);
        faceContainer.style.cursor = 'help';
    } else {
        faceContainer.removeAttribute('title');
        faceContainer.style.cursor = 'default';
    }
}

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
    updateProgressIndicator(); // Ensure progress indicator is updated on level init
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
            // Play a subtle sound when new number is generated
            sounds.place.play().catch(e => console.log('Audio play failed:', e));
        }
    } else if (newNumberBoxEl) {
        newNumberBoxEl.textContent = '';
    }
    
    updateProgressIndicator(); // Call after sequence is rendered to ensure progress is shown
    
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
    
    // Add visible button height - these will now be controlled by JS for auto-advance
    // nextLevelBtn will always be hidden, restartBtn is now always visible via CSS.
    if (restartBtnEl) { // No need to check display here, it's always visible
        gameContainerHeight += restartBtnEl.offsetHeight;
    }
    
    // Add extra padding for spacing
    gameContainerHeight += 180; // Increased for more space at bottom

    gameContainer.style.width = `${gameContainerWidth}px`;
    gameContainer.style.height = `${gameContainerHeight}px`;
}

function handleInsertion(position) {
    if (isGameOver || sequence[position] !== null && sequence[position] !== undefined) return;

    sequence[position] = currentNumber;
    sounds.place.play().catch(e => console.log('Audio play failed:', e));
    
    if (!checkSorted()) {
        // Play error sound for wrong placement
        sounds.error.play().catch(e => console.log('Audio play failed:', e));
        gameOver('wrong_placement');
        return;
    }

    // Play success sound for correct placement
    sounds.success.play().catch(e => console.log('Audio play failed:', e));

    // Make the face smile (now circle mouth) for correct placement
    updateFaceState('happy', getEncouragement()); // updateFaceState will handle reverting to 'thinking'
    // The random mouth switching will restart when it reverts to 'thinking' state
    
    currentRound++;

    if (currentRound > totalRounds) {
        sequence[position] = currentNumber;
        updateFaceState('happy'); // Happy for level completion
        renderSequence(); // Render one last time to show the full sequence
        isGameOver = true; // Set game over state
        document.body.classList.add('game-over'); // Add game-over class to body
        // Automatically advance, so hide next level button. Restart button is always visible via CSS.
        if (nextLevelBtn) nextLevelBtn.style.display = 'none'; 
        showMessage(`Level ${currentLevel} Complete!\n_________________________`, 'success');
        showSpeechBubble(getLevelCompleteDialogue(), 5000);
        sounds.level_complete.play().catch(e => console.log('Audio play failed:', e));
        // The advance to next level logic will be triggered by showMessage for 'success' type
        return;
    }

    // Only render sequence if not level complete
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

function gameOver(reason) {
    isGameOver = true;
    totalFails++;
    if (totalFailsEl) totalFailsEl.textContent = `Fails: ${totalFails}`;
    document.body.classList.add('game-over'); // Add game-over class to body
    updateFaceState('sad', getHelpfulTip());
    
    let messageText = 'Game Over! Wrong placement';
    
    showMessage(messageText, 'error');
    showSpeechBubble(getGameOverDialogue(), 5000);
    sounds.game_over.play().catch(e => console.log('Audio play failed:', e));
    if (sequenceContainer) {
        sequenceContainer.classList.add('shaking');
    }
    if (nextLevelBtn) nextLevelBtn.style.display = 'none'; // Keep next level button hidden
}

function advanceToNextLevel() {
    currentLevel++;
    currentRound = 1;
    lastGeneratedNumber = null;
    initializeLevel();
    isGameOver = false; // Reset game over state for new level
    document.body.classList.remove('game-over'); // Remove game-over class from body
    if (messagesEl) {
        messagesEl.textContent = '';
        messagesEl.className = '';
    }
    if (sequenceContainer) {
        sequenceContainer.classList.remove('shaking');
    }
    // Ensure next level button remains hidden for auto advance. Restart button is always visible.
    if (nextLevelBtn) nextLevelBtn.style.display = 'none'; 
    if (numberOddsEl) {
        numberOddsEl.classList.remove('hide-smooth');
        numberOddsEl.style.display = 'block';
    }
    renderSequence();
    updateGameContainerSize();
    
    // Play level advancement sound
    sounds.level_complete.play().catch(e => console.log('Audio play failed:', e));
    
    // Show encouraging/discouraging message for new level
    setTimeout(() => {
        const dialogue = getRandomDialogue();
        if (dialogue) {
            showSpeechBubble(dialogue);
        }
    }, 1500);
    updateFaceState('thinking', getNextTip()); // Reset face to thinking for new level
}

function showMessage(text, type) {
    if (messagesEl) {
        messagesEl.textContent = text;
        messagesEl.className = type;
        
        const gameContainer = document.querySelector('.game-container');

        // Create flashing overlay only for success (Level Complete)
        if (type === 'success') {
            // Fade out game container before showing flash overlay
            if (gameContainer) {
                gameContainer.classList.add('fade-game-out');
            }

            const flashOverlay = document.createElement('div');
            flashOverlay.className = 'flash-overlay';
            flashOverlay.innerHTML = `
                <div class="flash-content">
                    <h1 class="flash-text">LEVEL COMPLETE!</h1>
                    <p class="flash-subtitle">Perfect sequence!</p>
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
            
            // Remove after animation and fade game back in
            setTimeout(() => {
                flashOverlay.remove();
                if (gameContainer) {
                    gameContainer.classList.remove('fade-game-out');
                }
                // Automatically advance to the next level
                advanceToNextLevel();
            }, 2500); // Allow animations to play (flashPulse is 1.5s, fadeInUp is 1.3s total)
        } else if (type === 'error') {
            // For error, just show the message, no full screen overlay or fade
            // Ensure game container is not faded out if it was from a previous success state
            if (gameContainer) {
                gameContainer.classList.remove('fade-game-out');
            }
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
    
    // Calculate progress percentage (0-100%) for normal mode
    const totalLevels = CONFIG.LEVEL_CONFIG.length;
    const progressPercentage = ((currentLevel - 1) / totalLevels) * 100;
    
    // Fill the container based on current level
    progressIndicator.style.setProperty('--liquid-height', `${progressPercentage}%`);
    
    // Set data attributes regardless of mode for potential CSS use
    progressIndicator.setAttribute('data-level', currentLevel);
    progressIndicator.setAttribute('data-max-level', CONFIG.LEVEL_CONFIG.length);
}

// How to Play Popup
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
updateFaceState('thinking', getNextTip()); // 'thinking' state will now display the default straight mouth or randomly switch
renderSequence();
updateGameContainerSize();

// The restart button is now always visible via CSS, no need to hide it on initial load.

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

// Next level button handler
if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
        sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
        advanceToNextLevel();
    });
}

restartBtn.addEventListener('click', () => {
    sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
    currentRound = 1;
    lastGeneratedNumber = null;
    initializeLevel();
    isGameOver = false;
    document.body.classList.remove('game-over'); // Remove game-over class from body
    if (messagesEl) {
        messagesEl.textContent = '';
        messagesEl.className = '';
    }
    if (sequenceContainer) {
        sequenceContainer.classList.remove('shaking');
    }
    // After restart, hide next level button. Restart button is always visible via CSS.
    if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    if (numberOddsEl) {
        numberOddsEl.classList.remove('hide-smooth');
        numberOddsEl.style.display = 'block';
    }
    renderSequence();
    updateFaceState('thinking', getNextTip()); // Reset face to thinking on restart
});

// Show initial welcome message
setTimeout(() => {
    showSpeechBubble("Welcome to Sequenced! Click the ? if you need help.", 6000);
}, 2000);

// Audio test functionality
const audioTestBtn = document.getElementById('audio-test-btn');
if (audioTestBtn) {
    audioTestBtn.addEventListener('click', () => {
        console.log('Audio test button clicked');
        
        // Diagnostic information
        console.log('Audio context state:', window.soundSystem?.audioContext?.state);
        console.log('Audio enabled:', window.soundSystem?.audioEnabled);
        
        // Test all sound types
        sounds.button_click.play();
        setTimeout(() => sounds.success.play(), 200);
        setTimeout(() => sounds.error.play(), 400);
        setTimeout(() => sounds.place.play(), 600);
        
        // Show feedback
        audioTestBtn.textContent = '✅ Audio Tested!';
        audioTestBtn.style.background = '#51cf66';
        setTimeout(() => {
            audioTestBtn.textContent = '🔊 Test Audio';
            audioTestBtn.style.background = '#ff6b6b';
        }, 2000);
    });
}

// Audio toggle functionality
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioStatus = document.getElementById('audio-status');

if (audioToggleBtn) {
    let audioEnabled = true;
    
    audioToggleBtn.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        
        if (audioEnabled) {
            audioToggleBtn.textContent = '🔊 Audio ON';
            audioToggleBtn.style.background = '#51cf66';
            // Re-enable audio system
            if (window.soundSystem) {
                window.soundSystem.enable();
            }
        } else {
            audioToggleBtn.textContent = '🔇 Audio OFF';
            audioToggleBtn.style.background = '#ff6b6b';
            // Disable audio system
            if (window.soundSystem) {
                window.soundSystem.disable();
            }
        }
        
        // Play a test sound to confirm
        if (audioEnabled) {
            sounds.button_click.play();
        }
    });
}

// Update audio status
function updateAudioStatus() {
    if (audioStatus) {
        if (window.soundSystem?.audioContext?.state === 'running') {
            audioStatus.textContent = 'Audio: Working ✅';
            audioStatus.style.background = '#51cf66';
        } else if (window.soundSystem?.audioContext?.state === 'suspended') {
            audioStatus.textContent = 'Audio: Suspended ⏸️';
            audioStatus.style.background = '#ffa500';
        } else if (window.soundSystem?.fallbackAudio) {
            audioStatus.textContent = 'Audio: Fallback 🔄';
            audioStatus.style.background = '#ffa500';
        } else {
            audioStatus.textContent = 'Audio: Failed ❌';
            audioStatus.style.background = '#ff6b6b';
        }
    }
}

// Update status periodically
setInterval(updateAudioStatus, 1000);
updateAudioStatus();

// Background music toggle functionality
const musicToggleBtn = document.getElementById('music-toggle-btn');
if (musicToggleBtn) {
    let musicEnabled = true;
    
    musicToggleBtn.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        
        if (musicEnabled) {
            musicToggleBtn.textContent = '🎵 Music ON';
            musicToggleBtn.style.background = '#8b5cf6';
            // Start background music
            if (window.soundSystem) {
                window.soundSystem.toggleBackgroundMusic();
            }
        } else {
            musicToggleBtn.textContent = '🔇 Music OFF';
            musicToggleBtn.style.background = '#6b7280';
            // Stop background music
            if (window.soundSystem) {
                window.soundSystem.toggleBackgroundMusic();
            }
        }
        
        // Play a test sound to confirm
        sounds.button_click.play();
    });
}

// Add loading screen hide logic here
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingFaceContainer = document.querySelector('.loading-face-container');
    const loadingLeftEye = document.querySelector('.loading-left-eye');
    const loadingRightEye = document.querySelector('.loading-right-eye');

    let loadingEyesMoveListener; // Declare to be able to remove it

    if (loadingScreen && loadingFaceContainer && loadingLeftEye && loadingRightEye) {
        // Function to track mouse for loading screen eyes
        loadingEyesMoveListener = (e) => {
            const rect = loadingFaceContainer.getBoundingClientRect();
            if (!rect) return;
            
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) / 20; // Adjust divisor for sensitivity
            const deltaY = (e.clientY - centerY) / 20;
            
            // Limit eye movement
            const maxMove = 5; // Pixels
            
            loadingLeftEye.style.transform = `translate(${Math.max(-maxMove, Math.min(maxMove, deltaX))}px, ${Math.max(-maxMove, Math.min(maxMove, deltaY))}px)`;
            loadingRightEye.style.transform = `translate(${Math.max(-maxMove, Math.min(maxMove, deltaX))}px, ${Math.max(-maxMove, Math.min(maxMove, deltaY))}px)`;
        };

        // Add listener when loading screen is active
        document.addEventListener('mousemove', loadingEyesMoveListener);

        // Give a moment for the initial rendering and a short cinematic display
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            // Remove from DOM after transition completes
            loadingScreen.addEventListener('transitionend', () => {
                loadingScreen.style.display = 'none';
                // Remove the mousemove listener for loading eyes once it's gone
                document.removeEventListener('mousemove', loadingEyesMoveListener);
                // Play a startup sound when game begins
                sounds.success.play().catch(e => console.log('Audio play failed:', e));
            }, { once: true }); // Use { once: true } to remove the listener after it fires
        }, 2500); // Display loading screen for 2.5 seconds
    }
});