from django.shortcuts import render, redirect
from users.models import PerfilUsuario
from posts.models import Publicacion

def recomendaciones_view(request):
    # Verificar autenticación (maneja tanto session como user)
    if not request.user.is_authenticated and not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')  # Redirige manteniendo la URL destino
    
    try:
        # Obtener perfil (adaptado para ambos sistemas de auth)
        usuario_id = request.user.id if request.user.is_authenticated else request.session.get('usuario_id')
        perfil = PerfilUsuario.objects.get(usuario_id=usuario_id)
        
        # Convertir preferencias a listas
        estilos_usuario = perfil.estilos_preferidos.split(", ") if perfil.estilos_preferidos else []
        colores_usuario = perfil.colores_preferidos.split(", ") if perfil.colores_preferidos else []
        
        # Filtrar publicaciones
        publicaciones = Publicacion.objects.exclude(usuario_id=usuario_id).filter(
            publico=perfil.genero
        )
        
        # Calcular recomendaciones
        recomendaciones = []
        for publicacion in publicaciones:
            puntuacion = 0
            
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
            
            if puntuacion > 0:
                recomendaciones.append({
                    'publicacion': publicacion,
                    'puntuacion': round(puntuacion, 2)
                })
        
        # Ordenar y mostrar
        return render(request, 'recommendations/list.html', {
            'recomendaciones': sorted(recomendaciones, key=lambda x: x['puntuacion'], reverse=True)[:10],
            'user': request.user if request.user.is_authenticated else None
        })
    
    except PerfilUsuario.DoesNotExist:
        return render(request, 'recommendations/list.html', {
            'error': 'Completa tu perfil para obtener recomendaciones.'
        })