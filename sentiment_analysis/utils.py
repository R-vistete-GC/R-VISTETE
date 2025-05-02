from textblob import TextBlob
from googletrans import Translator
from django.utils import timezone
import logging
from decouple import config  # Asegúrate de importar config
import openai

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        self.translator = Translator()
        openai.api_key = config('OPENAI_API_KEY')  # Carga la llave desde el archivo .env
    
    def _clean_text(self, texto):
        """Limpia y prepara el texto para análisis"""
        texto = texto.lower().strip()
        
        # Mapeo de expresiones comunes en español
        expresiones = {
            'no está mal': 'es bueno',
            'no es malo': 'es bueno',
            'nada mal': 'bueno',
            'no me quejo': 'estoy satisfecho',
            'no está bien': 'es malo',
            'no me gusta': 'malo',
            'no lo recomiendo': 'malo',
        }
        
        # Reemplazar expresiones
        for esp, eng in expresiones.items():
            texto = texto.replace(esp, eng)
            
        # Mapeo de emojis
        emojis = {
            '😊': ' feliz ',
            '😃': ' muy feliz ',
            '😢': ' triste ',
            '😍': ' encanta ',
            '👍': ' bueno ',
            '👎': ' malo ',
            '❤️': ' encanta ',
            '💕': ' encanta ',
            '😡': ' enojado ',
            '🤬': ' muy malo ',
        }
        
        for emoji, sentiment in emojis.items():
            texto = texto.replace(emoji, sentiment)
            
        return texto

    def analyze_text(self, texto):
        """Analiza el sentimiento de un texto en español"""
        try:
            # Limpiar texto
            texto_limpio = self._clean_text(texto)
            
            # Traducir al inglés
            try:
                texto_en = self.translator.translate(texto_limpio, dest='en').text
            except Exception as e:
                logger.warning(f"Error en traducción: {e}")
                return None
            
            # Analizar sentimiento
            analysis = TextBlob(texto_en)
            
            return {
                'polaridad': float(analysis.sentiment.polarity),
                'subjetividad': float(analysis.sentiment.subjectivity),
                'fecha_analisis': timezone.now()
            }
            
        except Exception as e:
            logger.error(f"Error en análisis de sentimiento: {e}")
            return None

    def analyze_text_with_chatgpt(self, texto):
        """Analiza el sentimiento usando ChatGPT."""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Eres un modelo que analiza sentimientos. Clasifica el siguiente texto como positivo, neutro o negativo."},
                    {"role": "user", "content": f"Texto: {texto}"}
                ],
                max_tokens=50,
                temperature=0.7
            )
            # Extraer y limpiar la respuesta
            sentimiento = response['choices'][0]['message']['content'].strip().lower()
            if "positivo" in sentimiento:
                return {'sentimiento': 'positivo', 'fecha_analisis': timezone.now()}
            elif "neutro" in sentimiento:
                return {'sentimiento': 'neutro', 'fecha_analisis': timezone.now()}
            elif "negativo" in sentimiento:
                return {'sentimiento': 'negativo', 'fecha_analisis': timezone.now()}
            else:
                return {'sentimiento': 'neutro', 'fecha_analisis': timezone.now()}  # Valor predeterminado
        except Exception as e:
            logger.error(f"Error al analizar el sentimiento con ChatGPT: {e}")
            return None

    def analyze_text_with_textblob(self, texto):
        """Analiza el sentimiento usando TextBlob."""
        try:
            analysis = TextBlob(texto)
            polaridad = analysis.sentiment.polarity
            if polaridad > 0:
                return 'positivo'
            elif polaridad < 0:
                return 'negativo'
            else:
                return 'neutro'
        except Exception as e:
            logger.error(f"Error al analizar el sentimiento con TextBlob: {e}")
            return 'neutro'

    def analyze_batch(self, comentarios, limit=100):
        """Analiza un lote de comentarios"""
        from posts.models import Comentario, MetricasSentimiento
        from django.db import transaction
        
        resultados = []
        for comentario in comentarios[:limit]:
            resultado = self.analyze_text(comentario.comentario)
            if resultado:
                resultados.append({
                    'comentario': comentario,
                    'analisis': resultado
                })
        
        # Actualizar comentarios en batch
        with transaction.atomic():
            for resultado in resultados:
                comentario = resultado['comentario']
                analisis = resultado['analisis']
                
                comentario.polaridad = analisis['polaridad']
                comentario.subjetividad = analisis['subjetividad']
                comentario.fecha_analisis = analisis['fecha_analisis']
                comentario.save()
                
                # Actualizar métricas de la publicación
                metrica, created = MetricasSentimiento.objects.get_or_create(
                    publicacion=comentario.publicacion
                )
                metrica.actualizar_metricas()
        
        return len(resultados)