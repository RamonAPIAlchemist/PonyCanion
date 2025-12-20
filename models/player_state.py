class PlayerState:
    """Modelo para manejar el estado del reproductor"""
    
    def __init__(self):
        self.current_track = None
        self.is_playing = False
        self.volume = 80
        self.progress = 0
        self.queue = []
        self.playlists = {}
        self.history = []
        self.current_playlist = None
    
    def play_track(self, track):
        """Reproducir una pista"""
        self.current_track = track
        self.is_playing = True
        self.progress = 0
        
        # Agregar al historial si no es la misma canción
        if not self.history or self.history[-1] != track:
            self.history.append(track)
    
    def pause(self):
        """Pausar reproducción"""
        self.is_playing = False
    
    def resume(self):
        """Reanudar reproducción"""
        if self.current_track:
            self.is_playing = True
    
    def stop(self):
        """Detener reproducción"""
        self.is_playing = False
        self.current_track = None
        self.progress = 0
    
    def next_track(self):
        """Reproducir siguiente pista en la cola"""
        if self.queue:
            next_track = self.queue.pop(0)
            self.play_track(next_track)
            return next_track
        return None
    
    def add_to_queue(self, track):
        """Agregar pista a la cola"""
        self.queue.append(track)
        return len(self.queue)
    
    def clear_queue(self):
        """Limpiar cola de reproducción"""
        self.queue = []
    
    def create_playlist(self, name, tracks=None):
        """Crear una nueva playlist"""
        playlist_id = f"playlist_{len(self.playlists) + 1}"
        self.playlists[playlist_id] = {
            'id': playlist_id,
            'name': name,
            'tracks': tracks or []
        }
        return self.playlists[playlist_id]
    
    def add_to_playlist(self, playlist_id, track):
        """Agregar pista a una playlist"""
        if playlist_id in self.playlists:
            self.playlists[playlist_id]['tracks'].append(track)
            return True
        return False
    
    def get_playlist(self, playlist_id):
        """Obtener playlist por ID"""
        return self.playlists.get(playlist_id)
    
    def get_state(self):
        """Obtener estado completo del reproductor"""
        return {
            'current_track': self.current_track,
            'is_playing': self.is_playing,
            'volume': self.volume,
            'progress': self.progress,
            'queue_length': len(self.queue),
            'history_length': len(self.history),
            'playlists_count': len(self.playlists)
        }