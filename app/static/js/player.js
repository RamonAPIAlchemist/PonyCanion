// ========== VARIABLES GLOBALES ==========
let currentTrack = null;
let isPlaying = false;
let currentVideoId = '';
let repeatMode = 0; // 0: no repeat, 1: repeat one, 2: repeat all
let currentQueue = [];
let originalQueue = [];
let shuffleActive = false;
let progressInterval = null;
let history = [];

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 PonyCanion Player - SISTEMA MEJORADO');
    
    // Hacer funciones globales
    window.playTrack = playTrack;
    window.createTrackCards = createTrackCards;
    window.togglePlaylist = togglePlaylist;
    window.toggleHistory = toggleHistory;
    window.clearHistory = clearHistory;
    window.removeFromQueue = removeFromQueue;
    
    setupEventListeners();
    loadSavedData();
    loadWorkingContent();
    
    console.log('✅ Sistema mejorado listo');
});

// ========== PERSISTENCIA DE DATOS ==========
function loadSavedData() {
    // Cargar historial guardado
    const savedHistory = localStorage.getItem('ponycanion_history');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
    
    // Cargar cola guardada
    const savedQueue = localStorage.getItem('ponycanion_queue');
    if (savedQueue) {
        currentQueue = JSON.parse(savedQueue);
        updateQueueDisplay();
    }
    
    // Cargar preferencias
    const savedVolume = localStorage.getItem('ponycanion_volume');
    if (savedVolume) {
        document.getElementById('volumeSlider').value = savedVolume;
        setVolume(savedVolume);
    }
}

function saveData() {
    localStorage.setItem('ponycanion_history', JSON.stringify(history.slice(0, 50))); // Guardar últimos 50
    localStorage.setItem('ponycanion_queue', JSON.stringify(currentQueue));
    localStorage.setItem('ponycanion_volume', document.getElementById('volumeSlider').value);
}

// ========== CONTENIDO FUNCIONAL ==========
function loadWorkingContent() {
    console.log('🎵 Cargando contenido funcional...');
    
    const featuredTracks = [
        {
            video_id: '5qap5aO4i9A',
            title: 'lofi hip hop radio 📚',
            channel_title: 'Lofi Girl',
            thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg',
            duration: 'LIVE',
            category: 'lofi'
        },
        {
            video_id: 'jfKfPfyJRdk',
            title: 'lofi hip hop radio',
            channel_title: 'Lofi Girl',
            thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg',
            duration: 'LIVE',
            category: 'lofi'
        },
        {
            video_id: 'DWcJFNfaw9c',
            title: 'Chillhop Radio',
            channel_title: 'Chillhop Music',
            thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg',
            duration: 'LIVE',
            category: 'chillhop'
        },
        {
            video_id: 'N6L5L3fudHU',
            title: 'Jazz & Bossa Nova Radio',
            channel_title: 'Relaxing Jazz Cafe',
            thumbnail: 'https://i.ytimg.com/vi/N6L5L3fudHU/mqdefault.jpg',
            duration: 'LIVE',
            category: 'jazz'
        }
    ];
    
    const recommendations = [
        {
            video_id: '3AtDnEC4zak',
            title: 'Study Music Alpha Waves',
            channel_title: 'Greenred Productions',
            thumbnail: 'https://i.ytimg.com/vi/3AtDnEC4zak/mqdefault.jpg',
            duration: '3:00:00',
            category: 'study'
        },
        {
            video_id: 'pYkqKzO4uL8',
            title: 'Relaxing Piano Music',
            channel_title: 'Soothing Relaxation',
            thumbnail: 'https://i.ytimg.com/vi/pYkqKzO4uL8/mqdefault.jpg',
            duration: '3:00:00',
            category: 'piano'
        },
        {
            video_id: '7NOSDKb0HlU',
            title: 'Ambient Study Music',
            channel_title: 'College Music',
            thumbnail: 'https://i.ytimg.com/vi/7NOSDKb0HlU/mqdefault.jpg',
            duration: '1:00:00',
            category: 'ambient'
        },
        {
            video_id: 'mcQYqHdHqOc',
            title: 'Synthwave Radio',
            channel_title: 'NewRetroWave',
            thumbnail: 'https://i.ytimg.com/vi/mcQYqHdHqOc/mqdefault.jpg',
            duration: 'LIVE',
            category: 'synthwave'
        }
    ];
    
    // Crear tarjetas
    createTrackCards(featuredTracks, 'recentGrid');
    createTrackCards(recommendations, 'recommendationsGrid');
    
    // Inicializar cola si está vacía
    if (currentQueue.length === 0) {
        currentQueue = [...featuredTracks];
        originalQueue = [...featuredTracks];
        updateQueueDisplay();
        saveData();
    }
    
    console.log(`✅ ${featuredTracks.length + recommendations.length} canciones funcionales cargadas`);
    
    // Auto-reproducir primera canción después de 2 segundos
    setTimeout(() => {
        if (currentQueue.length > 0 && !currentTrack) {
            playTrack(currentQueue[0].video_id, currentQueue[0]);
        }
    }, 2000);
}

// ========== REPRODUCCIÓN PRINCIPAL ==========
function playTrack(videoId, trackInfo) {
    if (!trackInfo || !videoId) return;
    
    console.log(`▶️ Reproduciendo: ${trackInfo.title}`);
    
    // Añadir al historial si no es la misma canción
    if (!history.some(h => h.video_id === videoId) || history[0]?.video_id !== videoId) {
        history.unshift({
            ...trackInfo,
            played_at: new Date().toISOString()
        });
        updateHistoryDisplay();
        saveData();
    }
    
    currentTrack = trackInfo;
    currentVideoId = videoId;
    isPlaying = true;
    
    // Actualizar UI
    updateNowPlaying(trackInfo);
    document.getElementById('playPauseIcon').className = 'fas fa-pause';
    
    // Crear iframe de YouTube
    createYouTubeIframe(videoId);
    
    // Añadir a cola si no existe
    if (!currentQueue.some(t => t.video_id === videoId)) {
        addToQueue(trackInfo);
    }
    
    // Resaltar canción actual en cola
    highlightCurrentTrackInQueue();
    
    showNotification(`🎵 Reproduciendo: ${trackInfo.title}`, 'success');
}

function createYouTubeIframe(videoId) {
    // Limpiar iframe anterior
    const oldIframe = document.getElementById('youtubeIframe');
    if (oldIframe) {
        oldIframe.remove();
    }
    
    // Crear contenedor
    let container = document.getElementById('youtubePlayerContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'youtubePlayerContainer';
        container.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(container);
    }
    
    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'youtubeIframe';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    
    container.appendChild(iframe);
    
    // Iniciar barra de progreso
    startProgressSimulation();
}

function updateNowPlaying(trackInfo) {
    const elements = {
        'currentTrackTitle': trackInfo.title,
        'currentTrackArtist': trackInfo.channel_title,
        'currentTrackImage': trackInfo.thumbnail
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'currentTrackImage') {
                el.src = value;
                el.onerror = function() {
                    this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23222"/><text x="50" y="55" font-family="Arial" font-size="12" fill="white" text-anchor="middle">🎵</text></svg>';
                };
            } else {
                el.textContent = value;
            }
        }
    });
}

// ========== GESTIÓN DE COLAS ==========
function addToQueue(trackInfo) {
    currentQueue.push(trackInfo);
    updateQueueDisplay();
    saveData();
    showNotification(`➕ Añadido a la cola: ${trackInfo.title}`, 'info');
}

function removeFromQueue(videoId, event) {
    if (event) event.stopPropagation();
    
    // No permitir eliminar la canción que se está reproduciendo
    if (videoId === currentVideoId) {
        showNotification('No puedes eliminar la canción en reproducción', 'warning');
        return;
    }
    
    currentQueue = currentQueue.filter(track => track.video_id !== videoId);
    updateQueueDisplay();
    saveData();
    showNotification('🗑️ Canción eliminada de la cola', 'info');
}

function clearQueue() {
    if (currentVideoId && currentQueue.length > 1) {
        // Mantener solo la canción actual
        const current = currentQueue.find(t => t.video_id === currentVideoId);
        currentQueue = current ? [current] : [];
        updateQueueDisplay();
        saveData();
        showNotification('🗑️ Cola limpiada', 'info');
    }
}

function updateQueueDisplay() {
    const queueContainer = document.getElementById('queueList');
    if (!queueContainer) return;
    
    queueContainer.innerHTML = '';
    
    if (currentQueue.length === 0) {
        queueContainer.innerHTML = `
            <div class="empty-queue">
                <i class="fas fa-music"></i>
                <p>La cola está vacía</p>
            </div>
        `;
        return;
    }
    
    currentQueue.forEach((track, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        if (track.video_id === currentVideoId) {
            queueItem.classList.add('current-playing');
        }
        
        queueItem.innerHTML = `
            <div class="queue-item-info">
                <span class="queue-number">${index + 1}</span>
                <img src="${track.thumbnail}" 
                     alt="${track.title}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23222\"/><text x=\"50\" y=\"55\" font-family=\"Arial\" font-size=\"12\" fill=\"white\" text-anchor=\"middle\">🎵</text></svg>'">
                <div class="queue-track-details">
                    <h4>${track.title}</h4>
                    <p>${track.channel_title}</p>
                </div>
            </div>
            <div class="queue-item-actions">
                <span class="queue-duration">${track.duration}</span>
                <button class="queue-remove-btn" onclick="removeFromQueue('${track.video_id}', event)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        queueItem.addEventListener('click', (e) => {
            if (!e.target.closest('.queue-remove-btn')) {
                playTrack(track.video_id, track);
            }
        });
        
        queueContainer.appendChild(queueItem);
    });
}

function highlightCurrentTrackInQueue() {
    document.querySelectorAll('.queue-item').forEach(item => {
        item.classList.remove('current-playing');
    });
    
    const currentItem = document.querySelector(`.queue-item[data-video-id="${currentVideoId}"]`);
    if (currentItem) {
        currentItem.classList.add('current-playing');
    }
}

// ========== GESTIÓN DE HISTORIAL ==========
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('historyList');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <p>No hay historial de reproducción</p>
            </div>
        `;
        return;
    }
    
    // Mostrar solo los últimos 20 elementos
    history.slice(0, 20).forEach((track, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const playedDate = new Date(track.played_at);
        const timeAgo = getTimeAgo(playedDate);
        
        historyItem.innerHTML = `
            <div class="history-item-info">
                <span class="history-number">${index + 1}</span>
                <img src="${track.thumbnail}" 
                     alt="${track.title}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100" height="100" fill="%23222"/><text x="50" y="55" font-family="Arial" font-size="12" fill="white" text-anchor="middle">🎵</text></svg>'">
                <div class="history-track-details">
                    <h4>${track.title}</h4>
                    <p>${track.channel_title}</p>
                    <span class="history-time">${timeAgo}</span>
                </div>
            </div>
            <button class="history-play-btn" onclick="playTrack('${track.video_id}', ${JSON.stringify(track).replace(/'/g, "\\'")})">
                <i class="fas fa-play"></i>
            </button>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

function clearHistory() {
    if (history.length > 0) {
        history = [];
        updateHistoryDisplay();
        saveData();
        showNotification('🗑️ Historial limpiado', 'info');
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 7)} sem`;
}

// ========== BARRA DE PROGRESO ==========
function startProgressSimulation() {
    stopProgressSimulation();
    
    let currentTime = 0;
    const totalTime = 180; // 3 minutos
    
    // Actualizar tiempos
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    
    progressInterval = setInterval(() => {
        if (!isPlaying) return;
        
        currentTime += 1;
        const progressPercent = (currentTime / totalTime) * 100;
        
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        
        if (currentTime >= totalTime) {
            handleTrackEnd();
        }
    }, 1000);
}

function stopProgressSimulation() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function seekTrack(event) {
    if (!currentTrack) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
    
    // Actualizar visualmente
    document.getElementById('progressFill').style.width = `${percentage * 100}%`;
    
    // Calcular nuevo tiempo
    const totalSeconds = 180;
    const newTime = totalSeconds * percentage;
    document.getElementById('currentTime').textContent = formatTime(newTime);
    
    showNotification('⏩ Progreso ajustado', 'info');
}

// ========== CONTROLES DE REPRODUCCIÓN ==========
function togglePlayPause() {
    if (!currentTrack) {
        showNotification('Selecciona una canción primero', 'warning');
        return;
    }
    
    const iframe = document.getElementById('youtubeIframe');
    
    if (isPlaying) {
        // Pausar
        if (iframe) {
            iframe.src = iframe.src.replace('autoplay=1', 'autoplay=0');
        }
        document.getElementById('playPauseIcon').className = 'fas fa-play';
        stopProgressSimulation();
        showNotification('⏸️ Pausado', 'info');
    } else {
        // Reanudar
        if (iframe) {
            iframe.src = iframe.src.replace('autoplay=0', 'autoplay=1');
        } else {
            createYouTubeIframe(currentVideoId);
        }
        document.getElementById('playPauseIcon').className = 'fas fa-pause';
        startProgressSimulation();
        showNotification('▶️ Reproduciendo', 'success');
    }
    
    isPlaying = !isPlaying;
}

function previousTrack() {
    if (currentQueue.length === 0) return;
    
    const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
    let prevIndex = currentIndex > 0 ? currentIndex - 1 : currentQueue.length - 1;
    
    if (currentQueue[prevIndex]) {
        playTrack(currentQueue[prevIndex].video_id, currentQueue[prevIndex]);
    }
}

function nextTrack() {
    if (currentQueue.length === 0) return;
    
    const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
    let nextIndex = (currentIndex + 1) % currentQueue.length;
    
    if (currentQueue[nextIndex]) {
        playTrack(currentQueue[nextIndex].video_id, currentQueue[nextIndex]);
    }
}

function handleTrackEnd() {
    if (repeatMode === 1) {
        // Repetir una canción
        setTimeout(() => playTrack(currentVideoId, currentTrack), 1000);
    } else if (repeatMode === 2) {
        // Repetir todas
        setTimeout(() => nextTrack(), 1000);
    } else if (currentQueue.length > 0) {
        // Siguiente canción
        const currentIndex = currentQueue.findIndex(t => t.video_id === currentVideoId);
        if (currentIndex < currentQueue.length - 1) {
            setTimeout(() => nextTrack(), 1000);
        }
    }
}

// ========== FUNCIONES TOGGLE ==========
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('repeatBtn');
    const icon = document.getElementById('repeatIcon');
    
    if (!btn || !icon) return;
    
    btn.classList.remove('active');
    
    switch(repeatMode) {
        case 0:
            icon.className = 'fas fa-redo';
            showNotification('🔁 Repetición: Desactivada', 'info');
            break;
        case 1:
            icon.className = 'fas fa-redo';
            btn.classList.add('active');
            showNotification('🔂 Repetición: Una canción', 'info');
            break;
        case 2:
            icon.className = 'fas fa-infinity';
            btn.classList.add('active');
            showNotification('🔁 Repetición: Todas', 'info');
            break;
    }
}

function toggleShuffle() {
    shuffleActive = !shuffleActive;
    const btn = document.getElementById('shuffleBtn');
    
    if (!btn) return;
    
    if (shuffleActive) {
        btn.classList.add('active');
        showNotification('🔀 Modo aleatorio activado', 'info');
        
        // Mezclar cola manteniendo la actual primera
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
            updateQueueDisplay();
        }
    } else {
        btn.classList.remove('active');
        showNotification('Modo aleatorio desactivado', 'info');
        
        // Restaurar orden original
        if (originalQueue.length > 0) {
            const currentTrackItem = currentQueue.find(t => t.video_id === currentVideoId);
            currentQueue = [...originalQueue];
            
            // Mantener la canción actual en su posición si existe
            if (currentTrackItem) {
                const originalIndex = originalQueue.findIndex(t => t.video_id === currentVideoId);
                if (originalIndex > -1) {
                    [currentQueue[0], currentQueue[originalIndex]] = [currentQueue[originalIndex], currentQueue[0]];
                }
            }
            updateQueueDisplay();
        }
    }
    saveData();
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
    
    localStorage.setItem('ponycanion_volume', volume);
}

// ========== MENÚS DESPLEGABLES ==========
function togglePlaylist() {
    const sidebar = document.getElementById('playlistSidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        updateQueueDisplay();
    }
}

function toggleHistory() {
    const sidebar = document.getElementById('historySidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        updateHistoryDisplay();
    }
}

// ========== CREAR TARJETAS DE CANCIONES ==========
function createTrackCards(tracks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    tracks.forEach(track => {
        const card = document.createElement('div');
        card.className = 'track-card';
        card.setAttribute('data-video-id', track.video_id);
        
        card.innerHTML = `
            <div class="track-card-image">
                <img src="${track.thumbnail}" 
                     alt="${track.title}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23222\"/><text x=\"50\" y=\"55\" font-family=\"Arial\" font-size=\"12\" fill=\"white\" text-anchor=\"middle\">🎵</text></svg>'">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
                <div class="track-duration">${track.duration}</div>
            </div>
            <div class="track-info">
                <h4>${track.title}</h4>
                <p>${track.channel_title}</p>
                <div class="track-actions">
                    <button class="add-to-queue-btn" onclick="addToQueue(${JSON.stringify(track).replace(/'/g, "\\'")})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-queue-btn')) {
                playTrack(track.video_id, track);
            }
        });
        
        container.appendChild(card);
    });
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    const controls = {
        'playPauseBtn': togglePlayPause,
        'previousBtn': previousTrack,
        'nextBtn': nextTrack,
        'repeatBtn': toggleRepeat,
        'shuffleBtn': toggleShuffle,
        'progressBar': seekTrack,
        'volumeSlider': (e) => setVolume(e.target.value),
        'queueBtn': togglePlaylist,
        'historyBtn': toggleHistory,
        'clearQueueBtn': clearQueue
    };
    
    Object.entries(controls).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'volumeSlider') {
                element.addEventListener('input', handler);
            } else {
                element.addEventListener('click', handler);
            }
        }
    });
    
    // Cerrar sidebars al hacer clic fuera
    document.addEventListener('click', (e) => {
        const playlistSidebar = document.getElementById('playlistSidebar');
        const historySidebar = document.getElementById('historySidebar');
        
        if (playlistSidebar?.classList.contains('active') && 
            !e.target.closest('#playlistSidebar') && 
            !e.target.closest('#queueBtn')) {
            playlistSidebar.classList.remove('active');
        }
        
        if (historySidebar?.classList.contains('active') && 
            !e.target.closest('#historySidebar') && 
            !e.target.closest('#historyBtn')) {
            historySidebar.classList.remove('active');
        }
    });
}

// ========== NOTIFICACIONES ==========
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        'info': 'fas fa-info-circle',
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle'
    };
    
    notification.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== ESTILOS CSS ADICIONALES ==========
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
    }
    
    .notification i {
        font-size: 16px;
    }
    
    .notification.success {
        background: linear-gradient(135deg, #4CAF50, #45a049);
    }
    
    .notification.error {
        background: linear-gradient(135deg, #f44336, #d32f2f);
    }
    
    .notification.warning {
        background: linear-gradient(135deg, #ff9800, #f57c00);
    }
    
    .notification.info {
        background: linear-gradient(135deg, #2196F3, #1976D2);
    }
    
    /* Sidebars */
    .sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 350px;
        height: 100vh;
        background: rgba(18, 18, 18, 0.95);
        backdrop-filter: blur(20px);
        border-left: 1px solid #333;
        z-index: 9999;
        transition: right 0.3s ease;
        padding: 20px;
        overflow-y: auto;
        box-shadow: -5px 0 30px rgba(0,0,0,0.5);
    }
    
    .sidebar.active {
        right: 0;
    }
    
    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #333;
    }
    
    .sidebar-header h3 {
        margin: 0;
        color: white;
        font-size: 18px;
    }
    
    .close-sidebar {
        background: none;
        border: none;
        color: #aaa;
        font-size: 20px;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .close-sidebar:hover {
        color: white;
    }
    
    /* Queue Items */
    .queue-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-bottom: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .queue-item:hover {
        background: rgba(255,255,255,0.1);
        transform: translateX(5px);
    }
    
    .queue-item.current-playing {
        background: rgba(144, 202, 249, 0.15);
        border-left: 3px solid #90caf9;
    }
    
    .queue-item-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    
    .queue-number {
        color: #aaa;
        font-size: 12px;
        min-width: 20px;
    }
    
    .queue-item img {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
    }
    
    .queue-track-details {
        flex: 1;
        min-width: 0;
    }
    
    .queue-track-details h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .queue-track-details p {
        margin: 0;
        font-size: 12px;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .queue-item-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .queue-duration {
        font-size: 12px;
        color: #aaa;
    }
    
    .queue-remove-btn {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .queue-remove-btn:hover {
        color: #f44336;
        background: rgba(244, 67, 54, 0.1);
    }
    
    /* History Items */
    .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-bottom: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .history-item:hover {
        background: rgba(255,255,255,0.1);
    }
    
    .history-item-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    
    .history-number {
        color: #aaa;
        font-size: 12px;
        min-width: 20px;
    }
    
    .history-item img {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
    }
    
    .history-track-details {
        flex: 1;
        min-width: 0;
    }
    
    .history-track-details h4 {
        margin: 0 0 3px 0;
        font-size: 14px;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .history-track-details p {
        margin: 0 0 3px 0;
        font-size: 12px;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .history-time {
        font-size: 11px;
        color: #666;
    }
    
    .history-play-btn {
        background: rgba(144, 202, 249, 0.1);
        border: none;
        color: #90caf9;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .history-play-btn:hover {
        background: rgba(144, 202, 249, 0.2);
        transform: scale(1.1);
    }
    
    /* Empty States */
    .empty-queue,
    .empty-history {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .empty-queue i,
    .empty-history i {
        font-size: 48px;
        margin-bottom: 15px;
        opacity: 0.5;
    }
    
    /* Track Cards Enhanced */
    .track-card-image {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
    }
    
    .track-card-image .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .track-card:hover .play-overlay {
        opacity: 1;
    }
    
    .play-overlay i {
        font-size: 24px;
        color: white;
        background: rgba(144, 202, 249, 0.8);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .track-duration {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
    }
    
    .track-actions {
        margin-top: 8px;
    }
    
    .add-to-queue-btn {
        background: none;
        border: 1px solid #333;
        color: #aaa;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .add-to-queue-btn:hover {
        color: white;
        border-color: #90caf9;
        background: rgba(144, 202, 249, 0.1);
    }
    
    /* Clear Buttons */
    .clear-btn {
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #f44336;
        padding: 8px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .clear-btn:hover {
        background: rgba(244, 67, 54, 0.2);
        border-color: rgba(244, 67, 54, 0.5);
    }
`;
document.head.appendChild(style);

console.log('✅ PonyCanion Player - SISTEMA MEJORADO LISTO');