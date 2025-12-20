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

app = Flask(__name__)
CORS(app)

# Configuración
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Registrar blueprints
app.register_blueprint(player_bp, url_prefix='/api/player')
app.register_blueprint(search_bp, url_prefix='/api/search')
app.register_blueprint(playlist_bp, url_prefix='/api/playlists')

@app.route('/')
def index():
    """Página principal del reproductor"""
    return render_template('player.html')

@app.route('/api/health')
def health_check():
    """Endpoint de salud"""
    return {'status': 'healthy', 'service': 'YouTube Music Player'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)