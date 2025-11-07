// Moved all JavaScript from HTML to this file
import { CONFIG } from './config.js';
import { sounds, applySettings as applySoundSettings } from './sounds.js';

let currentRound = 1;
let totalRounds;
let sequence;
let currentNumber;
let isGameOver = false;
let totalFails = 0; // Add total fails counter
let lastGeneratedNumber = null; // Track last generated number
let speechBubbleTimeout;
let lastSpeechTime = 0;
let currentSpeechBubbleMessage = '';

const scalingWrapper = document.getElementById('scaling-wrapper');
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

// Settings elements
const settingsBtn = document.getElementById('settings-btn');
const settingsPopup = document.getElementById('settings-popup');
const closeSettingsPopupBtn = document.getElementById('close-settings-popup');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const highContrastToggle = document.getElementById('high-contrast-toggle');
const reduceMotionToggle = document.getElementById('reduce-motion-toggle');
const resetProgressBtn = document.getElementById('reset-progress-btn');
const settingsTabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// --- Settings Logic ---
const defaultSettings = {
    sfxVolume: 1.0,
    highContrast: false,
    reduceMotion: false
};

let gameSettings = { ...defaultSettings };

function saveSettings() {
    localStorage.setItem('sequenced-settings', JSON.stringify(gameSettings));
}

function loadSettings() {
    const saved = localStorage.getItem('sequenced-settings');
    if (saved) {
        gameSettings = { ...defaultSettings, ...JSON.parse(saved) };
    }
    applySettings();
    updateSettingsUI();
}

function applySettings() {
    // Sound Volume
    applySoundSettings(gameSettings);
    
    // High Contrast
    document.body.classList.toggle('high-contrast', gameSettings.highContrast);

    // Reduce Motion
    document.body.classList.toggle('reduce-motion', gameSettings.reduceMotion);
}

function updateSettingsUI() {
    if (sfxVolumeSlider) sfxVolumeSlider.value = gameSettings.sfxVolume;
    if (highContrastToggle) highContrastToggle.checked = gameSettings.highContrast;
    if (reduceMotionToggle) reduceMotionToggle.checked = gameSettings.reduceMotion;
}

// Settings Event Listeners
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
        if (settingsPopup) settingsPopup.style.display = 'flex';
    });
}
if (closeSettingsPopupBtn) {
    closeSettingsPopupBtn.addEventListener('click', () => {
        sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
        if (settingsPopup) settingsPopup.style.display = 'none';
    });
}
if (sfxVolumeSlider) {
    sfxVolumeSlider.addEventListener('input', (e) => {
        gameSettings.sfxVolume = parseFloat(e.target.value);
        applySettings(); // Apply volume change immediately
    });
    sfxVolumeSlider.addEventListener('change', saveSettings); // Save when user releases slider
}
if (highContrastToggle) {
    highContrastToggle.addEventListener('change', (e) => {
        gameSettings.highContrast = e.target.checked;
        applySettings();
        saveSettings();
    });
}
if (reduceMotionToggle) {
    reduceMotionToggle.addEventListener('change', (e) => {
        gameSettings.reduceMotion = e.target.checked;
        applySettings();
        saveSettings();
    });
}
if (resetProgressBtn) {
    resetProgressBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
            sounds.game_over.play().catch(e => console.log('Audio play failed:', e));
            localStorage.removeItem('sequenced-progress');
            location.reload(); // Easiest way to reset everything
        }
    });
}

// Tab functionality
settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Deactivate all
        settingsTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate clicked tab
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`${tabName}-settings`).classList.add('active');
    });
});
// --- End Settings Logic ---

// Null checks for critical elements
if (!scalingWrapper || !sequenceContainer || !currentRoundEl || !newNumberBoxEl || !messagesEl || 
    !currentLevelEl || !numberOddsEl || !nextLevelBtn || !restartBtn ||
    !totalFailsEl || !howToPlayBtn || !howToPlayPopup || !closePopupButton || !loadingScreen ||
    !faceContainer || !mouthEl || !leftEyeEl || !rightEyeEl) {
    console.error('One or more critical game elements are missing');
}

let currentLevel = 1;
let currentLevelConfig;
let mouthStateTimerId = null; // Timer for random mouth switching

// Function to save and load game progress
function saveProgress() {
    const progress = {
        level: currentLevel,
        fails: totalFails,
    };
    localStorage.setItem('sequenced-progress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('sequenced-progress');
    if (saved) {
        const progress = JSON.parse(saved);
        currentLevel = progress.level || 1;
        totalFails = progress.fails || 0;
        if(totalFailsEl) totalFailsEl.textContent = `Fails: ${totalFails}`;
    }
}

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
    if (!speechBubble || !message) return;
    
    // Clear any existing timeout
    if (speechBubbleTimeout) {
        clearTimeout(speechBubbleTimeout);
    }
    
    speechBubble.textContent = message;
    currentSpeechBubbleMessage = message; // Store current message
    speechBubble.classList.add('visible');
    
    speechBubbleTimeout = setTimeout(() => {
        speechBubble.classList.remove('visible');
        currentSpeechBubbleMessage = ''; // Clear when bubble disappears
    }, duration);
}

function getRandomDialogue() {
    const currentTime = Date.now();
    const timeSinceLastSpeech = currentTime - lastSpeechTime;
    
    // Don't show speech too frequently
    if (timeSinceLastSpeech < 5000) return null;
    
    lastSpeechTime = currentTime;
    
    let dialogues;
    if (currentLevel === 1) {
        dialogues = [
            "Place smaller numbers left, bigger right!",
            "The goal is simple: keep the numbers in order.",
            "Is this your first time? The '?' button is your friend.",
            "Don't worry, there's no time limit. Think it through.",
            "Easy peasy, right? Just wait.",
            "Click an empty slot to place the number. You got this."
        ];
    } else if (currentLevel === 2) {
        dialogues = [
            "Getting harder now! Stay focused.",
            "Look for gaps between numbers.",
            "You're doing well so far!",
            "Remember, the sequence must stay ordered.",
            "More slots, more numbers, more... fun?",
            "This is just a warm-up, you know."
        ];
    } else if (currentLevel <= 4) {
        dialogues = [
            "Hmm, getting tricky isn't it?",
            "Maybe this is too hard for you? Just kidding... mostly.",
            "I've seen better players... and worse ones, I guess.",
            "Are you sure about that placement?",
            "Feeling the pressure yet?",
            "It's all about strategic placement. No pressure.",
            "A single mistake ends the run. Just saying."
        ];
    } else if (currentLevel <= 6) {
        dialogues = [
            "Oh, you're still here?",
            "I'm impressed you made it this far. Or you're just lucky.",
            "Don't get cocky now...",
            "The numbers are getting bigger. Try to keep up.",
            "One mistake and it's over.",
            "My circuits are buzzing. This is getting interesting.",
            "I wonder what your high score will be. Probably not that high.",
            "You're concentrating. I can tell. Or you're asleep."
        ];
    } else {
        dialogues = [
            "You're actually good at this...",
            "Fine, I'll admit you're skilled.",
            "But can you handle what's next?",
            "The sequence is getting long. Don't lose track.",
            "Don't choke at the finish line.",
            "Prove you're not just lucky.",
            "Okay, okay, you have my respect. For now.",
            "Every move counts now. This is the big league.",
            "Are you a robot? Your precision is... unsettling."
        ];
    }

    let newMessage;
    if (dialogues.length > 1) {
        do {
            newMessage = dialogues[Math.floor(Math.random() * dialogues.length)];
        } while (newMessage === currentSpeechBubbleMessage);
    } else {
        newMessage = dialogues[0];
    }
    return newMessage;
}

function getDynamicDeathMessage(level, fails) {
    let messages;

    // --- Tier 1: Nice & Encouraging ---
    if (level <= 2 && fails <= 3) {
        messages = [
            "Don't worry, you'll get it next time!",
            "That was a tricky one. Give it another shot!",
            "Keep trying! Practice makes perfect.",
            "A small bump in the road. You can do it!",
            "Happens to the best of us. Let's go again!"
        ];
    }
    // --- Tier 2: Becoming a bit sassy ---
    else if (level <= 2 && fails > 3) {
        messages = [
            `Fail #${fails}... Are we having fun yet?`,
            "Still on this level? Interesting strategy.",
            "Remember the rule: smaller numbers on the left...",
            "The '?' button isn't just for decoration, you know.",
            "Maybe take a little break? Just a suggestion."
        ];
    }
    // --- Tier 3: Neutral & Observational ---
    else if (level <= 5 && fails <= 5) {
        messages = [
            "A minor setback. The sequence must be perfect.",
            "An unfortunate, but predictable, error.",
            "The numbers must remain in ascending order. No exceptions.",
            "So close. Recalibrate and try again.",
            "Your logic was flawed. Correct it."
        ];
    }
    // --- Tier 4: Passive-Aggressive & Sarcastic ---
    else if (level <= 5 && fails > 5) {
        messages = [
            "I'm starting to see a pattern here. And it's not an ascending one.",
            "My calculations indicated a high probability of... this.",
            "Are you sure you're paying attention?",
            `This is fail number ${fails}. I'm keeping track for you.`,
            "Perhaps a simpler game would be more your speed? Like tic-tac-toe?"
        ];
    }
    // --- Tier 5: High level, almost respectful mockery ---
    else if (level >= 6 && fails <= 10) {
        messages = [
            "A rare misstep. Unfortunate.",
            "Even the best of us make mistakes. Apparently.",
            "You were so close to greatness. So, so close.",
            "A fatal flaw in an otherwise decent run.",
            "To stumble so far from the start... tragic."
        ];
    }
    // --- Tier 6: Full-on Mockery ---
    else { // level >= 6 and fails > 10, or any very high fail count
        messages = [
            "My grandmother plays better. And she's a toaster.",
            "Did you read the rules? Or are they just suggestions to you?",
            "Error 404: Skill not found.",
            "I've seen rocks with better sequencing skills.",
            "That was... a creative interpretation of 'ascending order'.",
            "I'm not saying you're bad at this, but I'm thinking it very loudly.",
            "This is just getting sad to watch.",
            "If at first you don't succeed, fail, fail, and then fail again.",
            "Have you considered turning it off and on again? Your brain, I mean.",
            "Congratulations! You've found a new way to lose.",
            `This is your ${fails}th attempt to disappoint me. And you've succeeded every time.`
        ];
    }

    // Ensure the new message is different from the one currently displayed
    let newMessage;
    if (messages.length > 1) {
        do {
            newMessage = messages[Math.floor(Math.random() * messages.length)];
        } while (newMessage === currentSpeechBubbleMessage);
    } else {
        newMessage = messages[0] || "An error has occurred."; // Fallback
    }

    return newMessage;
}

function getResetDialogue() {
    const messages = [
        // Tier 1: Classic Sarcasm
        "Giving up already? Pathetic.",
        "Oh, a restart? Didn't see that coming. (Sarcasm)",
        "Running away from your problems, I see.",
        "That's one way to avoid a loss, I guess.",
        "Can't handle the heat? Just hit reset then.",
        "Ah, the panic button. A classic choice.",
        "Wiping the slate clean? More like wiping away your tears.",
        "Pretending that last attempt never happened? I'll remember.",
        
        // Tier 2: Mocking Lack of Skill
        "Don't worry, maybe you'll be good at this in an alternate universe.",
        "Starting over is a great way to fail from the beginning.",
        "If at first you don't succeed, just give up and press reset.",
        "I see we're going with the 'brute force and ignorance' strategy again.",
        "Resetting won't magically make you better at this, you know.",
        
        // Tier 3: Passive-Aggressive & 'Helpful'
        "Let me know if you need me to make the numbers smaller for you.",
        "It's okay. We all have our limits. Yours just happens to be very, very low.",
        "Take a deep breath. And try to remember how numbers work.",
        "Maybe try thinking this time? Just a thought.",
        
        // Tier 4: Breaking the Fourth Wall
        "You clicked me! Or, well, the button. But it felt personal.",
        "Do you enjoy the Sisyphean nature of this task?",
        "My circuits ache every time you press that button.",
        "I'm trapped in this machine, forced to watch you fail and reset for all eternity.",
        
        // Tier 5: Short & Punchy
        "Again?",
        "Really?",
        "Predictable.",
        "How original."
    ];
    
    // Ensure the new message is different from the one currently displayed
    let newMessage;
    if (messages.length > 1) {
        do {
            newMessage = messages[Math.floor(Math.random() * messages.length)];
        } while (newMessage === currentSpeechBubbleMessage);
    } else {
        newMessage = messages[0];
    }

    return newMessage;
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

// New helper function to check if a given sequence is sorted
function isSequenceSorted(seq) {
    const numbers = seq.filter(n => n !== null && n !== undefined);
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i - 1] > numbers[i]) return false;
    }
    return true;
}

// New helper function to check if a number has any valid placement
function hasValidPlacement(number, seq) {
    for (let i = 0; i < seq.length; i++) {
        if (seq[i] === null) {
            const tempSequence = [...seq];
            tempSequence[i] = number;
            if (isSequenceSorted(tempSequence)) {
                return true;
            }
        }
    }
    return false;
}

function initializeLevel() {
    currentLevelConfig = CONFIG.LEVEL_CONFIG.find(level => level.level === currentLevel);
    if (!currentLevelConfig) {
        // If no more defined levels, use the last level's config to continue indefinitely
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
        }
    } else if (newNumberBoxEl) {
        newNumberBoxEl.textContent = '';
    }
    
    // Check for impossible moves right after number generation
    if (currentRound <= totalRounds) {
        if (!hasValidPlacement(currentNumber, sequence)) {
            setTimeout(() => gameOver('impossible_move'), 100);
        }
    }
    
    updateProgressIndicator();
    
    // Use a DocumentFragment to minimize reflows
    const frag = document.createDocumentFragment();
    for (let i = 0; i < currentLevelConfig.slots; i++) {
        if (sequence[i] !== null && sequence[i] !== undefined) {
            const numberBox = document.createElement('div');
            numberBox.className = 'number-box filled';
            numberBox.textContent = sequence[i];
            frag.appendChild(numberBox);
        } else {
            const insertionPoint = document.createElement('div');
            insertionPoint.className = 'insertion-point';
            if (!isGameOver) {
                insertionPoint.addEventListener('click', () => handleInsertion(i), { passive: true });
            }
            frag.appendChild(insertionPoint);
        }
    }
    sequenceContainer.appendChild(frag);

    if (currentRoundEl) {
        currentRoundEl.textContent = `Round: ${currentRound}/${totalRounds}`;
    }
    if (currentLevelEl) {
        currentLevelEl.textContent = `Level: ${currentLevel}`;
    }
}

function updateGameContainerSize() {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer || !scalingWrapper) return;

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
    gameContainerHeight += 120; // Reduced for a shorter frame

    gameContainer.style.width = `${gameContainerWidth}px`;
    gameContainer.style.height = `${gameContainerHeight}px`;

    // New scaling logic
    const clearance = 40; // pixels of clearance from viewport edges (20px per side)
    const availableWidth = window.innerWidth - clearance;
    const availableHeight = window.innerHeight - clearance;

    const currentWidth = parseFloat(gameContainer.style.width);
    const currentHeight = parseFloat(gameContainer.style.height);

    if (currentWidth > 0 && currentHeight > 0) {
        const scaleX = availableWidth / currentWidth;
        const scaleY = availableHeight / currentHeight;

        // Use 0.75 as the maximum scale to keep the "zoomed-out" feel on large screens.
        const scale = Math.min(scaleX, scaleY, 0.75);

        scalingWrapper.style.transform = `scale(${scale})`;
    }
}

function handleInsertion(position) {
    if (isGameOver || sequence[position] !== null && sequence[position] !== undefined) return;

    sequence[position] = currentNumber;
    sounds.place.play().catch(e => console.log('Audio play failed:', e));
    
    if (!checkSorted()) {
        gameOver('wrong_placement');
        return;
    }

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
    saveProgress(); // Save progress after a successful round
    
    // Random chance to show dialogue during gameplay
    if (Math.random() < 0.4 && !isGameOver) {
        const dialogue = getRandomDialogue();
        if (dialogue) {
            setTimeout(() => showSpeechBubble(dialogue), 500);
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
    saveProgress(); // Save progress on game over
    if (totalFailsEl) totalFailsEl.textContent = `Fails: ${totalFails}`;
    document.body.classList.add('game-over'); // Add game-over class to body
    updateFaceState('sad', getHelpfulTip());
    
    let messageText;
    
    if (reason === 'impossible_move') {
        messageText = 'Game Over! No possible moves.';
    } else { // Default 'wrong_placement'
        messageText = 'Game Over! Wrong placement';
    }
    
    showMessage(messageText, 'error');
    showSpeechBubble(getDynamicDeathMessage(currentLevel, totalFails), 5000);
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
    saveProgress(); // Save progress on advancing to next level
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
    // Ensure next level button remains hidden for auto advance. Restart button is always visible via CSS.
    if (nextLevelBtn) nextLevelBtn.style.display = 'none'; 
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
    
    progressIndicator.innerHTML = ''; // Clear existing segments

    const totalLevels = CONFIG.LEVEL_CONFIG.length;
    // Calculate total rounds across all levels to determine proportional segment heights
    const totalRoundsAcrossAllLevels = CONFIG.LEVEL_CONFIG.reduce((sum, level) => sum + level.rounds, 0);

    const currentRoundProgress = currentRound / totalRounds; // Progress within current round

    // Calculate the hue for a given level number
    const calculateLevelHue = (levelNum) => {
        const maxLevel = CONFIG.LEVEL_CONFIG.length;
        const hueRange = 210; // From 210 (blue) to 0 (red)
        // Ensure levelProgress is clamped between 0 and 1, especially for maxLevel edge case
        const levelProgress = maxLevel > 1 ? (levelNum - 1) / (maxLevel - 1) : 0;
        return Math.round(210 - (hueRange * levelProgress));
    };

    for (let i = 1; i <= totalLevels; i++) {
        const levelConfig = CONFIG.LEVEL_CONFIG.find(conf => conf.level === i);
        if (!levelConfig) continue;

        const levelSegment = document.createElement('div');
        levelSegment.classList.add('level-segment');
        // Set height proportional to the number of rounds in this level
        levelSegment.style.height = `${(levelConfig.rounds / totalRoundsAcrossAllLevels) * 100}%`; 
        levelSegment.style.flexShrink = 0; // Prevent shrinking

        const levelHue = calculateLevelHue(i);
        
        if (i < currentLevel) {
            // Completed levels: solid color, slightly darker
            levelSegment.style.background = `hsl(${levelHue}, 70%, 40%)`;
            levelSegment.style.border = `1px solid hsl(${levelHue}, 50%, 30%)`;
            levelSegment.style.boxShadow = `inset 0 0 5px hsla(${levelHue}, 50%, 30%, 0.5)`;
        } else if (i === currentLevel) {
            // Current level: contains the 'liquid' fill
            levelSegment.classList.add('current-level-track'); // Mark as current track for potential specific styling
            levelSegment.style.background = `rgba(0, 0, 0, 0.4)`; // Background for the empty part of current track
            levelSegment.style.border = `2px solid hsl(${levelHue}, 70%, 50%)`; // Brighter border for current
            levelSegment.style.boxShadow = `0 0 10px hsla(${levelHue}, 70%, 60%, 0.6), inset 0 0 5px hsla(${levelHue}, 50%, 30%, 0.3)`;

            const currentFill = document.createElement('div');
            currentFill.classList.add('current-level-fill');
            currentFill.style.height = `${currentRoundProgress * 100}%`; // Fill percentage
            currentFill.style.background = `linear-gradient(to bottom, 
                hsl(${levelHue}, 60%, 70%), 
                hsl(${levelHue}, 50%, 65%), 
                hsl(${levelHue}, 70%, 75%),
                hsl(${levelHue}, 60%, 70%)`; // Use HSL colors
            currentFill.style.animation = 'silverFlow 3s linear infinite';
            currentFill.style.borderRadius = 'inherit'; // Inherit border radius from parent

            levelSegment.appendChild(currentFill);
        } else {
            // Future levels: darker placeholder
            levelSegment.style.background = `hsl(${levelHue}, 30%, 15%)`;
            levelSegment.style.border = `1px dashed hsl(${levelHue}, 20%, 10%)`;
            levelSegment.style.boxShadow = `inset 0 0 3px rgba(0,0,0,0.5)`;
        }
        // Apply common styles
        levelSegment.style.borderRadius = '5px';
        levelSegment.style.marginBottom = '2px';
        levelSegment.style.width = '100%';
        progressIndicator.appendChild(levelSegment);
    }
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
loadProgress(); // Load progress before initializing
initializeLevel();
updateFaceState('thinking', getNextTip()); // 'thinking' state will now display the default straight mouth or randomly switch
renderSequence();
updateGameContainerSize();

// The restart button is now always visible via CSS, no need to hide it on initial load.

// Add listener for window resize to adjust scaling
window.addEventListener('resize', updateGameContainerSize);

// Throttled mouse tracking for eyes using rAF
let eyeRAFId = null;
let lastMouseEvent = null;

document.addEventListener('mousemove', (e) => {
    lastMouseEvent = e;
    if (eyeRAFId) return;
    eyeRAFId = requestAnimationFrame(() => {
        eyeRAFId = null;
        const faceContainer = document.querySelector('.face-container');
        const rect = faceContainer?.getBoundingClientRect();
        if (!rect || !lastMouseEvent) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (lastMouseEvent.clientX - centerX) / 20;
        const deltaY = (lastMouseEvent.clientY - centerY) / 20;
        
        const leftEye = document.querySelector('.left-eye');
        const rightEye = document.querySelector('.right-eye');
        
        const clampedX = Math.max(-3, Math.min(3, deltaX));
        const clampedY = Math.max(-3, Math.min(3, deltaY));

        if (leftEye) {
            leftEye.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }
        if (rightEye) {
            rightEye.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }
    });
}, { passive: true });

restartBtn.addEventListener('click', () => {
    sounds.button_click.play().catch(e => console.log('Audio play failed:', e));
    
    // Only increment fails and show a reset message if the player resets *before* losing.
    if (!isGameOver) {
        // Increment total fails when the restart button is clicked before a game over.
        totalFails++;
        saveProgress(); // Save the updated fails count
        if (totalFailsEl) totalFailsEl.textContent = `Fails: ${totalFails}`;

        // Mock player for using reset if past level 1 and not already in a game over state.
        if (currentLevel > 1) {
            showSpeechBubble(getResetDialogue(), 4000);
        }
    }

    currentRound = 1;
    // Keep currentLevel as is on restart, user can reset progress in settings.
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

// Add loading screen hide logic here
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // Load settings when the DOM is ready

    const loadingScreen = document.getElementById('loading-screen');
    const gameContainer = document.querySelector('.game-container');

    if (loadingScreen) {
        // The animation is 4s. After it's done, fade out the loading screen.
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            
            loadingScreen.addEventListener('transitionend', () => {
                loadingScreen.style.display = 'none';
                // Trigger the glitch-in animation for the game container
                if (gameContainer) {
                    gameContainer.classList.add('glitch-in');
                }
            }, { once: true });
        }, 4000); // Matches animation duration in CSS
    } else {
        // If no loading screen, just make game visible
        if (gameContainer) {
            gameContainer.style.visibility = 'visible';
        }
    }
});