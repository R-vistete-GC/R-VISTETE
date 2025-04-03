from django.shortcuts import render, redirect
from users.models import PerfilUsuario
from posts.models import Publicacion, Venta, Alquiler
from collections import defaultdict

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
            
            # Puntuación basada en preferencias del perfil
            if perfil.talla and publicacion.talla == perfil.talla:
                puntuacion += 30
            
            if estilos_usuario and publicacion.estilo:
                coincidencias = len(set(estilos_usuario) & set(publicacion.estilo))
                puntuacion += 30 * (coincidencias / len(estilos_usuario))
            
            if colores_usuario and publicacion.colores:
                coincidencias = len(set(colores_usuario) & set(publicacion.colores))
                puntuacion += 20 * (coincidencias / len(colores_usuario))
            
            if perfil.genero and publicacion.publico == perfil.genero:
                puntuacion += 20
                
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
                
                # Combinar puntuaciones (50% perfil, 50% historial)
                puntuacion = (puntuacion + puntuacion_historial) / 2
            
            if puntuacion > 0:
                recomendaciones.append({
                    'publicacion': publicacion,
                    'puntuacion': round(puntuacion, 2),
                    'basado_en_historial': puntuacion_historial > 0
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