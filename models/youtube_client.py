import re
import os
import random
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class YouTubeClient:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY', '')
        if self.api_key:
            try:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
                self.has_api = True
            except:
                self.has_api = False
        else:
            self.has_api = False
    
    def extract_video_id(self, url_or_id):
        """Extraer ID de video de diferentes formatos de URL"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=)([\w\-]+)',
            r'(?:youtu\.be\/)([\w\-]+)',
            r'(?:youtube\.com\/embed\/)([\w\-]+)',
            r'(?:youtube\.com\/v\/)([\w\-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url_or_id)
            if match:
                return match.group(1)
        return url_or_id  # Si no es URL, asumimos que ya es ID
    
    def search_videos(self, query, max_results=20, music_only=True):
        """Buscar videos en YouTube"""
        if not self.has_api:
            return self.search_simulated(query, max_results)
            
        try:
            search_query = query + " official audio" if music_only else query
            
            search_response = self.youtube.search().list(
                q=search_query,
                part='id,snippet',
                maxResults=max_results,
                type='video',
                videoCategoryId='10' if music_only else None
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
            
            return videos
            
        except HttpError as e:
            print(f"Error en búsqueda: {e}")
            return self.search_simulated(query, max_results)
    
    def search_simulated(self, query, max_results=20):
        """Búsqueda simulada para cuando no hay API Key"""
        artists = ['Shakira', 'Bad Bunny', 'Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Ed Sheeran', 'Karol G', 'Feid', 'Rosalía', 'J Balvin']
        genres = ['Pop', 'Rock', 'Reggaeton', 'Hip Hop', 'Electrónica', 'Indie']
        
        videos = []
        for i in range(min(max_results, 20)):
            artist = random.choice(artists)
            genre = random.choice(genres)
            
            video_data = {
                'video_id': f'sim_{hash(query)}_{i}',
                'title': f'{query} - {artist} (Official Audio)',
                'description': f'Official audio for {query} by {artist}',
                'channel_title': f'{artist} • {genre}',
                'published_at': datetime.now().isoformat() + 'Z',
                'thumbnail': f'https://images.unsplash.com/photo-{1500000000000 + i}?w=400&h=400&fit=crop&q=80'
            }
            videos.append(video_data)
        
        return videos
    
    def get_video_details(self, video_id):
        """Obtener detalles completos de un video"""
        if not self.has_api:
            return self.get_video_details_simulated(video_id)
            
        try:
            video_response = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=video_id
            ).execute()
            
            if not video_response['items']:
                return self.get_video_details_simulated(video_id)
            
            video = video_response['items'][0]
            
            # Parsear duración
            duration_iso = video['contentDetails']['duration']
            duration_seconds = self._parse_duration(duration_iso)
            
            video_details = {
                'video_id': video_id,
                'title': video['snippet']['title'],
                'description': video['snippet']['description'],
                'channel_title': video['snippet']['channelTitle'],
                'published_at': video['snippet']['publishedAt'],
                'thumbnail': video['snippet']['thumbnails']['high']['url'],
                'view_count': video['statistics'].get('viewCount', 0),
                'like_count': video['statistics'].get('likeCount', 0),
                'comment_count': video['statistics'].get('commentCount', 0),
                'duration': duration_seconds,
                'duration_formatted': self._format_duration(duration_seconds)
            }
            
            return video_details
            
        except HttpError as e:
            print(f"Error obteniendo detalles: {e}")
            return self.get_video_details_simulated(video_id)
    
    def get_video_details_simulated(self, video_id):
        """Detalles simulados de video"""
        return {
            'video_id': video_id,
            'title': 'Canción de muestra',
            'description': 'Esta es una canción de muestra (modo simulador)',
            'channel_title': 'Artista Demo',
            'published_at': '2023-01-01T00:00:00Z',
            'thumbnail': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80',
            'view_count': '1000',
            'like_count': '100',
            'comment_count': '10',
            'duration': 180,
            'duration_formatted': '3:00'
        }
    
    def get_related_videos(self, video_id, max_results=10):
        """Obtener videos relacionados"""
        if not self.has_api:
            return self.get_related_simulated(video_id, max_results)
            
        try:
            search_response = self.youtube.search().list(
                part='id,snippet',
                maxResults=max_results,
                type='video',
                relatedToVideoId=video_id
            ).execute()
            
            related_videos = []
            for item in search_response.get('items', []):
                video_data = {
                    'video_id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'channel_title': item['snippet']['channelTitle'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url']
                }
                related_videos.append(video_data)
            
            return related_videos
            
        except HttpError as e:
            print(f"Error obteniendo relacionados: {e}")
            return self.get_related_simulated(video_id, max_results)
    
    def get_related_simulated(self, video_id, max_results=10):
        """Videos relacionados simulados"""
        related = []
        for i in range(max_results):
            related.append({
                'video_id': f'related_{i}',
                'title': f'Canción relacionada {i+1}',
                'channel_title': 'Artista Relacionado',
                'thumbnail': f'https://images.unsplash.com/photo-{1600000000000 + i}?w=400&h=400&fit=crop&q=80'
            })
        return related
    
    def get_trending_music(self, region='US', max_results=20):
        """Obtener música trending"""
        if not self.has_api:
            return self.get_trending_simulated(max_results)
            
        try:
            search_response = self.youtube.search().list(
                q='music',
                part='id,snippet',
                maxResults=max_results,
                type='video',
                videoCategoryId='10',
                regionCode=region,
                order='viewCount'
            ).execute()
            
            trending = []
            for item in search_response.get('items', []):
                video_data = {
                    'video_id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'channel_title': item['snippet']['channelTitle'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url']
                }
                trending.append(video_data)
            
            return trending
            
        except HttpError as e:
            print(f"Error obteniendo trending: {e}")
            return self.get_trending_simulated(max_results)
    
    def get_trending_simulated(self, max_results=20):
        """Trending simulados"""
        trending_titles = [
            'Blinding Lights - The Weeknd',
            'Shape of You - Ed Sheeran',
            'Despacito - Luis Fonsi ft. Daddy Yankee',
            'Bad Guy - Billie Eilish',
            'Levitating - Dua Lipa',
            'Stay - The Kid LAROI & Justin Bieber',
            'Good 4 U - Olivia Rodrigo',
            'Heat Waves - Glass Animals',
            'As It Was - Harry Styles',
            'Flowers - Miley Cyrus'
        ]
        
        trending = []
        for i, title in enumerate(trending_titles[:max_results]):
            trending.append({
                'video_id': f'trend_{i}',
                'title': title,
                'channel_title': 'Artista Popular',
                'thumbnail': f'https://images.unsplash.com/photo-{1700000000000 + i}?w=400&h=400&fit=crop&q=80'
            })
        return trending
    
    def _parse_duration(self, duration_iso):
        """Convertir duración ISO 8601 a segundos"""
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_iso)
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def _format_duration(self, seconds):
        """Formatear segundos a MM:SS o HH:MM:SS"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        return f"{minutes}:{secs:02d}"