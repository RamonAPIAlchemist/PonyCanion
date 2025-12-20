import os
import re
from flask import Blueprint, jsonify, request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

# Crear blueprint para rutas básicas
basic_bp = Blueprint('basic', __name__)

# Configuración
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', 'AIzaSyCM_CtJicmYaaTPcgJjApwXv9gej8m2b9Y')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

@basic_bp.route('/search', methods=['GET'])
def search_videos():
    """Buscar videos en YouTube (para compatibilidad con el frontend)"""
    query = request.args.get('q', '')
    max_results = request.args.get('max_results', 10)
    
    if not query:
        return jsonify({'error': 'Se requiere un término de búsqueda'}), 400
    
    try:
        search_response = youtube.search().list(
            q=query,
            part='id,snippet',
            maxResults=int(max_results),
            type='video',
            videoCategoryId='10'  # Solo música
        ).execute()
        
        videos = []
        for item in search_response.get('items', []):
            video_data = {
                'video_id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'channel_title': item['snippet']['channelTitle'],
                'published_at': item['snippet']['publishedAt'],
                'thumbnail': item['snippet']['thumbnails']['medium']['url']
            }
            videos.append(video_data)
        
        return jsonify({
            'query': query,
            'total_results': len(videos),
            'videos': videos
        })
        
    except HttpError as e:
        return jsonify({'error': str(e)}), 500

@basic_bp.route('/video/<video_id>', methods=['GET'])
def get_video_details(video_id):
    """Obtener detalles de un video específico"""
    try:
        video_response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=video_id
        ).execute()
        
        if not video_response['items']:
            return jsonify({'error': 'Video no encontrado'}), 404
        
        video = video_response['items'][0]
        
        # Parsear duración ISO 8601
        duration_iso = video['contentDetails']['duration']
        
        video_details = {
            'video_id': video_id,
            'title': video['snippet']['title'],
            'description': video['snippet']['description'],
            'channel_title': video['snippet']['channelTitle'],
            'published_at': video['snippet']['publishedAt'],
            'view_count': video['statistics'].get('viewCount', 0),
            'like_count': video['statistics'].get('likeCount', 0),
            'comment_count': video['statistics'].get('commentCount', 0),
            'duration_iso': duration_iso,
            'thumbnail': video['snippet']['thumbnails']['high']['url']
        }
        
        return jsonify(video_details)
        
    except HttpError as e:
        return jsonify({'error': str(e)}), 500

@basic_bp.route('/trending', methods=['GET'])
def get_trending_videos():
    """Obtener videos trending de una región"""
    region_code = request.args.get('region', 'US')
    max_results = request.args.get('max_results', 10)
    
    try:
        video_response = youtube.videos().list(
            part='snippet,statistics',
            chart='mostPopular',
            regionCode=region_code,
            maxResults=int(max_results),
            videoCategoryId='10'  # Solo música
        ).execute()
        
        trending_videos = []
        for item in video_response.get('items', []):
            video_data = {
                'video_id': item['id'],
                'title': item['snippet']['title'],
                'channel_title': item['snippet']['channelTitle'],
                'view_count': item['statistics'].get('viewCount', 0),
                'like_count': item['statistics'].get('likeCount', 0),
                'thumbnail': item['snippet']['thumbnails']['medium']['url']
            }
            trending_videos.append(video_data)
        
        return jsonify({
            'region': region_code,
            'trending_videos': trending_videos
        })
        
    except HttpError as e:
        return jsonify({'error': str(e)}), 500