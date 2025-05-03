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
from recommendations.views import recomendaciones_view, obtener_recomendaciones_ids  # Importa la nueva función
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
from collections import defaultdict
import json
from django.views.decorators.http import require_http_methods
from django.db.models.functions import TruncDate, TruncMonth

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
            likes_count=Count('like', distinct=True),
            favoritos_count=Count('favorito', distinct=True),
            comentarios_count=Count('comentario', distinct=True),
            # Añadir conteo de sentimientos
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
            # Añadir estas anotaciones para verificar las interacciones del usuario
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
            ),
            user_commented=Exists(
                Comentario.objects.filter(
                    publicacion=OuterRef('pk'),
                    usuario_id=usuario_id
                )
            ),
            comentarios_positivos_textblob=Count(
                'comentario',
                filter=Q(comentario__clasificacion_textblob='positivo'),
                distinct=True
            ),
            comentarios_neutros_textblob=Count(
                'comentario',
                filter=Q(comentario__clasificacion_textblob='neutro'),
                distinct=True
            ),
            comentarios_negativos_textblob=Count(
                'comentario',
                filter=Q(comentario__clasificacion_textblob='negativo'),
                distinct=True
            ),
            total_comentarios=Count('comentario', distinct=True)
        ).order_by('-fecha_publicacion')
        
        # Obtener conteos generales
        publicaciones_count = publicaciones.count()
        ventas = Venta.objects.filter(publicacion__usuario=usuario).count()
        alquileres = Alquiler.objects.filter(publicacion__usuario=usuario).count()

        if not ventas:
            ventas = 0
        if not alquileres:
            alquileres = 0
        
        # Para cada publicación, calcular el sentimiento predominante
        for publicacion in publicaciones:
            total_comentarios = (publicacion.comentarios_positivos + 
                               publicacion.comentarios_neutros + 
                               publicacion.comentarios_negativos)
            
            if total_comentarios > 0:
                if publicacion.comentarios_positivos > publicacion.comentarios_negativos:
                    publicacion.sentimiento = 'positivo'
                elif publicacion.comentarios_negativos > publicacion.comentarios_positivos:
                    publicacion.sentimiento = 'negativo'
                else:
                    publicacion.sentimiento = 'neutro'
            else:
                publicacion.sentimiento = 'neutro'
        
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
    usuario_id = request.session.get('usuario_id')  # Obtener el usuario desde la sesión
    if not usuario_id:
        return redirect('users:login')

    # Lista de estilos válidos
    ESTILOS_VALIDOS = ['Casual', 'Formal', 'Deportivo', 'Elegante', 'Bohemio', 'Vintage', 'Minimalista', 'Streetwear']

    # Inicializar el contador de estilos
    estilos_count = {estilo: 0 for estilo in ESTILOS_VALIDOS}

    # Obtener publicaciones asociadas a cada interacción
    likes = Publicacion.objects.filter(id__in=Like.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True))
    favoritos = Publicacion.objects.filter(id__in=Favorito.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True))
    recomendaciones = Publicacion.objects.filter(id__in=obtener_recomendaciones_ids(request))
    compras = Publicacion.objects.filter(id__in=Venta.objects.filter(comprador_id=usuario_id).values_list('publicacion_id', flat=True))
    alquileres = Publicacion.objects.filter(id__in=Alquiler.objects.filter(cliente_id=usuario_id).values_list('publicacion_id', flat=True))

    # Combinar todas las publicaciones únicas
    publicaciones = likes | favoritos | recomendaciones | compras | alquileres

    # Contar los estilos de las publicaciones
    for publicacion in publicaciones.distinct():  # Evitar duplicados
        if publicacion.estilo:  # Asegurarse de que el campo estilo no sea nulo
            estilos = publicacion.estilo if isinstance(publicacion.estilo, list) else publicacion.estilo.split(", ")
            for estilo in estilos:
                if estilo in ESTILOS_VALIDOS:
                    estilos_count[estilo] += 1

    # Calcular los contadores para los iCards
    total_publicaciones = Publicacion.objects.filter(usuario_id=usuario_id).count()
    total_ventas = Venta.objects.filter(comprador_id=usuario_id).count()
    total_alquileres = Alquiler.objects.filter(cliente_id=usuario_id).count()
    total_likes = likes.count()
    total_favoritos = favoritos.count()
    total_compras = compras.count()
    total_recomendaciones = recomendaciones.count()

    context = {
        'estilos_count': json.dumps(estilos_count),  # Pasar los datos de estilos al template
        'total_publicaciones': total_publicaciones,
        'total_ventas': total_ventas,
        'total_alquileres': total_alquileres,
        'total_likes': total_likes,
        'total_favoritos': total_favoritos,
        'total_compras': total_compras,
        'total_recomendaciones': total_recomendaciones,
    }
    return render(request, 'users/dashboard.html', context)

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
    
    # Obtener publicaciones con las mismas anotaciones que en ver_perfil
    publicaciones = Publicacion.objects.filter(usuario=usuario).annotate(
        likes_count=Count('like', distinct=True),
        favoritos_count=Count('favorito', distinct=True),
        comentarios_count=Count('comentario', distinct=True),
        # Añadir conteo de sentimientos
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
        # Añadir estas anotaciones para verificar las interacciones del usuario logueado
        user_liked=Exists(
            Like.objects.filter(
                publicacion=OuterRef('pk'),
                usuario_id=usuario_logueado_id
            )
        ),
        user_favorited=Exists(
            Favorito.objects.filter(
                publicacion=OuterRef('pk'),
                usuario_id=usuario_logueado_id
            )
        ),
        user_commented=Exists(
            Comentario.objects.filter(
                publicacion=OuterRef('pk'),
                usuario_id=usuario_logueado_id
            )
        ),
        comentarios_positivos_textblob=Count(
            'comentario',
            filter=Q(comentario__clasificacion_textblob='positivo'),
            distinct=True
        ),
        comentarios_neutros_textblob=Count(
            'comentario',
            filter=Q(comentario__clasificacion_textblob='neutro'),
            distinct=True
        ),
        comentarios_negativos_textblob=Count(
            'comentario',
            filter=Q(comentario__clasificacion_textblob='negativo'),
            distinct=True
        ),
        total_comentarios=Count('comentario', distinct=True)
    ).order_by('-fecha_publicacion')

    # Para cada publicación, calcular el sentimiento predominante
    for publicacion in publicaciones:
        total_comentarios = (publicacion.comentarios_positivos + 
                           publicacion.comentarios_neutros + 
                           publicacion.comentarios_negativos)
        
        if total_comentarios > 0:
            if publicacion.comentarios_positivos > publicacion.comentarios_negativos:
                publicacion.sentimiento = 'positivo'
            elif publicacion.comentarios_negativos > publicacion.comentarios_positivos:
                publicacion.sentimiento = 'negativo'
            else:
                publicacion.sentimiento = 'neutro'
        else:
            publicacion.sentimiento = 'neutro'
    
    # Obtener conteos generales
    publicaciones_count = publicaciones.count()
    ventas_count = Venta.objects.filter(publicacion__usuario=usuario).count()
    alquileres_count = Alquiler.objects.filter(publicacion__usuario=usuario).count()

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

def dashboard_data_estilos(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Obtener todas las publicaciones con las que el usuario ha interactuado
        likes = Publicacion.objects.filter(
            likes__usuario_id=usuario_id
        ).values_list('estilo', flat=True)
        
        favoritos = Publicacion.objects.filter(
            favoritos__usuario_id=usuario_id
        ).values_list('estilo', flat=True)
        
        compras = Publicacion.objects.filter(
            venta__comprador_id=usuario_id
        ).values_list('estilo', flat=True)
        
        alquileres = Publicacion.objects.filter(
            alquiler__cliente_id=usuario_id
        ).values_list('estilo', flat=True)

        # Combinar todos los estilos
        todos_estilos = list(likes) + list(favoritos) + list(compras) + list(alquileres)
        
        # Contador de estilos
        estilos_count = {
            'Casual': 0,
            'Formal': 0,
            'Deportivo': 0,
            'Elegante': 0,
            'Bohemio': 0,
            'Vintage': 0,
            'Minimalista': 0,
            'Streetwear': 0
        }

        # Contar ocurrencias de cada estilo
        for estilos in todos_estilos:
            if estilos:  # Verificar que no sea None
                if isinstance(estilos, str):
                    estilos = estilos.split(',')
                for estilo in estilos:
                    estilo = estilo.strip()
                    if estilo in estilos_count:
                        estilos_count[estilo] += 1

        return JsonResponse(estilos_count)

    except Exception as e:
        return JsonResponse({
            'error': f'Error al obtener datos de estilos: {str(e)}'
        }, status=500)

def recomendaciones_estilo_color(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Obtener las 14 recomendaciones del usuario autenticado
        recomendaciones = Publicacion.objects.filter(
            id__in=obtener_recomendaciones_ids(request)
        )[:14]  # Limitar a 14 publicaciones

        # Inicializar los datos
        estilos = ['casual', 'formal', 'deportivo', 'elegante', 'bohemio', 'vintage', 'minimalista', 'streetwear']
        colores = ['azul', 'negro', 'rojo', 'verde', 'amarillo', 'blanco', 'gris', 'marrón']
        datos = {estilo: {color: 0 for color in colores} for estilo in estilos}

        # Contar las recomendaciones por estilo y color
        for publicacion in recomendaciones:
            estilos_publicacion = publicacion.estilo if isinstance(publicacion.estilo, list) else publicacion.estilo.split(',')
            colores_publicacion = publicacion.colores if isinstance(publicacion.colores, list) else publicacion.colores.split(',')

            for estilo in estilos_publicacion:
                estilo = estilo.strip().lower()  # Normalizar a minúsculas
                if estilo in datos:
                    for color in colores_publicacion:
                        color = color.strip().lower()  # Normalizar a minúsculas
                        if color in datos[estilo]:
                            datos[estilo][color] += 1

        return JsonResponse(datos)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.http import JsonResponse
from collections import defaultdict

def likes_favoritos_estilo_color(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Inicializar los datos
        estilos = ['casual', 'formal', 'deportivo', 'elegante', 'bohemio', 'vintage', 'minimalista', 'streetwear']
        colores = ['azul', 'negro', 'rojo', 'verde', 'amarillo', 'blanco', 'gris', 'marrón']
        datos = {estilo: {color: {'likes': 0, 'favoritos': 0} for color in colores} for estilo in estilos}

        # Obtener publicaciones con likes y favoritos
        likes = Publicacion.objects.filter(
            id__in=Like.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        )
        favoritos = Publicacion.objects.filter(
            id__in=Favorito.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        )

        # Contar likes por estilo y color
        for publicacion in likes:
            estilos_publicacion = publicacion.estilo if isinstance(publicacion.estilo, list) else publicacion.estilo.split(',')
            colores_publicacion = publicacion.colores if isinstance(publicacion.colores, list) else publicacion.colores.split(',')
            for estilo in estilos_publicacion:
                estilo = estilo.strip().lower()
                if estilo in datos:
                    for color in colores_publicacion:
                        color = color.strip().lower()
                        if color in datos[estilo]:
                            datos[estilo][color]['likes'] += 1

        # Contar favoritos por estilo y color
        for publicacion in favoritos:
            estilos_publicacion = publicacion.estilo if isinstance(publicacion.estilo, list) else publicacion.estilo.split(',')
            colores_publicacion = publicacion.colores if isinstance(publicacion.colores, list) else publicacion.colores.split(',')
            for estilo in estilos_publicacion:
                estilo = estilo.strip().lower()
                if estilo in datos:
                    for color in colores_publicacion:
                        color = color.strip().lower()
                        if color in datos[estilo]:
                            datos[estilo][color]['favoritos'] += 1

        return JsonResponse(datos)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.db.models import Count

def comentarios_sentimientos_usuario(request):
    try:
        # Obtener el ID del usuario desde la sesión
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado'}, status=401)

        # Filtrar comentarios del usuario autenticado
        comentarios = Comentario.objects.filter(usuario_id=usuario_id).values('clasificacion_chatgpt').annotate(total=Count('id'))

        # Inicializar los datos
        data = {'positivo': 0, 'neutro': 0, 'negativo': 0}
        for comentario in comentarios:
            clasificacion = comentario['clasificacion_chatgpt']
            if clasificacion in data:
                data[clasificacion] = comentario['total']

        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

from django.http import JsonResponse
from posts.models import Venta, Alquiler, Compra

def dashboard_compras_ventas_alquileres(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Calcular las compras realizadas por el usuario
        total_compras = Venta.objects.filter(comprador_id=usuario_id).count()
        # Calcular las ventas realizadas por el usuario
        total_ventas = Venta.objects.filter(comprador_id=usuario_id).count()

        # Calcular los alquileres realizados por el usuario
        total_alquileres = Alquiler.objects.filter(cliente_id=usuario_id).count()

        return JsonResponse({
            'compras': total_compras,
            'ventas': total_ventas,
            'alquileres': total_alquileres,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.db.models.functions import TruncMonth

def dashboard_actividad_tiempo(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Agrupar compras por mes
        compras = Venta.objects.filter(comprador_id=usuario_id).annotate(mes=TruncMonth('fecha_venta')).values('mes').annotate(total=Count('id')).order_by('mes')

        # Agrupar ventas por mes
        ventas = Venta.objects.filter(publicacion__usuario_id=usuario_id).annotate(mes=TruncMonth('fecha_venta')).values('mes').annotate(total=Count('id')).order_by('mes')

        # Agrupar alquileres por mes
        alquileres = Alquiler.objects.filter(cliente_id=usuario_id).annotate(mes=TruncMonth('fecha_inicio')).values('mes').annotate(total=Count('id')).order_by('mes')

        return JsonResponse({
            'compras': list(compras),
            'ventas': list(ventas),
            'alquileres': list(alquileres),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.http import JsonResponse
from django.db.models import Count
from posts.models import Venta, Alquiler
from compras.models import Compra

def dashboard_transacciones_por_estado(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Agrupar compras por estado
        compras = Compra.objects.filter(comprador_id=usuario_id).values('estado').annotate(total=Count('id'))

        # Agrupar ventas por estado
        ventas = Venta.objects.filter(publicacion__usuario_id=usuario_id).values('estado').annotate(total=Count('id'))

        # Agrupar alquileres por estado
        alquileres = Alquiler.objects.filter(cliente_id=usuario_id).values('estado').annotate(total=Count('id'))

        return JsonResponse({
            'compras': list(compras),
            'ventas': list(ventas),
            'alquileres': list(alquileres),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.db.models import Sum

def dashboard_ingresos_gastos(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Calcular ingresos por ventas
        ingresos_ventas = Venta.objects.filter(publicacion__usuario_id=usuario_id).aggregate(total=Sum('precio_final'))['total'] or 0

        # Calcular ingresos por alquileres
        ingresos_alquileres = Alquiler.objects.filter(publicacion__usuario_id=usuario_id).aggregate(total=Sum('precio_total'))['total'] or 0

        # Calcular gastos en compras
        gastos_compras = Compra.objects.filter(comprador_id=usuario_id).aggregate(total=Sum('precio_final'))['total'] or 0

        return JsonResponse({
            'ingresos_ventas': ingresos_ventas,
            'ingresos_alquileres': ingresos_alquileres,
            'gastos_compras': gastos_compras,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

from django.http import JsonResponse
from collections import Counter

def dashboard_estilos_colores(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

    try:
        # Inicializar contadores
        estilos_colores_count = Counter()

        # Procesar ventas
        ventas = Venta.objects.filter(publicacion__usuario_id=usuario_id)
        for venta in ventas:
            estilos = venta.publicacion.estilo or []
            colores = venta.publicacion.colores or []
            for estilo in estilos:
                for color in colores:
                    estilos_colores_count[(estilo.strip().lower(), color.strip().lower(), 'venta')] += 1

        # Procesar compras
        compras = Compra.objects.filter(comprador_id=usuario_id)
        for compra in compras:
            estilos = compra.publicacion.estilo or []
            colores = compra.publicacion.colores or []
            for estilo in estilos:
                for color in colores:
                    estilos_colores_count[(estilo.strip().lower(), color.strip().lower(), 'compra')] += 1

        # Procesar alquileres
        alquileres = Alquiler.objects.filter(cliente_id=usuario_id)
        for alquiler in alquileres:
            estilos = alquiler.publicacion.estilo or []
            colores = alquiler.publicacion.colores or []
            for estilo in estilos:
                for color in colores:
                    estilos_colores_count[(estilo.strip().lower(), color.strip().lower(), 'alquiler')] += 1

        # Formatear los datos para enviarlos al frontend
        data = [
            {'estilo': estilo, 'color': color, 'tipo': tipo, 'cantidad': cantidad}
            for (estilo, color, tipo), cantidad in estilos_colores_count.items()
        ]

        return JsonResponse({'data': data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)