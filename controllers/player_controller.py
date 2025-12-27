from flask import Blueprint, jsonify, request
from models.youtube_client import YouTubeClient
from models.player_state import PlayerState

# Crear Blueprint
player_bp = Blueprint('player', __name__)

# Instancias (ahora usa variable de entorno directamente)
youtube_client = YouTubeClient()
player_state = PlayerState()

@player_bp.route('/play', methods=['POST'])
def play():
    """Reproducir una pista"""
    data = request.json
    video_id = data.get('video_id', '')
    
    if not video_id:
        return jsonify({'error': 'ID de video requerido'}), 400
    
    # Obtener detalles del video
    track_details = youtube_client.get_video_details(video_id)
    if not track_details:
        # Si no hay API Key, usar modo simulador
        track_details = {
            'video_id': video_id,
            'title': 'Canción de muestra',
            'channel_title': 'Artista',
            'thumbnail': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'
        }
    
    # Reproducir pista
    player_state.play_track(track_details)
    
    return jsonify({
        'status': 'playing',
        'track': track_details,
        'player_state': player_state.get_state()
    })

@player_bp.route('/pause', methods=['POST'])
def pause():
    """Pausar reproducción"""
    player_state.pause()
    return jsonify({
        'status': 'paused',
        'player_state': player_state.get_state()
    })

@player_bp.route('/resume', methods=['POST'])
def resume():
    """Reanudar reproducción"""
    player_state.resume()
    return jsonify({
        'status': 'playing',
        'player_state': player_state.get_state()
    })

@player_bp.route('/stop', methods=['POST'])
def stop():
    """Detener reproducción"""
    player_state.stop()
    return jsonify({
        'status': 'stopped',
        'player_state': player_state.get_state()
    })

@player_bp.route('/next', methods=['POST'])
def next_track():
    """Siguiente pista"""
    next_track = player_state.next_track()
    
    if next_track:
        return jsonify({
            'status': 'playing_next',
            'track': next_track,
            'player_state': player_state.get_state()
        })
    else:
        return jsonify({
            'status': 'queue_empty',
            'player_state': player_state.get_state()
        })

@player_bp.route('/queue/add', methods=['POST'])
def add_to_queue():
    """Agregar pista a la cola"""
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
    
    position = player_state.add_to_queue(track_details)
    
    return jsonify({
        'status': 'added_to_queue',
        'track': track_details,
        'queue_position': position,
        'player_state': player_state.get_state()
    })

@player_bp.route('/queue', methods=['GET'])
def get_queue():
    """Obtener cola de reproducción"""
    return jsonify({
        'queue': player_state.queue,
        'total': len(player_state.queue),
        'player_state': player_state.get_state()
    })

@player_bp.route('/queue/clear', methods=['POST'])
def clear_queue():
    """Limpiar cola"""
    player_state.clear_queue()
    return jsonify({
        'status': 'queue_cleared',
        'player_state': player_state.get_state()
    })

@player_bp.route('/state', methods=['GET'])
def get_state():
    """Obtener estado del reproductor"""
    return jsonify(player_state.get_state())

@player_bp.route('/volume', methods=['POST'])
def set_volume():
    """Ajustar volumen"""
    data = request.json
    volume = int(data.get('volume', 80))
    
    # Asegurar que esté entre 0 y 100
    volume = max(0, min(100, volume))
    player_state.volume = volume
    
    return jsonify({
        'status': 'volume_updated',
        'volume': volume,
        'player_state': player_state.get_state()
    })

@player_bp.route('/progress', methods=['POST'])
def update_progress():
    """Actualizar progreso de reproducción"""
    data = request.json
    progress = int(data.get('progress', 0))
    
    player_state.progress = progress
    return jsonify({
        'status': 'progress_updated',
        'progress': progress
    })