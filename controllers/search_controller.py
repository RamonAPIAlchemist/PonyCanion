from flask import Blueprint, jsonify, request
from models.youtube_client import YouTubeClient

# Crear Blueprint
search_bp = Blueprint('search', __name__)

# Instancia del cliente
youtube_client = YouTubeClient()

@search_bp.route('/search', methods=['GET'])
def search():
    """Buscar música"""
    query = request.args.get('q', '')
    max_results = int(request.args.get('limit', 20))
    
    if not query:
        return jsonify({'error': 'Término de búsqueda requerido'}), 400
    
    videos = youtube_client.search_videos(query, max_results, music_only=True)
    
    # Si no hay resultados (sin API Key), devolver resultados simulados
    if not videos:
        videos = youtube_client.search_simulated(query, max_results)
    
    return jsonify({
        'query': query,
        'total': len(videos),
        'results': videos
    })

@search_bp.route('/video/<video_id>', methods=['GET'])
def get_video(video_id):
    """Obtener detalles de video"""
    video_details = youtube_client.get_video_details(video_id)
    
    if not video_details:
        # Modo simulador
        video_details = {
            'video_id': video_id,
            'title': f'Canción {video_id}',
            'description': 'Descripción de muestra',
            'channel_title': 'Artista',
            'published_at': '2023-01-01T00:00:00Z',
            'thumbnail': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80',
            'view_count': '1000',
            'like_count': '100',
            'comment_count': '10',
            'duration': 180,
            'duration_formatted': '3:00'
        }
    
    return jsonify(video_details)

@search_bp.route('/related/<video_id>', methods=['GET'])
def get_related(video_id):
    """Obtener videos relacionados"""
    max_results = int(request.args.get('limit', 10))
    
    related_videos = youtube_client.get_related_videos(video_id, max_results)
    
    if not related_videos:
        # Modo simulador
        related_videos = youtube_client.get_related_simulated(video_id, max_results)
    
    return jsonify({
        'video_id': video_id,
        'total': len(related_videos),
        'related_videos': related_videos
    })

@search_bp.route('/trending', methods=['GET'])
def get_trending():
    """Obtener música trending"""
    region = request.args.get('region', 'US')
    max_results = int(request.args.get('limit', 20))
    
    trending = youtube_client.get_trending_music(region, max_results)
    
    if not trending:
        # Modo simulador
        trending = youtube_client.get_trending_simulated(max_results)
    
    return jsonify({
        'region': region,
        'total': len(trending),
        'trending': trending
    })