from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Usuario, PerfilUsuario
from posts.models import Publicacion, Venta, Alquiler, Favorito, Like
from django.contrib.auth.models import User
import json
from django.urls import reverse
from django.contrib import messages
from .forms import PerfilUsuarioForm
from django.shortcuts import render, redirect
from django.urls import reverse  # Importa reverse para construir URLs
from sentiment_analysis.analyzer import MetricasSentimiento
from recommendations.utils import obtener_estadisticas_usuario
from recommendations.views import recomendaciones_view
from sentiment_analysis.utils import SentimentAnalyzer
import matplotlib
matplotlib.use('Agg')  # Cambiar el backend a 'Agg' para evitar problemas con hilos
import matplotlib.pyplot as plt
import io
import base64
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Usuario, PerfilUsuario
from posts.models import Publicacion, Venta, Alquiler, Favorito, Like
from django.contrib.auth.models import User
import json
from django.urls import reverse
from django.contrib import messages
from .forms import PerfilUsuarioForm
from django.shortcuts import render, redirect
from django.urls import reverse  # Importa reverse para construir URLs
from sentiment_analysis.analyzer import MetricasSentimiento
from recommendations.utils import obtener_estadisticas_usuario
from recommendations.views import recomendaciones_view
from sentiment_analysis.utils import SentimentAnalyzer
import matplotlib
matplotlib.use('Agg')  # Cambiar el backend a 'Agg' para evitar problemas con hilos
import matplotlib.pyplot as plt
import io
import base64
from django.db.models import Count, Q, Exists, OuterRef

def login_view(request):
    # 1. Verificar si YA está autenticado (evita bucles)
    if request.session.get('usuario_id'):
        next_url = request.GET.get('next', reverse('recommendations:list'))  # 🔥 Cambio aquí
        print(f"Usuario YA autenticado. Redirigiendo a {next_url}")
        return redirect(next_url)

    # 2. Manejo del POST (tu lógica actual)
    if request.method == "POST":
        correo = request.POST.get("correo")
        contrasena = request.POST.get("contrasena")
        next_url = request.POST.get('next', reverse('recommendations:list'))  # 🔥 Y aquí

        try:
            usuario = Usuario.objects.get(correo=correo)
            if usuario.contrasena == contrasena:
                # 3. Establecer sesión MANUALMENTE
                request.session['usuario_id'] = usuario.id
                request.session['nombre_usuario'] = usuario.nombre
                
                # 4. Guardar explícitamente
                request.session.modified = True 
                request.session.save()
                
                print(f"Sesión establecida para {usuario.id}. Redirigiendo a {next_url}")
                return redirect(next_url)
                
        except Usuario.DoesNotExist:
            pass  # Mantén tu manejo de errores actual

    return render(request, "users/login.html", {
        'next': request.GET.get('next', reverse('recommendations:list'))  # 🔥 Y aquí
    })

def ver_perfil(request):
    usuario_id = request.GET.get('usuario_id')
    
    if not usuario_id:
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return redirect('users:login')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        perfil = PerfilUsuario.objects.get(usuario=usuario)
        
        # Mejorar las anotaciones para contar correctamente
        publicaciones = Publicacion.objects.filter(usuario=usuario).annotate(
            likes_count=Count('like', distinct=True),  # Añadido distinct=True
            favoritos_count=Count('favorito', distinct=True),  # Añadido distinct=True
            comentarios_count=Count('comentario', distinct=True),  # Añadido distinct=True
            comentarios_positivos=Count(
                'comentario',
                filter=Q(comentario__clasificacion_chatgpt='positivo'),
                distinct=True
            ),
            comentarios_neutros=Count(
                'comentario',
                filter=Q(comentario__clasificacion_chatgpt='neutro'),
                distinct=True
            ),
            comentarios_negativos=Count(
                'comentario',
                filter=Q(comentario__clasificacion_chatgpt='negativo'),
                distinct=True
            ),
            total_comentarios=Count('comentario', distinct=True),
            # Añadir verificación si el usuario actual ha dado like/favorito
            user_liked=Exists(
                Like.objects.filter(
                    publicacion=OuterRef('pk'),
                    usuario_id=usuario_id
                )
            ),
            user_favorited=Exists(
                Favorito.objects.filter(
                    publicacion=OuterRef('pk'),
                    usuario_id=usuario_id
                )
            )
        ).order_by('-fecha_publicacion')

        # Obtener conteos generales
        publicaciones_count = publicaciones.count()
        ventas = Venta.objects.filter(publicacion__usuario=usuario).count()
        alquileres = Alquiler.objects.filter(publicacion__usuario=usuario).count()

        if not ventas:
            ventas = 0
        if not alquileres:
            alquileres = 0
        
        context = {
            'usuario': usuario,
            'perfil': perfil,
            'publicaciones': publicaciones,
            'publicaciones_count': publicaciones_count,
            'ventas': ventas,
            'alquileres': alquileres,
        }
        
        return render(request, 'users/perfil.html', context)
        
    except (Usuario.DoesNotExist, PerfilUsuario.DoesNotExist):
        messages.error(request, 'Usuario no encontrado')
        return redirect('posts:inicio')

def editar_perfil(request):
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('users:login')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        perfil, created = PerfilUsuario.objects.get_or_create(usuario=usuario)
        
        # Verificar que el usuario autenticado sea el propietario del perfil
        if str(usuario.id) != str(request.session.get('usuario_id')):
            messages.error(request, "No tienes permiso para editar este perfil.")
            return redirect('users:ver_perfil')  # Redirigir al perfil del usuario autenticado
        
        if request.method == 'POST':
            form = PerfilUsuarioForm(request.POST, request.FILES, instance=perfil)
            if form.is_valid():
                # Procesar la foto de perfil
                if request.FILES.get('foto_perfil'):
                    usuario.foto_perfil = request.FILES['foto_perfil']
                    usuario.save()
                
                # Procesar las redes sociales
                redes_sociales = {
                    'instagram': request.POST.get('instagram', ''),
                    'twitter': request.POST.get('twitter', ''),
                    'facebook': request.POST.get('facebook', '')
                }
                perfil.redes_sociales = redes_sociales
                
                # Procesar los campos de preferencias como texto normal
                estilos = request.POST.getlist('estilos_preferidos')
                colores = request.POST.getlist('colores_preferidos')
                
                perfil.estilos_preferidos = ', '.join(estilos) if estilos else ''
                perfil.colores_preferidos = ', '.join(colores) if colores else ''
                perfil.ocasiones_uso = request.POST.get('ocasiones_uso', '')
                
                # Guardar el formulario
                form.save()
                messages.success(request, 'Perfil actualizado exitosamente.')
                return redirect('users:ver_perfil')
            else:
                messages.error(request, 'Por favor, corrige los errores en el formulario.')
        else:
            form = PerfilUsuarioForm(instance=perfil)
        
        return render(request, 'users/editar_perfil.html', {
            'form': form,
            'usuario': usuario,
            'perfil': perfil
        })
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('users:login')
    
from posts.models import Like, Favorito, Venta, Alquiler, Compra, Publicacion
from recommendations.views import recomendaciones_view

def generar_grafica(datos, titulo, tipo='bar'):
    """
    Genera una gráfica con matplotlib y la devuelve como una imagen en base64.
    """
    fig, ax = plt.subplots(figsize=(6, 4))
    
    if tipo == 'bar':
        ax.bar(datos.keys(), datos.values(), color=['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'])
    elif tipo == 'pie':
        ax.pie(datos.values(), labels=datos.keys(), autopct='%1.1f%%', colors=['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800'])
    
    ax.set_title(titulo)
    plt.tight_layout()

    # Guardar la gráfica en un buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    imagen_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    buffer.close()
    plt.close(fig)
    return imagen_base64

def dashboard(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('/users/login/')

    try:
        # Mantener las estadísticas existentes
        total_likes = Like.objects.filter(usuario_id=usuario_id).count()
        total_favoritos = Favorito.objects.filter(usuario_id=usuario_id).count()
        total_publicaciones = Publicacion.objects.filter(usuario_id=usuario_id).count()
        total_ventas = Venta.objects.filter(vendedor_id=usuario_id).count()
        total_alquileres = Alquiler.objects.filter(cliente_id=usuario_id).count()
        total_compras = Venta.objects.filter(comprador_id=usuario_id).count()

        # Obtener recomendaciones
        recomendaciones = recomendaciones_view(request, return_as_list=True)
        total_recomendaciones = len(recomendaciones)

        # Calcular datos para las gráficas existentes
        estilos_count = {}
        colores_count = {}

        for rec in recomendaciones:
            publicacion = rec['publicacion']
            # Contar estilos
            if publicacion.estilo:
                for estilo in publicacion.estilo:
                    estilos_count[estilo] = estilos_count.get(estilo, 0) + 1
            # Contar colores
            if publicacion.colores:
                for color in publicacion.colores:
                    colores_count[color] = colores_count.get(color, 0) + 1

        # Generar gráficas con matplotlib
        grafica_estilos = generar_grafica(estilos_count, 'Distribución de Estilos', tipo='pie')
        grafica_colores = generar_grafica(colores_count, 'Distribución de Colores', tipo='bar')

        # Pasar todos los datos al contexto
        context = {
            'total_likes': total_likes,
            'total_favoritos': total_favoritos,
            'total_publicaciones': total_publicaciones,
            'total_ventas': total_ventas,
            'total_alquileres': total_alquileres,
            'total_compras': total_compras,
            'total_recomendaciones': total_recomendaciones,
            'grafica_estilos': grafica_estilos,
            'grafica_colores': grafica_colores,
            'estilos_count': json.dumps(estilos_count),  # Convertir a JSON
            'colores_count': json.dumps(colores_count),  # Convertir a JSON
        }
        return render(request, 'users/dashboard.html', context)

    except Exception as e:
        print(f"Error en el Dashboard: {str(e)}")
        return render(request, 'users/dashboard.html', {
            'error': 'Ocurrió un error al cargar el Dashboard.'
        })

def dashboard_data(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    total_likes = Like.objects.filter(usuario_id=usuario_id).count()
    total_favoritos = Favorito.objects.filter(usuario_id=usuario_id).count()
    total_compras = Venta.objects.filter(usuario_id=usuario_id).count()
    total_alquileres = Alquiler.objects.filter(usuario_id=usuario_id).count()
    recomendaciones = recomendaciones_view(request)
    total_recomendaciones = len(recomendaciones)

    return JsonResponse({
        'total_likes': total_likes,
        'total_favoritos': total_favoritos,
        'total_compras': total_compras,
        'total_alquileres': total_alquileres,
        'total_recomendaciones': total_recomendaciones,
    })

def recomendaciones_view(request, return_as_list=False):
    # Verificar autenticación
    if not request.user.is_authenticated and not request.session.get('usuario_id'):
        return redirect(f'/users/login/?next={request.path}')
    
    try:
        # Obtener perfil
        usuario_id = request.user.id if request.user.is_authenticated else request.session.get('usuario_id')
        perfil = PerfilUsuario.objects.get(usuario_id=usuario_id)
        
        # Obtener publicaciones excluyendo las del usuario
        publicaciones = Publicacion.objects.exclude(usuario_id=usuario_id).filter(
            publico=perfil.genero
        )
        
        # Generar recomendaciones (ejemplo simplificado)
        recomendaciones = [
            {'publicacion': pub, 'puntuacion': 80} for pub in publicaciones
        ]
        
        if return_as_list:
            return recomendaciones  # Devolver como lista si se solicita
        
        return render(request, 'recommendations/list.html', {
            'recomendaciones': recomendaciones,
        })
    
    except PerfilUsuario.DoesNotExist:
        if return_as_list:
            return []  # Devolver lista vacía si no hay perfil
        return render(request, 'recommendations/list.html', {
            'error': 'Completa tu perfil para obtener recomendaciones.'
        })

from django.db.models import Count, Q
from posts.models import Comentario  # Si no está ya importado

def dashboard_data_sentimientos(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Calcular distribución de sentimientos en los comentarios del usuario
        comentarios = Comentario.objects.filter(usuario_id=usuario_id)
        comentarios_positivos = comentarios.filter(clasificacion_chatgpt='positivo').count()
        comentarios_neutros = comentarios.filter(clasificacion_chatgpt='neutro').count()
        comentarios_negativos = comentarios.filter(clasificacion_chatgpt='negativo').count()

        # Calcular sentimientos en publicaciones interactuadas (likes y favoritos)
        publicaciones_interactuadas = Publicacion.objects.filter(
            id__in=Like.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        ) | Publicacion.objects.filter(
            id__in=Favorito.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        )
        sentimientos_interactuados = Comentario.objects.filter(publicacion__in=publicaciones_interactuadas).values(
            'clasificacion_chatgpt'
        ).annotate(total=Count('clasificacion_chatgpt'))

        # Calcular evolución temporal de sentimientos
        evolucion_sentimientos = Comentario.objects.filter(usuario_id=usuario_id).extra(
            select={'fecha': "DATE(fecha_comentario)"}  # Cambiar a 'fecha_comentario'
        ).values('fecha', 'clasificacion_chatgpt').annotate(total=Count('id'))

        return JsonResponse({
            'comentarios': {
                'positivos': comentarios_positivos,
                'neutros': comentarios_neutros,
                'negativos': comentarios_negativos,
            },
            'interactuados': list(sentimientos_interactuados),
            'evolucion': list(evolucion_sentimientos),
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
def logout_view(request):
    """Cerrar sesión del usuario."""
    request.session.flush()
    return redirect('users:login')

def ver_perfil_usuario(request, usuario_id):
    # Obtener el ID del usuario logueado
    usuario_logueado_id = request.session.get('usuario_id')
    
    # Si el usuario está viendo su propio perfil, redirigir a ver_perfil
    if str(usuario_id) == str(usuario_logueado_id):
        return redirect('users:ver_perfil')
    
    # Si no es su propio perfil, mostrar el perfil público
    usuario = get_object_or_404(Usuario, id=usuario_id)
    try:
        perfil = PerfilUsuario.objects.get(usuario=usuario)
    except PerfilUsuario.DoesNotExist:
        perfil = None
    
    # Obtener conteos
    publicaciones = Publicacion.objects.filter(usuario=usuario).order_by('-fecha_publicacion')
    publicaciones_count = publicaciones.count()
    ventas_count = Venta.objects.filter(publicacion__usuario=usuario).count()
    alquileres_count = Alquiler.objects.filter(publicacion__usuario=usuario).count()

    # Asegurarse que los valores no sean None
    if not ventas_count:
        ventas_count = 0
    if not alquileres_count:
        alquileres_count = 0

    context = {
        'usuario': usuario,
        'perfil': perfil,
        'publicaciones': publicaciones,
        'publicaciones_count': publicaciones_count,
        'ventas_count': ventas_count,
        'alquileres_count': alquileres_count,
    }
    
    return render(request, 'users/perfiles.html', context)
