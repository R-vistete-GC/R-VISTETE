from django.shortcuts import render, redirect
from users.models import PerfilUsuario
from posts.models import Publicacion, Venta, Alquiler, Comentario, MetricasSentimiento
from collections import defaultdict
from django.db.models import Avg, Q
from sentiment_analysis.utils import SentimentAnalyzer

def recomendaciones_view(request):
    # Verificar autenticación
    if not request.user.is_authenticated and not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')
    
    try:
        # Obtener perfil
        usuario_id = request.user.id if request.user.is_authenticated else request.session.get('usuario_id')
        perfil = PerfilUsuario.objects.get(usuario_id=usuario_id)
        
        # Convertir preferencias a listas
        estilos_usuario = perfil.estilos_preferidos.split(", ") if perfil.estilos_preferidos else []
        colores_usuario = perfil.colores_preferidos.split(", ") if perfil.colores_preferidos else []
        
        # Obtener publicaciones excluyendo las del usuario
        publicaciones = Publicacion.objects.exclude(usuario_id=usuario_id).filter(
            publico=perfil.genero
        )
        
        # Obtener métricas de sentimiento para todas las publicaciones
        metricas_por_publicacion = {
            m.publicacion_id: m for m in MetricasSentimiento.objects.all()
        }
        
        # Obtener historial de compras y alquileres
        compras = Venta.objects.filter(comprador_id=usuario_id, estado='completada')
        alquileres = Alquiler.objects.filter(cliente_id=usuario_id, estado='completado')
        
        # Analizar características de las transacciones previas
        caracteristicas_previas = defaultdict(int)
        total_transacciones = 0
        
        # Analizar compras
        for compra in compras:
            pub = compra.publicacion
            if pub.estilo:
                for estilo in pub.estilo:
                    caracteristicas_previas[f'estilo_{estilo}'] += 1
            if pub.colores:
                for color in pub.colores:
                    caracteristicas_previas[f'color_{color}'] += 1
            caracteristicas_previas[f'talla_{pub.talla}'] += 1
            total_transacciones += 1
            
        # Analizar alquileres
        for alquiler in alquileres:
            pub = alquiler.publicacion
            if pub.estilo:
                for estilo in pub.estilo:
                    caracteristicas_previas[f'estilo_{estilo}'] += 1
            if pub.colores:
                for color in pub.colores:
                    caracteristicas_previas[f'color_{color}'] += 1
            caracteristicas_previas[f'talla_{pub.talla}'] += 1
            total_transacciones += 1
        
        # Normalizar las características previas
        if total_transacciones > 0:
            for key in caracteristicas_previas:
                caracteristicas_previas[key] /= total_transacciones
        
        # Calcular recomendaciones
        recomendaciones = []
        for publicacion in publicaciones:
            puntuacion = 0
            puntuacion_historial = 0
            puntuacion_sentimiento = 0
            razones = []
            
            # Puntuación basada en preferencias del perfil
            if perfil.talla and publicacion.talla == perfil.talla:
                puntuacion += 50
                razones.append("Coincide con tu talla preferida")
            
            if estilos_usuario and publicacion.estilo:
                coincidencias = len(set(estilos_usuario) & set(publicacion.estilo))
                if coincidencias > 0:
                    puntuacion += 50 * (coincidencias / len(estilos_usuario))
                    razones.append(f"Coincide con {coincidencias} de tus estilos preferidos")
            
            if colores_usuario and publicacion.colores:
                coincidencias = len(set(colores_usuario) & set(publicacion.colores))
                if coincidencias > 0:
                    puntuacion += 40 * (coincidencias / len(colores_usuario))
                    razones.append(f"Incluye {coincidencias} de tus colores favoritos")
            
            if perfil.genero and publicacion.publico == perfil.genero:
                puntuacion += 40
                razones.append("Diseñado para tu género")
                
            # Puntuación basada en historial de transacciones
            if total_transacciones > 0:
                # Verificar coincidencias con características previas
                if publicacion.estilo:
                    for estilo in publicacion.estilo:
                        puntuacion_historial += caracteristicas_previas.get(f'estilo_{estilo}', 0) * 30
                
                if publicacion.colores:
                    for color in publicacion.colores:
                        puntuacion_historial += caracteristicas_previas.get(f'color_{color}', 0) * 20
                
                puntuacion_historial += caracteristicas_previas.get(f'talla_{publicacion.talla}', 0) * 30
                
                # Normalizar puntuación del historial
                puntuacion_historial = min(100, puntuacion_historial)
                
                if puntuacion_historial > 0:
                    razones.append("Basado en tus compras anteriores")

            # Puntuación basada en sentimiento
            metricas = metricas_por_publicacion.get(publicacion.id)
            if metricas and metricas.total_comentarios > 0:
                # Calcular puntuación de sentimiento (0-100)
                sentimiento_normalizado = float((metricas.sentimiento_promedio + 1) * 50)  # Convertir de [-1,1] a [0,100]
                puntuacion_sentimiento = sentimiento_normalizado
                
                if metricas.comentarios_positivos > metricas.comentarios_negativos:
                    razones.append(f"Valoración positiva de la comunidad ({metricas.comentarios_positivos} comentarios positivos)")
                
                if metricas.subjetividad_promedio < 0.5:
                    razones.append("Opiniones objetivas de usuarios")

            # Convertir todas las puntuaciones a float antes de combinar
            puntuacion = float(puntuacion)
            puntuacion_historial = float(puntuacion_historial)
            puntuacion_sentimiento = float(puntuacion_sentimiento)

            # Combinar puntuaciones (40% perfil, 30% historial, 30% sentimiento)
            puntuacion_final = (
                (puntuacion * 0.4) +
                (puntuacion_historial * 0.3) +
                (puntuacion_sentimiento * 0.3)
            )
            
            if puntuacion_final > 0:
                recomendaciones.append({
                    'publicacion': publicacion,
                    'puntuacion': round(puntuacion_final, 2),
                    'basado_en_historial': puntuacion_historial > 0,
                    'basado_en_sentimiento': puntuacion_sentimiento > 0,
                    'razones': razones
                })
        
        # Ordenar y mostrar
        recomendaciones_ordenadas = sorted(recomendaciones, key=lambda x: x['puntuacion'], reverse=True)[:15]
        
        return render(request, 'recommendations/list.html', {
            'recomendaciones': recomendaciones_ordenadas,
            'user': request.user if request.user.is_authenticated else None
        })
    
    except PerfilUsuario.DoesNotExist:
        return render(request, 'recommendations/list.html', {
            'error': 'Completa tu perfil para obtener recomendaciones.'
        })

def inicio_view(request):
    publicaciones = Publicacion.objects.all().prefetch_related('comentarios')
    
    for publicacion in publicaciones:
        # Asegurarse que colores sea una lista
        publicacion.colores = publicacion.colores or []
        
        # Resto del código existente...
        if publicacion.tipo == 'venta':
            publicacion.precio = publicacion.precio_venta
        elif publicacion.tipo == 'alquiler':
            publicacion.precio = publicacion.precio_alquiler
        else:  # venta y alquiler
            publicacion.precio_mostrar = {
                'venta': publicacion.precio_venta,
                'alquiler': publicacion.precio_alquiler
            }

        # Calcular métricas de comentarios
        comentarios = publicacion.comentarios.all()
        publicacion.comentarios_positivos = comentarios.filter(clasificacion_chatgpt='positivo').count()
        publicacion.comentarios_neutros = comentarios.filter(clasificacion_chatgpt='neutro').count()
        publicacion.comentarios_negativos = comentarios.filter(clasificacion_chatgpt='negativo').count()
        publicacion.total_comentarios = comentarios.count()

    context = {
        'publicaciones': publicaciones,
    }
    return render(request, 'inicio.html', context)