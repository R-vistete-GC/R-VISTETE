# filepath: c:\Users\Isabela\OneDrive\Escritorio\USB\R-VISTETE\fashion_app\posts\signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from posts.models import Comentario
from sentiment_analysis.analyzer import SentimentAnalyzer

@receiver(post_save, sender=Comentario)
def analizar_comentario_nuevo(sender, instance, created, **kwargs):
    if created and not instance.analizado_por_chatgpt:
        analyzer = SentimentAnalyzer()
        resultado = analyzer.analizar_comentario(instance.comentario)

        # Actualizar el comentario con los resultados
        instance.polaridad = resultado['polaridad']
        instance.subjetividad = resultado['subjetividad']
        instance.clasificacion_chatgpt = resultado['clasificacion_chatgpt']
        instance.analizado_por_chatgpt = True
        instance.save()