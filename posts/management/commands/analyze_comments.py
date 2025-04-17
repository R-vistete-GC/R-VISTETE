from django.core.management.base import BaseCommand
from posts.models import Comentario
from sentiment_analysis.analyzer import SentimentAnalyzer

class Command(BaseCommand):
    help = 'Analiza el sentimiento de los comentarios existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Número de comentarios a procesar por lote'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        analyzer = SentimentAnalyzer()

        # Obtener comentarios no analizados por ChatGPT
        comentarios = Comentario.objects.filter(analizado_por_chatgpt=False)[:batch_size]

        if not comentarios.exists():
            self.stdout.write(self.style.SUCCESS('No hay comentarios pendientes de análisis.'))
            return

        for comentario in comentarios:
            # Analizar el comentario
            resultado = analyzer.analizar_comentario(comentario.comentario)

            # Actualizar el comentario con los resultados
            comentario.polaridad = resultado['polaridad']
            comentario.subjetividad = resultado['subjetividad']
            comentario.clasificacion_chatgpt = resultado['clasificacion_chatgpt']
            comentario.analizado_por_chatgpt = True
            comentario.save()

            self.stdout.write(f"Comentario {comentario.id} analizado: {resultado['clasificacion_chatgpt']}")

        self.stdout.write(self.style.SUCCESS('Análisis completado.'))