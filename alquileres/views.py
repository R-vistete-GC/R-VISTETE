from django.shortcuts import render, redirect
from posts.models import Alquiler
from users.models import Usuario

# Create your views here.

def mis_alquileres(request):
    # Verificar autenticación (maneja tanto session como user)
    if not request.user.is_authenticated and not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')  # Redirige manteniendo la URL destino
    
    try:
        # Obtener usuario (adaptado para ambos sistemas de auth)
        usuario_id = request.user.id if request.user.is_authenticated else request.session.get('usuario_id')
        usuario = Usuario.objects.get(id=usuario_id)
        
        # Obtener todos los alquileres donde el usuario es el cliente
        alquileres = Alquiler.objects.filter(cliente=usuario).order_by('-created_at')
        
        return render(request, 'alquileres/mis_alquileres.html', {
            'alquileres': alquileres,
            'tiene_alquileres': alquileres.exists(),
            'user': request.user if request.user.is_authenticated else None
        })
        
    except Usuario.DoesNotExist:
        return render(request, 'alquileres/mis_alquileres.html', {
            'error': 'Usuario no encontrado.',
            'tiene_alquileres': False
        })
