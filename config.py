import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'ponycanion-dev-secret')
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}