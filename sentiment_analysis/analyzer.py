from textblob import TextBlob
from deep_translator import GoogleTranslator
from django.utils import timezone
from django.db import transaction
from posts.models import Comentario, MetricasSentimiento
import logging
import numpy as np
from collections import defaultdict
import re
import openai
from decouple import config

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Analizador de sentimiento para comentarios de R-Vístete."""
    
    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='en')
        openai.api_key = config('OPENAI_API_KEY')
        self.palabras_clave_moda = {
            'positivas': {
                'calidad': 2.0,
                'cómodo': 1.5,
                'hermoso': 1.5,
                'perfecto': 2.0,
                'excelente': 2.0,
                'elegante': 1.5,
                'estiloso': 1.5,
                'precioso': 1.5,
                'maravilloso': 2.0,
                'recomendado': 1.5
            },
            'negativas': {
                'malo': -1.5,
                'defectuoso': -2.0,
                'roto': -2.0,
                'incómodo': -1.5,
                'feo': -1.5,
                'horrible': -2.0,
                'caro': -1.0,
                'decepción': -1.5,
                'pequeño': -1.0,
                'grande': -1.0
            }
        }
    
    def _limpiar_texto(self, texto):
        """Limpia y prepara el texto para análisis."""
        if not texto:
            return ""
            
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
    
    def _ajustar_sentimiento_palabras_clave(self, texto, polaridad_base):
        """Ajusta la polaridad basándose en palabras clave específicas de moda."""
        texto = texto.lower()
        ajuste = 0
        
        # Buscar palabras clave positivas
        for palabra, peso in self.palabras_clave_moda['positivas'].items():
            if palabra in texto:
                ajuste += peso
                
        # Buscar palabras clave negativas
        for palabra, peso in self.palabras_clave_moda['negativas'].items():
            if palabra in texto:
                ajuste += peso
        
        # Combinar polaridad base con el ajuste (con límites de -1 a 1)
        polaridad_ajustada = max(min(polaridad_base + (ajuste * 0.2), 1), -1)
        return polaridad_ajustada
    
    def traducir_texto(self, texto):
        return self.translator.translate(texto)

    def _usar_chatgpt(self, texto):
        """Llama a la API de OpenAI para analizar el sentimiento."""
        try:
            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=f"Analiza el sentimiento del siguiente texto: {texto}",
                max_tokens=50,
                temperature=0.7
            )
            return response.choices[0].text.strip()
        except openai.error.OpenAIError as e:
            logger.error(f"Error al llamar a la API de OpenAI: {e}")
            return None

    def analizar_comentario(self, texto):
        """Analiza el sentimiento de un comentario individual."""
        try:
            # Traducir texto
            texto_en = self.translator.translate(texto)

            # Clasificar el comentario con ChatGPT
            clasificacion_chatgpt = self._usar_chatgpt(texto_en)

            return {
                'texto_original': texto,
                'clasificacion_chatgpt': clasificacion_chatgpt,
                'fecha_analisis': timezone.now()
            }
        except Exception as e:
            logger.error(f"Error en análisis de sentimiento: {e}")
            return None
    
    def analizar_lote_comentarios(self, comentarios, limit=100):
        """Analiza un lote de comentarios y actualiza la base de datos."""
        resultados = []
        metricas_por_publicacion = defaultdict(list)
        
        # Analizar comentarios
        for comentario in comentarios[:limit]:
            resultado = self.analizar_comentario(comentario.comentario)
            if resultado:
                resultados.append({
                    'comentario': comentario,
                    'analisis': resultado
                })
                # Agrupar resultados por publicación
                metricas_por_publicacion[comentario.publicacion_id].append(resultado)
        
        # Actualizar base de datos en una transacción
        with transaction.atomic():
            # Actualizar comentarios
            for resultado in resultados:
                comentario = resultado['comentario']
                analisis = resultado['analisis']
                
                comentario.polaridad = analisis['polaridad']
                comentario.subjetividad = analisis['subjetividad']
                comentario.clasificacion_chatgpt = analisis['clasificacion_chatgpt']
                comentario.fecha_analisis = analisis['fecha_analisis']
                comentario.save()
            
            # Actualizar métricas por publicación
            for publicacion_id, analisis_lista in metricas_por_publicacion.items():
                self._actualizar_metricas_publicacion(publicacion_id, analisis_lista)
        
        return len(resultados)
    
    def _actualizar_metricas_publicacion(self, publicacion_id, analisis_lista):
        """Actualiza las métricas de sentimiento para una publicación."""
        if not analisis_lista:
            return
            
        # Calcular métricas
        polaridades = [a['polaridad'] for a in analisis_lista]
        subjetividades = [a['subjetividad'] for a in analisis_lista]
        
        metricas, _ = MetricasSentimiento.objects.get_or_create(
            publicacion_id=publicacion_id
        )
        
        metricas.sentimiento_promedio = float(np.mean(polaridades))
        metricas.subjetividad_promedio = float(np.mean(subjetividades))
        metricas.total_comentarios = len(analisis_lista)
        metricas.comentarios_positivos = sum(1 for p in polaridades if p > 0)
        metricas.comentarios_negativos = sum(1 for p in polaridades if p < 0)
        metricas.comentarios_neutros = sum(1 for p in polaridades if p == 0)
        metricas.ultima_actualizacion = timezone.now()
        
        metricas.save()