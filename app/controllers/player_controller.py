from flask import Blueprint, jsonify, request
from app.models.youtube_client import YouTubeClient
from app.models.player_state import PlayerState

player_bp = Blueprint('player', __name__)

youtube_client = YouTubeClient()
player_state = PlayerState()

@player_bp.route('/play', methods=['POST'])
def play():
    data = request.json
    video_id = data.get('video_id', '')
    
    if not video_id:
        return jsonify({'error': 'ID de video requerido'}), 400
    
    track_details = youtube_client.get_video_details(video_id)
    if not track_details:
        track_details = {
            'video_id': video_id,
            'title': 'Canción de muestra',
            'channel_title': 'Artista',
            'thumbnail': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80'
        }
    
    player_state.play_track(track_details)
    
    return jsonify({
        'status': 'playing',
        'track': track_details,
        'player_state': player_state.get_state()
    })

@player_bp.route('/pause', methods=['POST'])
def pause():
    player_state.pause()
    return jsonify({
        'status': 'paused',
        'player_state': player_state.get_state()
    })

@player_bp.route('/resume', methods=['POST'])
def resume():
    player_state.resume()
    return jsonify({
        'status': 'playing',
        'player_state': player_state.get_state()
    })

@player_bp.route('/stop', methods=['POST'])
def stop():
    player_state.stop()
    return jsonify({
        'status': 'stopped',
        'player_state': player_state.get_state()
    })

@player_bp.route('/next', methods=['POST'])
def next_track():
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
    data = request.json
    video_id = data.get('video_id', '')
    
    if not video_id:
        return jsonify({'error': 'ID de video requerido'}), 400
    
    track_details = youtube_client.get_video_details(video_id)
    if not track_details:
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
    return jsonify({
        'queue': player_state.queue,
        'total': len(player_state.queue),
        'player_state': player_state.get_state()
    })

@player_bp.route('/queue/clear', methods=['POST'])
def clear_queue():
    player_state.clear_queue()
    return jsonify({
        'status': 'queue_cleared',
        'player_state': player_state.get_state()
    })

@player_bp.route('/state', methods=['GET'])
def get_state():
    return jsonify(player_state.get_state())

@player_bp.route('/volume', methods=['POST'])
def set_volume():
    data = request.json
    volume = int(data.get('volume', 80))
    
    volume = max(0, min(100, volume))
    player_state.volume = volume
    
    return jsonify({
        'status': 'volume_updated',
        'volume': volume,
        'player_state': player_state.get_state()
    })

@player_bp.route('/progress', methods=['POST'])
def update_progress():
    data = request.json
    progress = int(data.get('progress', 0))
    
    player_state.progress = progress
    return jsonify({
        'status': 'progress_updated',
        'progress': progress
    })