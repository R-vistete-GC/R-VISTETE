from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Avg, Count, Case, When, Value, F
from posts.models import Comentario, Publicacion, MetricasSentimiento
from django.utils import timezone

class Command(BaseCommand):
    help = 'Actualiza las métricas de sentimiento para todas las publicaciones'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando actualización de métricas de sentimiento...')

        # Obtener todas las publicaciones con comentarios
        publicaciones = MetricasSentimiento.objects.all()

        for publicacion in publicaciones:
            comentarios = Comentario.objects.filter(publicacion_id=publicacion.publicacion_id)

            # Calcular métricas de TextBlob
            publicacion.sentimiento_promedio = comentarios.aggregate(Avg('polaridad'))['polaridad__avg'] or 0
            publicacion.subjetividad_promedio = comentarios.aggregate(Avg('subjetividad'))['subjetividad__avg'] or 0

            # Calcular métricas de ChatGPT
            publicacion.comentarios_positivos_chatgpt = comentarios.filter(clasificacion_chatgpt='positivo').count()
            publicacion.comentarios_neutros_chatgpt = comentarios.filter(clasificacion_chatgpt='neutro').count()
            publicacion.comentarios_negativos_chatgpt = comentarios.filter(clasificacion_chatgpt='negativo').count()

            # Actualizar la última fecha de actualización
            publicacion.ultima_actualizacion = timezone.now()
            publicacion.save()

        self.stdout.write(self.style.SUCCESS('Métricas de sentimiento actualizadas.'))