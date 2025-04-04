from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Avg, Count, Case, When, Value, F
from posts.models import Comentario, Publicacion, MetricasSentimiento
from django.utils import timezone

class Command(BaseCommand):
    help = 'Actualiza las métricas de sentimiento para todas las publicaciones'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando actualización de métricas de sentimiento...')
        total_publicaciones = Publicacion.objects.count()
        actualizadas = 0

        for publicacion in Publicacion.objects.all():
            with transaction.atomic():
                # Obtener comentarios analizados para esta publicación
                comentarios = Comentario.objects.filter(
                    publicacion=publicacion,
                    fecha_analisis__isnull=False
                )

                # Calcular métricas
                metricas = comentarios.aggregate(
                    sentimiento_promedio=Avg('polaridad'),
                    subjetividad_promedio=Avg('subjetividad'),
                    total_comentarios=Count('id'),
                    comentarios_positivos=Count(Case(
                        When(polaridad__gt=0.0, then=Value(1))
                    )),
                    comentarios_negativos=Count(Case(
                        When(polaridad__lt=0.0, then=Value(1))
                    )),
                    comentarios_neutros=Count(Case(
                        When(polaridad=0.0, then=Value(1))
                    ))
                )

                # Actualizar o crear registro de métricas
                MetricasSentimiento.objects.update_or_create(
                    publicacion=publicacion,
                    defaults={
                        'sentimiento_promedio': metricas['sentimiento_promedio'] or 0,
                        'subjetividad_promedio': metricas['subjetividad_promedio'] or 0,
                        'total_comentarios': metricas['total_comentarios'],
                        'comentarios_positivos': metricas['comentarios_positivos'],
                        'comentarios_negativos': metricas['comentarios_negativos'],
                        'comentarios_neutros': metricas['comentarios_neutros'],
                        'ultima_actualizacion': timezone.now()
                    }
                )
                actualizadas += 1
                self.stdout.write(f'Progreso: {actualizadas}/{total_publicaciones} publicaciones procesadas')

        self.stdout.write(self.style.SUCCESS(
            f'¡Métricas actualizadas exitosamente para {actualizadas} publicaciones!'
        )) 