from django.core.management.base import BaseCommand
from django.utils import timezone
from posts.models import Comentario
from sentiment_analysis.utils import SentimentAnalyzer
import time

class Command(BaseCommand):
    help = 'Analiza el sentimiento de los comentarios existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Número de comentarios a procesar por lote'
        )
        parser.add_argument(
            '--sleep',
            type=float,
            default=1.0,
            help='Tiempo de espera entre lotes (segundos)'
        )

    def handle(self, *args, **options):
        analyzer = SentimentAnalyzer()
        batch_size = options['batch_size']
        sleep_time = options['sleep']

        # Obtener comentarios sin análisis
        comentarios = Comentario.objects.filter(
            fecha_analisis__isnull=True
        ).select_related('publicacion')

        total = comentarios.count()
        processed = 0

        self.stdout.write(
            self.style.SUCCESS(f'Iniciando análisis de {total} comentarios')
        )

        while processed < total:
            # Obtener el siguiente lote
            batch = comentarios[processed:processed + batch_size]
            
            # Procesar el lote
            processed_count = analyzer.analyze_batch(batch, batch_size)
            processed += processed_count

            self.stdout.write(
                self.style.SUCCESS(
                    f'Procesados {processed}/{total} comentarios ({(processed/total)*100:.2f}%)'
                )
            )

            # Esperar entre lotes para no sobrecargar la API de traducción
            time.sleep(sleep_time)

        self.stdout.write(
            self.style.SUCCESS(f'Análisis completado. Total procesado: {processed} comentarios')
        ) 