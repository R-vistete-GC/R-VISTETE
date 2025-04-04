from django.core.management.base import BaseCommand
from django.utils import timezone
from posts.models import Comentario
from sentiment_analysis.analyzer import SentimentAnalyzer
import time

class Command(BaseCommand):
    help = 'Analiza el sentimiento de los comentarios existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Número de comentarios a procesar por lote'
        )
        parser.add_argument(
            '--sleep',
            type=float,
            default=2.0,
            help='Tiempo de espera entre lotes (segundos)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forzar el reanálisis de comentarios ya analizados'
        )

    def handle(self, *args, **options):
        analyzer = SentimentAnalyzer()
        batch_size = options['batch_size']
        sleep_time = options['sleep']
        force = options['force']

        # Construir query base
        query = Comentario.objects
        if not force:
            query = query.filter(fecha_analisis__isnull=True)
        
        # Obtener total de comentarios
        total = query.count()
        if total == 0:
            self.stdout.write(
                self.style.SUCCESS('No hay comentarios pendientes de análisis.')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'Iniciando análisis de {total} comentarios')
        )

        processed = 0
        start_time = time.time()

        while processed < total:
            # Obtener el siguiente lote
            batch = query[processed:processed + batch_size]
            
            try:
                # Procesar el lote
                processed_count = analyzer.analizar_lote_comentarios(batch, batch_size)
                processed += processed_count

                # Calcular progreso y tiempo estimado
                elapsed_time = time.time() - start_time
                comments_per_second = processed / elapsed_time
                remaining_comments = total - processed
                estimated_remaining_time = remaining_comments / comments_per_second if comments_per_second > 0 else 0

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Procesados {processed}/{total} comentarios '
                        f'({(processed/total)*100:.2f}%) - '
                        f'Tiempo restante estimado: {estimated_remaining_time/60:.1f} minutos'
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error procesando lote: {str(e)}')
                )
                continue

            # Esperar entre lotes para no sobrecargar la API de traducción
            time.sleep(sleep_time)

        # Mostrar resumen final
        total_time = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(
                f'\nAnálisis completado:\n'
                f'- Total procesado: {processed} comentarios\n'
                f'- Tiempo total: {total_time/60:.1f} minutos\n'
                f'- Velocidad promedio: {processed/total_time:.1f} comentarios/segundo'
            )
        ) 