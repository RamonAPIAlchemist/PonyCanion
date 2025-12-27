from flask import Blueprint, jsonify, request
from models.player_state import PlayerState

# Crear Blueprint
playlist_bp = Blueprint('playlist', __name__)

# Instancia
player_state = PlayerState()

@playlist_bp.route('/playlists', methods=['GET'])
def get_playlists():
    """Obtener todas las playlists"""
    # Si no hay playlists, crear algunas de ejemplo
    if not player_state.playlists:
        player_state.create_playlist('Favoritas ❤️')
        player_state.create_playlist('Chill 🌙')
        player_state.create_playlist('Fiesta 🎉')
    
    return jsonify({
        'playlists': player_state.playlists,
        'total': len(player_state.playlists)
    })

@playlist_bp.route('/playlists/create', methods=['POST'])
def create_playlist():
    """Crear nueva playlist"""
    data = request.json
    name = data.get('name', 'Nueva Playlist')
    
    playlist = player_state.create_playlist(name)
    
    return jsonify({
        'status': 'playlist_created',
        'playlist': playlist
    })

@playlist_bp.route('/playlists/<playlist_id>/add', methods=['POST'])
def add_to_playlist(playlist_id):
    """Agregar pista a playlist"""
    from controllers.player_controller import youtube_client
    
    data = request.json
    video_id = data.get('video_id', '')
    
    if not video_id:
        return jsonify({'error': 'ID de video requerido'}), 400
    
    track_details = youtube_client.get_video_details(video_id)
    if not track_details:
        # Modo simulador
        track_details = {
            'video_id': video_id,
            'title': f'Canción {video_id}',
            'channel_title': 'Artista',
            'thumbnail': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'
        }
    
    success = player_state.add_to_playlist(playlist_id, track_details)
    
    if not success:
        return jsonify({'error': 'Playlist no encontrada'}), 404
    
    return jsonify({
        'status': 'added_to_playlist',
        'playlist_id': playlist_id,
        'track': track_details
    })

@playlist_bp.route('/playlists/<playlist_id>', methods=['GET'])
def get_playlist(playlist_id):
    """Obtener playlist específica"""
    playlist = player_state.get_playlist(playlist_id)
    
    if not playlist:
        return jsonify({'error': 'Playlist no encontrada'}), 404
    
    return jsonify(playlist)

@playlist_bp.route('/playlists/<playlist_id>/play', methods=['POST'])
def play_playlist(playlist_id):
    """Reproducir playlist"""
    playlist = player_state.get_playlist(playlist_id)
    
    if not playlist or not playlist['tracks']:
        return jsonify({'error': 'Playlist vacía o no encontrada'}), 404
    
    # Establecer como playlist actual
    player_state.current_playlist = playlist_id
    
    # Reproducir primera canción
    first_track = playlist['tracks'][0]
    player_state.play_track(first_track)
    
    # Cargar resto en cola
    player_state.queue = playlist['tracks'][1:]
    
    return jsonify({
        'status': 'playlist_playing',
        'playlist': playlist['name'],
        'current_track': first_track,
        'player_state': player_state.get_state()
    })