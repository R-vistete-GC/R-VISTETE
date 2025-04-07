from django.shortcuts import render, redirect
from posts.models import Venta  # Cambiamos a usar el modelo Venta
from users.models import Usuario

# Create your views here.

def mis_compras(request):
    # Verificar autenticación (maneja tanto session como user)
    if not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')  # Redirige manteniendo la URL destino
    
    try:
        # Obtener usuario de la sesión
        usuario_id = request.session.get('usuario_id')
        usuario = Usuario.objects.get(id=usuario_id)
        
        # Obtener todas las compras del usuario ordenadas por fecha
        compras = Venta.objects.filter(
            comprador=usuario
        ).select_related(
            'publicacion',
            'vendedor'
        ).order_by('-fecha_venta')

        return render(request, 'compras/mis_compras.html', {
            'compras': compras,
            'usuario': usuario
        })
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('/users/login/')
