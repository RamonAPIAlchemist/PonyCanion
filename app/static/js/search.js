// ========== VARIABLES GLOBALES PARA BÚSQUEDA ==========
let searchNextPageToken = null;
let searchLoading = false;
let searchQuery = '';

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof YOUTUBE_API_KEY === 'undefined') {
        window.YOUTUBE_API_KEY = document.body.dataset.apiKey || '';
        window.HAS_API_KEY = !!window.YOUTUBE_API_KEY;
    }
    
    setupSearchEventListeners();
    
    // Cargar contenido inicial
    loadInitialContent();
    
    // Verificar API Key automáticamente
    checkAPIKeyStatus();
});

// ========== CONFIGURACIÓN DE EVENTOS ==========
function setupSearchEventListeners() {
    // Búsqueda
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Búsqueda en tiempo real con debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            if (e.target.value.trim().length > 2) {
                searchTimeout = setTimeout(() => {
                    searchQuery = e.target.value.trim();
                    performSearch();
                }, 500);
            }
        });
    }
    
    // Scroll infinito para búsqueda
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', handleScroll);
    }
}

// ========== VERIFICACIÓN DE API KEY ==========
function checkAPIKeyStatus() {
    if (window.HAS_API_KEY) {
        showNotification('API YouTube conectada ✅', 'info');
    } else {
        showNotification('Modo simulador activado 🔥', 'info');
    }
}

// ========== BÚSQUEDA MEJORADA ==========
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) {
        showNotification('✏️ Escribe algo para buscar', 'warning');
        searchInput.focus();
        return;
    }
    
    searchQuery = query;
    searchNextPageToken = null;
    searchLoading = false;
    
    loadSection('search');
    
    const container = document.getElementById('searchResultsGrid');
    const stats = document.getElementById('searchStats');
    
    if (!container) return;
    
    // Mostrar estado de carga inicial
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--gray);">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--primary);"></i>
            <h3 style="margin: 20px 0 10px; color: var(--light);">Buscando "${query}"</h3>
            <p>Buscando en ${window.HAS_API_KEY ? 'YouTube API' : 'modo simulador'}...</p>
        </div>
    `;
    
    if (stats) {
        stats.textContent = 'Buscando...';
        stats.style.color = 'var(--primary)';
    }
    
    // Realizar búsqueda usando Flask API
    try {
        const response = await fetch(`/api/search/search?q=${encodeURIComponent(query)}&limit=50`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results, container, true);
            
            if (stats) {
                stats.textContent = `${data.total} resultados encontrados`;
            }
            showNotification(`✅ Encontrados ${data.results.length} resultados`, 'success');
        } else {
            showNoResults(container, query);
            if (stats) {
                stats.textContent = 'No se encontraron resultados';
            }
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        // Usar búsqueda simulada como fallback
        const results = searchYouTubeSimulated(query);
        displaySearchResults(results, container, true);
        if (stats) {
            stats.textContent = `${results.length} resultados (modo simulador)`;
        }
        showNotification('Error con API, usando modo simulador', 'error');
    }
}

// ========== CARGAR MÁS RESULTADOS ==========
async function loadMoreSearchResults() {
    if (!window.HAS_API_KEY || searchLoading) return;
    
    searchLoading = true;
    const container = document.getElementById('searchResultsGrid');
    const stats = document.getElementById('searchStats');
    
    // Mostrar spinner de carga
    const loadMoreIndicator = document.createElement('div');
    loadMoreIndicator.style.gridColumn = '1 / -1';
    loadMoreIndicator.style.textAlign = 'center';
    loadMoreIndicator.style.padding = '20px';
    loadMoreIndicator.innerHTML = `
        <i class="fas fa-spinner fa-spin" style="color: var(--primary);"></i>
        <span style="color: var(--gray); margin-left: 10px;">Cargando más resultados...</span>
    `;
    container.appendChild(loadMoreIndicator);
    
    try {
        const response = await fetch(`/api/search/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Remover el indicador de carga
            container.removeChild(loadMoreIndicator);
            
            displaySearchResults(data.results, container, false);
            
            if (stats) {
                const currentCount = container.querySelectorAll('.track-card').length;
                stats.textContent = `${currentCount.toLocaleString()}+ resultados cargados`;
            }
        }
    } catch (error) {
        console.error('Error cargando más resultados:', error);
        // Remover el indicador de carga en caso de error
        if (loadMoreIndicator.parentNode === container) {
            container.removeChild(loadMoreIndicator);
        }
    }
    
    searchLoading = false;
}

// ========== MOSTRAR RESULTADOS ==========
function displaySearchResults(items, container, clear = true) {
    if (clear) {
        container.innerHTML = '';
    }
    
    items.forEach(item => {
        const track = {
            video_id: item.video_id || item.id,
            title: item.title,
            channel_title: item.channel_title || 'Artista',
            thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'
        };
        
        const safeThumbnail = track.thumbnail;
        
        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <img src="${safeThumbnail}" 
                 onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'"
                 alt="${track.title}" 
                 loading="lazy">
            <h4>${track.title}</h4>
            <p>${track.channel_title}</p>
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        `;
        
        card.addEventListener('click', () => {
            if (typeof playTrack === 'function') {
                playTrack(track.video_id, track);
            } else {
                console.error('playTrack function not found');
            }
        });
        
        container.appendChild(card);
    });
}

// ========== SIN RESULTADOS ==========
function showNoResults(container, query) {
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--gray);">
            <i class="fas fa-search fa-3x" style="color: var(--primary);"></i>
            <h3 style="margin: 20px 0 10px; color: var(--light);">No se encontraron resultados</h3>
            <p>Intenta con otras palabras clave</p>
            <div style="margin-top: 20px; padding: 15px; background: var(--dark-gray); border-radius: 10px; display: inline-block;">
                <p style="margin: 0; font-size: 14px;">Búsqueda: "${query}"</p>
            </div>
        </div>
    `;
}

// ========== MANEJADOR DE SCROLL ==========
function handleScroll() {
    const mainContent = document.querySelector('.main-content');
    const currentSection = document.querySelector('.content-section.active');
    
    if (currentSection && currentSection.id === 'searchSection' && mainContent) {
        const { scrollTop, scrollHeight, clientHeight } = mainContent;
        
        // Si estamos cerca del final (100px del fondo) y no estamos cargando
        if (scrollHeight - scrollTop - clientHeight < 100 && !searchLoading) {
            loadMoreSearchResults();
        }
    }
}

// ========== BÚSQUEDA SIMULADA (FALLBACK) ==========
function searchYouTubeSimulated(query) {
    const artists = ['Shakira', 'Bad Bunny', 'Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Ed Sheeran', 'Karol G', 'Feid', 'Rosalía', 'J Balvin'];
    const genres = ['Pop', 'Rock', 'Reggaeton', 'Hip Hop', 'Electrónica', 'Indie'];
    
    const fakeResults = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
        const artist = artists[Math.floor(Math.random() * artists.length)];
        const genre = genres[Math.floor(Math.random() * genres.length)];
        
        fakeResults.push({
            video_id: 'sim_' + Date.now() + '_' + i,
            title: `${query} - ${artist}`,
            channel_title: `${artist} • ${genre}`,
            thumbnail: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=400&fit=crop&q=80`
        });
    }
    
    return fakeResults;
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
    const recentGrid = document.getElementById('recentGrid');
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    
    if (recentGrid) displaySearchResults(recentTracks, recentGrid, true);
    if (recommendationsGrid) displaySearchResults(recommendations, recommendationsGrid, true);
}

// ========== NAVEGACIÓN ==========
function loadSection(section) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`.nav-item[onclick*="${section}"]`);
    const activeMobileNav = document.querySelector(`.mobile-nav-item[onclick*="${section}"]`);
    
    if (activeNav) activeNav.classList.add('active');
    if (activeMobileNav) activeMobileNav.classList.add('active');
    
    // Cerrar menú móvil si está abierto
    if (window.innerWidth <= 768 && isMobileMenuOpen) {
        toggleMobileMenu();
    }
    
    // Mostrar sección
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        if (section === 'search') {
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    if (searchInput.value) searchInput.select();
                }
            }, 100);
        }
    }
}

// ========== RESPONSIVIDAD ==========
let isMobileMenuOpen = false;

function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.style.display = isMobileMenuOpen ? 'block' : 'none';
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