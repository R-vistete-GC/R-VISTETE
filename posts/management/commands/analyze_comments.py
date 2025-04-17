from django.core.management.base import BaseCommand
from posts.models import Comentario
from sentiment_analysis.analyzer import SentimentAnalyzer

class Command(BaseCommand):
    help = 'Analiza los comentarios pendientes de sentimiento'

    def handle(self, *args, **kwargs):
        analyzer = SentimentAnalyzer()
        comentarios = Comentario.objects.filter(analizado_por_chatgpt=False)[:100]

        for comentario in comentarios:
            sentimiento = analyzer._usar_chatgpt(comentario.texto)
            if sentimiento:
                comentario.sentimiento = sentimiento
                comentario.analizado_por_chatgpt = True
                comentario.save()
                self.stdout.write(self.style.SUCCESS(f'Comentario {comentario.id} analizado con éxito'))
            else:
                self.stdout.write(self.style.ERROR(f'Error al analizar el comentario {comentario.id}'))