// Collection of game sound effects
const sounds = {
    place: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_731c518840.mp3'),
    button_click: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c359e9a489.mp3'),
    level_complete: new Audio('https://cdn.pixabay.com/audio/2022/01/18/audio_138b72e505.mp3'),
    game_over: new Audio('https://cdn.pixabay.com/audio/2022/03/13/audio_a498a30a6d.mp3')
};

function applySettings(settings) {
    for (const key in sounds) {
        if (sounds[key] instanceof Audio) {
            sounds[key].volume = settings.sfxVolume;
        }
    }
}

export { sounds, applySettings };