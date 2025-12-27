import os
from flask import Flask, render_template
from dotenv import load_dotenv
from flask_cors import CORS

# Cargar variables de entorno
load_dotenv()

# Importar blueprints
from controllers.player_controller import player_bp
from controllers.search_controller import search_bp
from controllers.playlist_controller import playlist_bp

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
CORS(app)

# Configuración
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'ponycanion-dev-secret')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')

# Registrar blueprints
app.register_blueprint(player_bp, url_prefix='/api/player')
app.register_blueprint(search_bp, url_prefix='/api/search')
app.register_blueprint(playlist_bp, url_prefix='/api/playlists')

@app.route('/')
def index():
    """Página principal del reproductor"""
    return render_template('index.html', 
                          YOUTUBE_API_KEY=YOUTUBE_API_KEY,
                          has_api_key=bool(YOUTUBE_API_KEY))

@app.route('/player')
def player_page():
    """Página del reproductor"""
    return render_template('player.html',
                          YOUTUBE_API_KEY=YOUTUBE_API_KEY,
                          has_api_key=bool(YOUTUBE_API_KEY))

@app.route('/health')
def health_check():
    """Página de verificación de salud"""
    from flask import jsonify
    return jsonify({
        'status': 'healthy', 
        'service': 'PonyCanion Music Player',
        'has_youtube_api': bool(YOUTUBE_API_KEY)
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print(f"""
    🎵 PonyCanion Music Player
    ============================
    API Key configurada: {'✅' if YOUTUBE_API_KEY else '❌ (modo simulador)'}
    Puerto: {port}
    Debug: {debug}
    
    Accede en: http://localhost:{port}
    """)
    
    app.run(debug=debug, port=port, host='0.0.0.0')