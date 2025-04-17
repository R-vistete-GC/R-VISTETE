from django.core.management.base import BaseCommand
from posts.models import Comentario
from sentiment_analysis.utils import SentimentAnalyzer

class Command(BaseCommand):
    help = 'Analiza los comentarios pendientes de sentimiento'

    def handle(self, *args, **kwargs):
        analyzer = SentimentAnalyzer()
        comentarios = Comentario.objects.filter(analizado_por_chatgpt=False)[:100]

        for comentario in comentarios:
            # Cambiar 'texto' por 'comentario'
            resultado = analyzer.analyze_text_with_chatgpt(comentario.comentario)
            if resultado:
                comentario.clasificacion_chatgpt = resultado['sentimiento']  # Guardar el sentimiento
                comentario.fecha_analisis = resultado['fecha_analisis']
                comentario.analizado_por_chatgpt = True
                comentario.save()
                self.stdout.write(self.style.SUCCESS(f'Comentario {comentario.id} analizado con éxito'))
            else:
                self.stdout.write(self.style.ERROR(f'Error al analizar el comentario {comentario.id}'))