// ========== VARIABLES GLOBALES DEL REPRODUCTOR ==========
let currentTrack = null;
let isPlaying = false;
let youtubePlayer = null;
let currentVideoId = '';
let repeatMode = 0; // 0: no repeat, 1: repeat one, 2: repeat all
let currentQueue = [];
let shuffleActive = false;
let playlists = {};
let progressInterval = null;
let userHasInteracted = false;
let audioContext = null;

// ========== INICIALIZACIÓN DEL REPRODUCTOR ==========
// ========== INICIALIZACIÓN DEL REPRODUCTOR ==========
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si las variables globales existen
    if (typeof YOUTUBE_API_KEY === 'undefined') {
        window.YOUTUBE_API_KEY = document.body.dataset.apiKey || '';
        window.HAS_API_KEY = !!window.YOUTUBE_API_KEY;
    }
    
    console.log('🎵 PonyCanion Player inicializado...');
    console.log('API Key disponible:', window.HAS_API_KEY ? '✅' : '❌');
    console.log('API Key:', window.YOUTUBE_API_KEY ? `${window.YOUTUBE_API_KEY.substring(0, 10)}...` : 'No configurada');
    
    // ... resto del código
});

// ========== AUDIO CONTEXT (PARA DESBLOQUEAR AUTOPLAY) ==========
function initializeAudioContext() {
    try {
        if (window.AudioContext || window.webkitAudioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext inicializado');
        }
    } catch (error) {
        console.warn('No se pudo inicializar AudioContext:', error);
    }
}

// ========== CONFIGURACIÓN DE EVENTOS ==========
function setupPlayerEventListeners() {
    // Interacción del usuario para desbloquear audio
    document.addEventListener('click', function() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            console.log('Usuario interactuó - audio desbloqueado');
            
            // Resumir AudioContext si está suspendido
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('AudioContext resumido');
                });
            }
            
            showNotification('🔊 Audio desbloqueado. Ahora puedes reproducir música.', 'info');
        }
    });
    
    // Controles del reproductor
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('previousBtn').addEventListener('click', previousTrack);
    document.getElementById('nextBtn').addEventListener('click', nextTrack);
    document.getElementById('repeatBtn').addEventListener('click', toggleRepeat);
    document.getElementById('shuffleBtn').addEventListener('click', toggleShuffle);
    document.getElementById('progressBar').addEventListener('click', seekTrack);
    document.getElementById('volumeSlider').addEventListener('input', (e) => setVolume(e.target.value));
    
    // Prevenir carga de imágenes rotas
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            if (e.target.src && e.target.src.includes('undefined')) {
                e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80';
            }
        }
    }, true);
}

// ========== REPRODUCCIÓN ==========
function playTrack(videoId, trackInfo) {
    if (!trackInfo) return;
    
    currentTrack = trackInfo;
    currentVideoId = videoId;
    
    updatePlayerUI();
    
    // Si no hay interacción del usuario, mostrar mensaje
    //if (!userHasInteracted) {
     //   showNotification('👆 Haz clic en cualquier parte de la pantalla para activar el audio', 'warning');
      //  return;
    //}
    
    // Obtener API Key del script
    const YOUTUBE_API_KEY = document.querySelector('script').innerText.match(/YOUTUBE_API_KEY = '([^']+)'/)?.[1] || '';
    const hasValidAPIKey = !!YOUTUBE_API_KEY;
    
    // Si hay API key y el reproductor está listo, usar YouTube
    if (window.HAS_API_KEY && youtubePlayer && youtubePlayer.loadVideoById) {
        try {
            youtubePlayer.loadVideoById(videoId);
            
            // Pequeña pausa para asegurar la carga
            setTimeout(() => {
                if (youtubePlayer.playVideo) {
                    youtubePlayer.playVideo();
                    isPlaying = true;
                    updatePlayPauseButton();
                    showNotification(`▶️ Reproduciendo: ${trackInfo.title}`, 'success');
                }
            }, 800);
            
        } catch (error) {
            console.error('Error al reproducir con YouTube:', error);
            simulateAudioPlayback();
        }
    } else {
        // Modo simulador
        simulateAudioPlayback();
    }
    
    // Añadir a la cola si no está
    if (!currentQueue.some(t => t.video_id === videoId)) {
        currentQueue.push(trackInfo);
    }
}

// ========== MODO SIMULADOR ==========
function simulateAudioPlayback() {
    console.log('🎭 Modo simulador activado');
    isPlaying = true;
    updatePlayPauseButton();
    simulateAudioProgress();
    showNotification(`🎵 Simulando reproducción: ${currentTrack?.title || 'Canción'}`, 'info');
}

function simulateAudioProgress() {
    if (progressInterval) clearInterval(progressInterval);
    
    let currentTime = 0;
    const totalTime = 180;
    
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    
    progressInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(progressInterval);
            return;
        }
        
        currentTime += 1;
        const progressPercent = (currentTime / totalTime) * 100;
        
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        
        if (currentTime >= totalTime) {
            clearInterval(progressInterval);
            handleTrackEnd();
        }
    }, 1000);
}

// ========== CONTROLES DE REPRODUCCIÓN ==========
function togglePlayPause() {
    if (!currentTrack) {
        showNotification('🎵 Selecciona una canción primero', 'warning');
        return;
    }
    
    // Verificar interacción del usuario
    if (!userHasInteracted) {
        showNotification('👆 Haz clic en cualquier parte de la pantalla para activar el audio', 'warning');
        return;
    }
    
    const YOUTUBE_API_KEY = document.querySelector('script').innerText.match(/YOUTUBE_API_KEY = '([^']+)'/)?.[1] || '';
    const hasValidAPIKey = !!YOUTUBE_API_KEY;
    
    if (youtubePlayer && window.HAS_API_KEY) {
        try {
            if (isPlaying) {
                youtubePlayer.pauseVideo();
                isPlaying = false;
                showNotification('⏸️ Pausado', 'info');
            } else {
                youtubePlayer.playVideo();
                isPlaying = true;
                showNotification('▶️ Reproduciendo', 'success');
            }
            updatePlayPauseButton();
        } catch (error) {
            console.error('Error controlando YouTube:', error);
            simulateAudioControl();
        }
    } else {
        simulateAudioControl();
    }
}

function simulateAudioControl() {
    if (isPlaying) {
        isPlaying = false;
        if (progressInterval) clearInterval(progressInterval);
        showNotification('⏸️ Pausado (simulado)', 'info');
    } else {
        isPlaying = true;
        simulateAudioProgress();
        showNotification('▶️ Reproduciendo (simulado)', 'info');
    }
    updatePlayPauseButton();
}

function previousTrack() {
    if (currentQueue.length === 0) return;
    
    const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
    let prevIndex = currentIndex > 0 ? currentIndex - 1 : currentQueue.length - 1;
    
    if (currentQueue[prevIndex]) {
        const prevTrack = currentQueue[prevIndex];
        playTrack(prevTrack.video_id, prevTrack);
    }
}

function nextTrack() {
    if (currentQueue.length === 0) return;
    
    const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
    let nextIndex = (currentIndex + 1) % currentQueue.length;
    
    if (currentQueue[nextIndex]) {
        const nextTrack = currentQueue[nextIndex];
        playTrack(nextTrack.video_id, nextTrack);
    }
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const repeatBtn = document.getElementById('repeatBtn');
    const icon = document.getElementById('repeatIcon');
    
    // Quitar clase active primero
    repeatBtn.classList.remove('active');
    
    switch(repeatMode) {
        case 0:
            icon.className = 'fas fa-redo';
            repeatBtn.title = 'Repetir desactivado';
            showNotification('🔁 Repetición: Desactivada', 'info');
            break;
        case 1:
            icon.className = 'fas fa-redo';
            repeatBtn.title = 'Repetir una canción';
            repeatBtn.classList.add('active');
            showNotification('🔂 Repetición: Una canción', 'info');
            break;
        case 2:
            icon.className = 'fas fa-infinity';
            repeatBtn.title = 'Repetir todas';
            repeatBtn.classList.add('active');
            showNotification('🔁 Repetición: Todas', 'info');
            break;
    }
}

function toggleShuffle() {
    shuffleActive = !shuffleActive;
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    if (shuffleActive) {
        shuffleBtn.classList.add('active');
        shuffleBtn.style.color = 'var(--primary)';
        showNotification('🔀 Modo aleatorio activado', 'info');
        
        // Mezclar la cola manteniendo la canción actual al principio
        if (currentQueue.length > 0) {
            const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
            const currentTrackItem = currentQueue[currentIndex];
            
            const shuffled = [...currentQueue];
            shuffled.splice(currentIndex, 1);
            
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            shuffled.unshift(currentTrackItem);
            currentQueue = shuffled;
        }
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.style.color = '';
        showNotification('Modo aleatorio desactivado', 'info');
    }
}

function seekTrack(event) {
    const YOUTUBE_API_KEY = document.querySelector('script').innerText.match(/YOUTUBE_API_KEY = '([^']+)'/)?.[1] || '';
    const hasValidAPIKey = !!YOUTUBE_API_KEY;
    
    if (!window.HAS_API_KEY || !youtubePlayer || !currentTrack) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
    const duration = youtubePlayer.getDuration();
    const newTime = duration * percentage;
    
    youtubePlayer.seekTo(newTime, true);
    
    // Actualizar visualmente
    document.getElementById('progressFill').style.width = `${percentage * 100}%`;
    document.getElementById('currentTime').textContent = formatTime(newTime);
}

function setVolume(value) {
    const volume = parseInt(value);
    const icon = document.getElementById('volumeIcon');
    
    if (volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (volume < 50) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
    
    if (youtubePlayer) {
        youtubePlayer.setVolume(volume);
    }
}

function handleTrackEnd() {
    isPlaying = false;
    updatePlayPauseButton();
    
    switch(repeatMode) {
        case 1: // Repeat one
            const YOUTUBE_API_KEY = document.querySelector('script').innerText.match(/YOUTUBE_API_KEY = '([^']+)'/)?.[1] || '';
            const hasValidAPIKey = !!YOUTUBE_API_KEY;
            
            if (hasValidAPIKey && youtubePlayer) {
                youtubePlayer.seekTo(0);
                youtubePlayer.playVideo();
                isPlaying = true;
                updatePlayPauseButton();
            } else {
                simulateAudioProgress();
            }
            break;
        case 2: // Repeat all
            setTimeout(() => nextTrack(), 1000);
            break;
    }
}

// ========== UTILIDADES ==========
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updatePlayPauseButton() {
    const icon = document.getElementById('playPauseIcon');
    if (icon) {
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

function updatePlayerUI() {
    const titleEl = document.getElementById('currentTrackTitle');
    const artistEl = document.getElementById('currentTrackArtist');
    const imageEl = document.getElementById('currentTrackImage');
    
    if (titleEl) titleEl.textContent = currentTrack?.title || 'No hay canción seleccionada';
    if (artistEl) artistEl.textContent = currentTrack?.channel_title || 'Selecciona una canción para comenzar';
    if (imageEl) {
        const thumbnail = currentTrack?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80';
        imageEl.src = thumbnail;
        imageEl.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80';
        };
    }
}

// ========== CONTENIDO INICIAL ==========
function loadInitialContent() {
    const recentTracks = [
        {
            video_id: 'dQw4w9WgXcQ',
            title: 'Never Gonna Give You Up',
            channel_title: 'Rick Astley',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        },
        {
            video_id: 'kJQP7kiw5Fk',
            title: 'Despacito',
            channel_title: 'Luis Fonsi ft. Daddy Yankee',
            thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg'
        },
        {
            video_id: 'JGwWNGJdvx8',
            title: 'Shape of You',
            channel_title: 'Ed Sheeran',
            thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg'
        },
        {
            video_id: 'ru0K8uYEZWw',
            title: 'Blinding Lights',
            channel_title: 'The Weeknd',
            thumbnail: 'https://i.ytimg.com/vi/ru0K8uYEZWw/mqdefault.jpg'
        }
    ];
    
    const recommendations = [
        {
            video_id: 'TdrL3QxjyVw',
            title: 'Bad Guy',
            channel_title: 'Billie Eilish',
            thumbnail: 'https://i.ytimg.com/vi/TdrL3QxjyVw/mqdefault.jpg'
        },
        {
            video_id: '2Vv-BfVoq4g',
            title: 'Perfect',
            channel_title: 'Ed Sheeran',
            thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/mqdefault.jpg'
        },
        {
            video_id: '5qm8PH4xAss',
            title: 'Dynamite',
            channel_title: 'BTS',
            thumbnail: 'https://i.ytimg.com/vi/5qm8PH4xAss/mqdefault.jpg'
        },
        {
            video_id: 'k2qgadSvNyU',
            title: 'Levitating',
            channel_title: 'Dua Lipa',
            thumbnail: 'https://i.ytimg.com/vi/k2qgadSvNyU/mqdefault.jpg'
        }
    ];
    
    // Usar función displaySearchResults para mostrar contenido inicial
    if (typeof displaySearchResults === 'function') {
        const recentGrid = document.getElementById('recentGrid');
        const recommendationsGrid = document.getElementById('recommendationsGrid');
        
        if (recentGrid) displaySearchResults(recentTracks, recentGrid, true);
        if (recommendationsGrid) displaySearchResults(recommendations, recommendationsGrid, true);
    }
}

// ========== YOUTUBE PLAYER ==========
function initializeYouTubePlayer() {
    // Si ya está cargado, crear el reproductor
    if (window.YT && window.YT.Player) {
        createYouTubePlayer();
        return;
    }
    
    // Configurar callback para cuando la API esté lista
    window.onYouTubeIframeAPIReady = function() {
        console.log('YouTube API Ready');
        createYouTubePlayer();
    };
    
    // Cargar la API de YouTube
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.body.appendChild(tag);
    
    // Timeout por si falla la carga
    setTimeout(() => {
        if (!youtubePlayer) {
            console.warn('YouTube Player no se pudo inicializar. Usando modo simulador.');
            showNotification('Reproductor de YouTube no disponible. Usando modo simulador.', 'warning');
        }
    }, 5000);
}

function createYouTubePlayer() {
    try {
        console.log('Creando reproductor de YouTube...');
        
        youtubePlayer = new YT.Player('youtubePlayer', {
            height: '0',
            width: '0',
            videoId: '',
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'enablejsapi': 1,
                'fs': 0,
                'iv_load_policy': 3,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0,
                'showinfo': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    } catch (error) {
        console.error('Error creando YouTube player:', error);
        showNotification('Error al crear reproductor de YouTube', 'error');
    }
}

function onPlayerReady(event) {
    console.log('YouTube Player Ready');
    event.target.setVolume(80);
    showNotification('Reproductor de YouTube listo ✅', 'success');
}

function onPlayerStateChange(event) {
    console.log('Estado del player:', event.data);
    
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayPauseButton();
        
        const duration = event.target.getDuration();
        document.getElementById('totalTime').textContent = formatTime(duration);
        
        // Actualizar progreso continuamente
        const updateProgress = () => {
            if (isPlaying && event.target.getCurrentTime) {
                const currentTime = event.target.getCurrentTime();
                const duration = event.target.getDuration();
                const progressPercent = (currentTime / duration) * 100;
                
                document.getElementById('progressFill').style.width = `${progressPercent}%`;
                document.getElementById('currentTime').textContent = formatTime(currentTime);
                
                if (isPlaying) {
                    requestAnimationFrame(updateProgress);
                }
            }
        };
        updateProgress();
        
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayPauseButton();
    } else if (event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        updatePlayPauseButton();
        handleTrackEnd();
    }
}

function onPlayerError(event) {
    console.error('Error en YouTube Player:', event.data);
    showNotification('Error al reproducir el video. Intenta con otra canción.', 'error');
    isPlaying = false;
    updatePlayPauseButton();
}

// ========== PLAYLIST FUNCTIONS ==========
function loadPlaylists() {
    try {
        const stored = localStorage.getItem('ponycanion_playlists');
        if (stored) {
            playlists = JSON.parse(stored);
        } else {
            playlists = {
                'fav': { id: 'fav', name: 'Favoritas ❤️', tracks: [] },
                'chill': { id: 'chill', name: 'Chill 🌙', tracks: [] },
                'party': { id: 'party', name: 'Fiesta 🎉', tracks: [] }
            };
        }
    } catch (error) {
        console.error('Error cargando playlists:', error);
        playlists = {
            'fav': { id: 'fav', name: 'Favoritas ❤️', tracks: [] }
        };
    }
}

function savePlaylists() {
    localStorage.setItem('ponycanion_playlists', JSON.stringify(playlists));
}

function renderPlaylistsSidebar() {
    const container = document.getElementById('playlistsSidebar');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(playlists).forEach(playlist => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.innerHTML = `
            <i class="fas fa-list"></i>
            <span>${playlist.name}</span>
        `;
        
        item.addEventListener('click', () => {
            loadSection('library');
            showPlaylistDetail(playlist.id);
        });
        
        container.appendChild(item);
    });
}

function createPlaylist() {
    const name = prompt('Nombre de la playlist:');
    if (name && name.trim()) {
        const id = 'pl_' + Date.now();
        playlists[id] = {
            id: id,
            name: name.trim(),
            tracks: []
        };
        savePlaylists();
        renderPlaylistsSidebar();
        showNotification(`✅ Playlist "${name}" creada`, 'success');
    }
}

function showPlaylistDetail(playlistId) {
    const playlist = playlists[playlistId];
    if (!playlist) return;
    
    const grid = document.getElementById('playlistsGrid');
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; background: linear-gradient(135deg, var(--primary), var(--primary-light)); padding: 30px; border-radius: 12px; color: white;">
            <h2 style="color:white;margin-bottom:10px;">${playlist.name}</h2>
            <p style="color:rgba(255,255,255,0.9);">${playlist.tracks.length} canciones</p>
        </div>
    `;
    
    if (playlist.tracks.length === 0) {
        grid.innerHTML += `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-music fa-3x" style="color: var(--primary); opacity: 0.5;"></i>
                <h3 style="margin: 20px 0 10px; color: var(--light);">Playlist vacía</h3>
                <p>Añade canciones para comenzar</p>
            </div>
        `;
    } else {
        playlist.tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <img src="${track.thumbnail}" 
                     onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'"
                     alt="${track.title}">
                <h4>${track.title}</h4>
                <p>${track.channel_title || 'Artista'}</p>
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            `;
            
            card.addEventListener('click', () => {
                currentQueue = [...playlist.tracks];
                playTrack(track.video_id, track);
            });
            
            grid.appendChild(card);
        });
    }
}

// ========== NOTIFICACIONES ==========
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="${icon}" style="color: ${type === 'error' ? '#ff6b6b' : type === 'success' ? 'var(--primary)' : type === 'warning' ? '#ffc107' : 'var(--primary)'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -20px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}