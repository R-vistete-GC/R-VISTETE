from django.shortcuts import render, redirect
from posts.models import Venta  # Cambiamos a usar el modelo Venta
from users.models import Usuario

# Create your views here.

def mis_compras(request):
    # Verificar autenticación (maneja tanto session como user)
    if not request.user.is_authenticated and not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')  # Redirige manteniendo la URL destino
    
    try:
        # Obtener usuario (adaptado para ambos sistemas de auth)
        usuario_id = request.user.id if request.user.is_authenticated else request.session.get('usuario_id')
        usuario = Usuario.objects.get(id=usuario_id)
        
        # Obtener todas las compras donde el usuario es el comprador usando el related_name existente
        compras = usuario.compras_realizadas.all().order_by('-fecha_venta')
        
        return render(request, 'compras/mis_compras.html', {
            'compras': compras,
            'tiene_compras': compras.exists(),
            'user': request.user if request.user.is_authenticated else None
        })
        
    except Usuario.DoesNotExist:
        return render(request, 'compras/mis_compras.html', {
            'error': 'Usuario no encontrado.',
            'tiene_compras': False
        })
