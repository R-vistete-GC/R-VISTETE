from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Sum, Count, Q
from .models import Publicacion, Comentario, Venta, Alquiler, Favorito, Like, Dislike, Compra
from users.models import Usuario
from django.utils import timezone
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .recommender import RecomendadorPrendas
from django.contrib import messages
from decimal import Decimal
from datetime import datetime
from django.db import connection
from sentiment_analysis.utils import SentimentAnalyzer  # Importar el analizador de sentimientos

#inicio - publicaciones

def inicio_view(request):
    publicaciones = Publicacion.objects.all()
    usuario_id = request.session.get('usuario_id')
    
    # Obtener las interacciones del usuario si está autenticado
    if usuario_id:
        likes_usuario = Like.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        favoritos_usuario = Favorito.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
        comentarios_usuario = Comentario.objects.filter(usuario_id=usuario_id).values_list('publicacion_id', flat=True)
    
    for publicacion in publicaciones:
        # Mantener el código existente...
        if publicacion.tipo == 'venta':
            publicacion.precio = publicacion.precio_venta
        elif publicacion.tipo == 'alquiler':
            publicacion.precio = publicacion.precio_alquiler
        else:
            publicacion.precio_mostrar = {
                'venta': publicacion.precio_venta,
                'alquiler': publicacion.precio_alquiler
            }

        # Mantener las métricas existentes de comentarios
        comentarios = Comentario.objects.filter(publicacion=publicacion)
        publicacion.comentarios_positivos = comentarios.filter(clasificacion_chatgpt='positivo').count()
        publicacion.comentarios_neutros = comentarios.filter(clasificacion_chatgpt='neutro').count()
        publicacion.comentarios_negativos = comentarios.filter(clasificacion_chatgpt='negativo').count()
        publicacion.total_comentarios = comentarios.count()
        
        # Agregar contadores existentes
        publicacion.likes_count = Like.objects.filter(publicacion=publicacion).count()
        publicacion.favoritos_count = Favorito.objects.filter(publicacion=publicacion).count()
        publicacion.comentarios_count = Comentario.objects.filter(publicacion=publicacion).count()

        # Agregar estados de interacción del usuario si está autenticado
        if usuario_id:
            publicacion.user_liked = publicacion.id in likes_usuario
            publicacion.user_favorited = publicacion.id in favoritos_usuario
            publicacion.user_commented = publicacion.id in comentarios_usuario
            
        # Agregar la URL de la imagen al contexto
        publicacion.imagen_url = publicacion.imagen.url if publicacion.imagen else None

    context = {
        'publicaciones': publicaciones,
    }
    return render(request, 'inicio.html', context)

#comentarios

@require_http_methods(["GET"])
def get_comentarios(request, publicacion_id):
    try:
        # Obtener los comentarios de la publicación
        comentarios = Comentario.objects.filter(
            publicacion_id=publicacion_id
        ).select_related('usuario').order_by('-fecha_comentario')
        
        comentarios_data = []
        for comentario in comentarios:
            comentarios_data.append({
                'id': comentario.id,
                'usuario': comentario.usuario.nombre if comentario.usuario else 'Usuario Anónimo',
                'texto': comentario.comentario,
                'fecha': comentario.fecha_comentario.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'comentarios': comentarios_data
        }, safe=False)
    except Exception as e:
        print("Error al obtener comentarios:", str(e))
        return JsonResponse({
            'success': False,
            'error': str(e),
            'comentarios': []
        }, status=500)

#crear comentarios
@login_required
@require_http_methods(["POST"])
def crear_comentario(request):
    try:
        # Imprimir información de depuración
        print("Datos recibidos:", request.POST)
        print("Usuario:", request.user)
        
        comentario_texto = request.POST.get('comentario')
        publicacion_id = request.POST.get('publicacion_id')
        
        if not comentario_texto or not publicacion_id:
            return JsonResponse({
                'error': 'Faltan datos requeridos',
                'comentario_presente': bool(comentario_texto),
                'publicacion_presente': bool(publicacion_id)
            }, status=400)
        
        try:
            publicacion = Publicacion.objects.get(id=publicacion_id)
        except Publicacion.DoesNotExist:
            return JsonResponse({'error': 'Publicación no encontrada'}, status=404)
        
        try:
            comentario = Comentario.objects.create(
                usuario=request.user.usuario,
                publicacion=publicacion,
                comentario=comentario_texto
            )
        except Exception as e:
            print("Error al crear comentario:", str(e))
            return JsonResponse({'error': f'Error al crear el comentario: {str(e)}'}, status=500)
        
        return JsonResponse({
            'success': True,
            'comentario': {
                'id': comentario.id,
                'usuario_nombre': comentario.usuario.nombre,
                'usuario_foto': comentario.usuario.foto_perfil,
                'comentario': comentario.comentario,
                'fecha_comentario': comentario.fecha_comentario.isoformat()
            }
        })
    except Exception as e:
        print("Error general:", str(e))
        return JsonResponse({'error': str(e)}, status=500)

#ventas
@login_required(login_url='/users/login/')
def mis_ventas_view(request):
    try:
        # Asegurarnos de que el usuario tenga un perfil
        usuario = request.user.usuario
        
        # Obtener las publicaciones del usuario actual
        mis_publicaciones = Publicacion.objects.filter(usuario=usuario)
        
        # Obtener las ventas realizadas
        ventas = Venta.objects.filter(vendedor=usuario)
        
        # Calcular estadísticas
        estadisticas = {
            'total_publicaciones': mis_publicaciones.count(),
            'total_vendidas': ventas.filter(estado='completada').count(),
            'total_ingresos': ventas.filter(estado='completada').aggregate(Sum('precio_final'))['precio_final__sum'] or 0,
            'ventas_pendientes': ventas.filter(estado='pendiente').count(),
            'ventas_mes_actual': ventas.filter(
                estado='completada',
                fecha_venta__month=timezone.now().month,
                fecha_venta__year=timezone.now().year
            ).count()
        }

        # Filtrar publicaciones según parámetros
        estado = request.GET.get('estado')
        busqueda = request.GET.get('busqueda')

        if estado:
            if (estado == 'vendida'):
                mis_publicaciones = mis_publicaciones.filter(id__in=ventas.filter(estado='completada').values('publicacion_id'))
            elif (estado == 'disponible'):
                mis_publicaciones = mis_publicaciones.exclude(id__in=ventas.filter(estado='completada').values('publicacion_id'))

        if busqueda:
            mis_publicaciones = mis_publicaciones.filter(
                Q(titulo__icontains=busqueda) | Q(descripcion__icontains=busqueda)
            )

        # Obtener el historial de ventas para cada publicación
        publicaciones_data = []
        for pub in mis_publicaciones:
            ventas_pub = ventas.filter(publicacion=pub).order_by('-fecha_venta')
            publicaciones_data.append({
                'publicacion': pub,
                'ventas': ventas_pub,
                'total_ventas': ventas_pub.filter(estado='completada').count(),
                'ultima_venta': ventas_pub.first()
            })

        return render(request, 'mis_ventas.html', {
            'publicaciones': publicaciones_data,
            'estadisticas': estadisticas,
            'filtro_estado': estado,
            'busqueda': busqueda
        })
    except Usuario.DoesNotExist:
        # Si el usuario no tiene perfil, redirigir a completar perfil
        return redirect('completar_perfil')

#alquileres
@login_required(login_url='/users/login/')
def mis_alquileres_view(request):
    try:
        # Asegurarnos de que el usuario tenga un perfil
        usuario = request.user.usuario
        
        # Obtener las publicaciones del usuario actual
        mis_publicaciones = Publicacion.objects.filter(usuario=usuario)
        
        # Obtener los alquileres realizados
        alquileres = Alquiler.objects.filter(propietario=usuario)
        
        # Calcular estadísticas
        hoy = timezone.now().date()
        estadisticas = {
            'total_publicaciones': mis_publicaciones.count(),
            'total_alquiladas': alquileres.filter(estado='completado').count(),
            'actualmente_alquiladas': alquileres.filter(
                estado='activo',
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy
            ).count(),
            'total_ingresos': alquileres.filter(estado='completado').aggregate(
                total=Sum('precio_por_dia')
            )['total'] or 0,
            'depositos_activos': alquileres.filter(estado='activo').aggregate(
                total=Sum('deposito')
            )['total'] or 0
        }

        # Filtrar publicaciones según parámetros
        estado = request.GET.get('estado')
        fecha_desde = request.GET.get('fecha_desde')
        busqueda = request.GET.get('busqueda')

        if estado:
            if (estado == 'alquilada'):
                mis_publicaciones = mis_publicaciones.filter(
                    id__in=alquileres.filter(estado='activo').values('publicacion_id')
                )
            elif (estado == 'disponible'):
                mis_publicaciones = mis_publicaciones.exclude(
                    id__in=alquileres.filter(estado='activo').values('publicacion_id')
                )

        # Obtener el calendario de alquileres para cada publicación
        publicaciones_data = []
        for pub in mis_publicaciones:
            alquileres_pub = alquileres.filter(publicacion=pub).order_by('fecha_inicio')
            proximos_alquileres = alquileres_pub.filter(
                Q(estado='reservado') | Q(estado='activo'),
                fecha_fin__gte=hoy
            )
            publicaciones_data.append({
                'publicacion': pub,
                'alquileres': alquileres_pub,
                'proximos_alquileres': proximos_alquileres,
                'disponible': not proximos_alquileres.filter(
                    fecha_inicio__lte=hoy,
                    fecha_fin__gte=hoy
                ).exists()
            })

        return render(request, 'mis_alquileres.html', {
            'publicaciones': publicaciones_data,
            'estadisticas': estadisticas,
            'filtro_estado': estado,
            'fecha_desde': fecha_desde,
            'busqueda': busqueda
        })
    except Usuario.DoesNotExist:
        # Si el usuario no tiene perfil, redirigir a completar perfil
        return redirect('completar_perfil')

#notificaciones
@login_required
def notificaciones_view(request):
    try:
        # Obtener recomendaciones personalizadas
        recomendador = RecomendadorPrendas(request.user.id)
        recomendaciones = recomendador.generar_recomendaciones(limit=5)
        
        context = {
            'recomendaciones': recomendaciones,
        }
        return render(request, 'posts/notificaciones.html', context)
    except Exception as e:
        context = {
            'error': 'No se pudieron cargar las recomendaciones en este momento.',
            'recomendaciones': []
        }
        return render(request, 'posts/notificaciones.html', context)


#favoritos
@require_http_methods(["POST"])
def toggle_favorito(request, publicacion_id):
    try:
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)
            
        usuario = Usuario.objects.get(id=usuario_id)
        publicacion = Publicacion.objects.get(id=publicacion_id)
        
        # Verificar si ya existe el favorito
        favorito = Favorito.objects.filter(usuario=usuario, publicacion=publicacion).first()
        
        if favorito:
            # Si existe, lo eliminamos
            favorito.delete()
            favoritos_count = Favorito.objects.filter(usuario=usuario).count()
            return JsonResponse({
                'status': 'removed',
                'message': 'Eliminado de favoritos',
                'favoritos_count': favoritos_count
            })
        else:
            # Si no existe, lo creamos
            Favorito.objects.create(usuario=usuario, publicacion=publicacion)
            favoritos_count = Favorito.objects.filter(usuario=usuario).count()
            return JsonResponse({
                'status': 'added',
                'message': 'Agregado a favoritos',
                'favoritos_count': favoritos_count
            })
            
    except Publicacion.DoesNotExist:
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

#ver favoritos
def ver_favoritos(request):
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('/usuarios/login/')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        # Obtener todos los favoritos del usuario
        favoritos = Favorito.objects.filter(usuario=usuario).select_related('publicacion')
        
        context = {
            'favoritos': favoritos,
            'usuario': usuario,
            'nombre_usuario': usuario.nombre,
            'favoritos_count': favoritos.count()
        }
        return render(request, 'favoritos.html', context)
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('/usuarios/login/')

#likes
@require_http_methods(["POST"])
def toggle_like(request, publicacion_id):
    try:
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)
            
        usuario = Usuario.objects.get(id=usuario_id)
        publicacion = Publicacion.objects.get(id=publicacion_id)
        
        # Verificar si ya existe el like
        like = Like.objects.filter(usuario=usuario, publicacion=publicacion).first()
        
        if (like):
            # Si existe, lo eliminamos
            like.delete()
            likes_count = Like.objects.filter(publicacion=publicacion).count()
            user_likes_count = Like.objects.filter(usuario=usuario).count()
            return JsonResponse({
                'status': 'removed',
                'message': 'Like removido',
                'likes_count': likes_count,
                'user_likes_count': user_likes_count
            })
        else:
            # Si no existe, lo creamos
            Like.objects.create(usuario=usuario, publicacion=publicacion)
            likes_count = Like.objects.filter(publicacion=publicacion).count()
            user_likes_count = Like.objects.filter(usuario=usuario).count()
            return JsonResponse({
                'status': 'added',
                'message': 'Like agregado',
                'likes_count': likes_count,
                'user_likes_count': user_likes_count
            })
            
    except Publicacion.DoesNotExist:
        return JsonResponse({'error': 'Publicación no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

#ver likes
def ver_likes(request):
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('/usuarios/login/')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        # Obtener todas las publicaciones que el usuario ha dado like
        likes = Like.objects.filter(usuario=usuario).select_related('publicacion')
        
        context = {
            'likes': likes,
            'usuario': usuario,
            'nombre_usuario': usuario.nombre,
            'likes_count': likes.count()
        }
        return render(request, 'likes.html', context)
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('/usuarios/login/')

#agregar comentarios a las publicaciones
@require_http_methods(["POST"])
def agregar_comentario(request, publicacion_id):
    try:
        # Verificar si el usuario está autenticado
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado'}, status=401)

        # Obtener el usuario y la publicación
        usuario = Usuario.objects.get(id=usuario_id)
        publicacion = Publicacion.objects.get(id=publicacion_id)

        # Obtener el comentario del cuerpo de la solicitud
        data = json.loads(request.body)
        comentario_texto = data.get('comentario')

        if not comentario_texto:
            return JsonResponse({
                'success': False,
                'error': 'El comentario no puede estar vacío'
            }, status=400)

        # Crear el comentario en la base de datos
        comentario = Comentario.objects.create(
            usuario=usuario,
            publicacion=publicacion,
            comentario=comentario_texto,
            fecha_comentario=timezone.now()
        )

        # Analizar el sentimiento del comentario
        analyzer = SentimentAnalyzer()
        resultado = analyzer.analyze_text_with_chatgpt(comentario_texto)

        if resultado:
            comentario.clasificacion_chatgpt = resultado['sentimiento']  # Guardar el sentimiento
            comentario.fecha_analisis = resultado['fecha_analisis']  # Guardar la fecha del análisis
            comentario.analizado_por_chatgpt = True
            comentario.save()

        # Responder con el comentario y su análisis
        return JsonResponse({
            'success': True,
            'comentario': {
                'id': comentario.id,
                'usuario': comentario.usuario.nombre,
                'texto': comentario.comentario,
                'fecha': comentario.fecha_comentario.strftime('%d/%m/%Y %H:%M'),
                'sentimiento': comentario.clasificacion_chatgpt
            }
        })
    except Usuario.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Usuario no encontrado'
        }, status=404)
    except Publicacion.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Publicación no encontrada'
        }, status=404)
    except Exception as e:
        print("Error al agregar comentario:", str(e))
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#publicar prendas

@require_http_methods(["POST"])
def publicar_prenda(request):
    try:
        # Verificar que los campos requeridos existan
        if not request.POST.get('titulo') or not request.FILES.get('imagen'):
            return JsonResponse({
                'success': False,
                'error': 'Faltan campos requeridos'
            }, status=400)

        # Verificar si el usuario está autenticado por sesión
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({
                'success': False, 
                'error': 'Usuario no autenticado'
            }, status=401)

        # Obtener el usuario
        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=404)

        # Obtener datos del formulario
        data = request.POST
        imagen = request.FILES.get('imagen')
        
        # Obtener arrays
        estilos = request.POST.getlist('estilo[]')
        colores = request.POST.getlist('colores[]')

        # Validar arrays requeridos
        if not estilos or not colores:
            return JsonResponse({
                'success': False,
                'error': 'Debes seleccionar al menos un estilo y un color'
            }, status=400)

        # Validar precios según tipo
        tipo = data.get('tipo')
        precio_venta = data.get('precio_venta')
        precio_alquiler = data.get('precio_alquiler')
        deposito = data.get('deposito')

        if tipo == 'venta':
            if not precio_venta:
                return JsonResponse({'success': False, 'error': 'El precio de venta es requerido'})
            precio_alquiler = None
            deposito = None
        elif tipo == 'alquiler':
            if not all([precio_alquiler, deposito]):
                return JsonResponse({'success': False, 'error': 'Precio de alquiler y depósito son requeridos'})
            precio_venta = None
        elif tipo == 'venta y alquiler':
            if not all([precio_venta, precio_alquiler, deposito]):
                return JsonResponse({'success': False, 'error': 'Todos los precios son requeridos'})

        # Crear la publicación usando el usuario de la sesión
        publicacion = Publicacion.objects.create(
            usuario=usuario,  # Usar el usuario obtenido de la sesión
            titulo=data.get('titulo'),
            descripcion=data.get('descripcion'),
            tipo=tipo,
            precio_venta=precio_venta,
            precio_alquiler=precio_alquiler,
            deposito=deposito,
            publico=data.get('publico'),
            talla=data.get('talla'),
            estilo=estilos,
            colores=colores,
            imagen=imagen
        )

        return JsonResponse({
            'success': True,
            'message': 'Publicación creada exitosamente',
            'publicacion_id': publicacion.id
        })

    except Exception as e:
        print("Error al publicar prenda:", str(e))
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#ver publicaciones
@login_required
def ver_publicacion(request, publicacion_id):
    try:
        # Obtener la publicación
        publicacion = Publicacion.objects.get(id=publicacion_id)
        
        # Verificar si el usuario ha dado like
        usuario_id = request.session.get('usuario_id')
        tiene_like = Like.objects.filter(usuario_id=usuario_id, publicacion=publicacion).exists()
        tiene_favorito = Favorito.objects.filter(usuario_id=usuario_id, publicacion=publicacion).exists()
        
        # Obtener comentarios
        comentarios = Comentario.objects.filter(publicacion=publicacion).order_by('-fecha_comentario')
        
        context = {
            'publicacion': publicacion,
            'tiene_like': tiene_like,
            'tiene_favorito': tiene_favorito,
            'comentarios': comentarios,
        }
        
        return render(request, 'posts/ver_publicacion.html', context)
    except Publicacion.DoesNotExist:
        return redirect('inicio')

@login_required
def recomendaciones_view(request):
    try:
        usuario = request.user.usuario
        engine = RecommendationEngine(usuario)
        
        # Obtener recomendaciones
        recomendaciones = engine.generar_recomendaciones()
        
        # Obtener análisis de preferencias
        preferencias = engine.analizar_preferencias_usuario()
        interacciones = engine.analizar_interacciones()
        sentimiento = engine.analizar_sentimiento_descripcion()
        
        context = {
            'recomendaciones': recomendaciones,
            'preferencias': preferencias,
            'interacciones': interacciones,
            'sentimiento': sentimiento,
            'usuario': usuario
        }
        
        return render(request, 'recomendaciones.html', context)
    except Exception as e:
        print(f"Error al generar recomendaciones: {str(e)}")
        return redirect('inicio')

@login_required
def toggle_dislike(request, publicacion_id):
    try:
        # Obtener el usuario actual y la publicación
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado'}, status=401)
            
        usuario = Usuario.objects.get(id=usuario_id)
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        
        # Verificar si ya existe un dislike
        dislike = Dislike.objects.filter(usuario=usuario, publicacion=publicacion).first()
        
        if dislike:
            # Si ya existe un dislike, lo eliminamos
            dislike.delete()
            is_disliked = False
        else:
            # Si no existe, primero eliminamos cualquier like existente
            Like.objects.filter(usuario=usuario, publicacion=publicacion).delete()
            # Luego creamos el nuevo dislike
            Dislike.objects.create(usuario=usuario, publicacion=publicacion)
            is_disliked = True
        
        # Obtener el nuevo conteo de dislikes
        dislikes_count = Dislike.objects.filter(publicacion=publicacion).count()
        
        return JsonResponse({
            'success': True,
            'is_disliked': is_disliked,
            'dislikes_count': dislikes_count
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

#ver dislikes
def ver_dislikes(request):
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('/usuarios/login/')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        # Obtener todas las publicaciones que el usuario ha dado dislike
        dislikes = Dislike.objects.filter(usuario=usuario).select_related('publicacion')
        
        context = {
            'dislikes': dislikes,
            'usuario': usuario,
            'nombre_usuario': usuario.nombre,
            'dislikes_count': dislikes.count()
        }
        return render(request, 'posts/dislikes.html', context)
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('/usuarios/login/')

@login_required
def obtener_recomendaciones(request):
    # Obtener las interacciones del usuario
    likes = Like.objects.filter(usuario_id=request.user.id)
    favoritos = Favorito.objects.filter(usuario_id=request.user.id)
    comentarios = Comentario.objects.filter(usuario_id=request.user.id)
    
    # Crear el analizador de sentimientos
    analyzer = SentimentAnalyzer(request.user.id)
    
    # Analizar las interacciones del usuario
    analyzer.analizar_likes(likes)
    analyzer.analizar_favoritos(favoritos)
    analyzer.analizar_comentarios(comentarios)
    
    # Obtener todas las publicaciones excepto las del usuario
    publicaciones = Publicacion.objects.exclude(usuario_id=request.user.id)
    
    # Generar recomendaciones
    recomendaciones_con_score = analyzer.generar_recomendaciones(publicaciones, limit=10)
    
    # Preparar los datos para la plantilla
    recomendaciones_data = []
    for pub, score in recomendaciones_con_score:
        recomendaciones_data.append({
            'publicacion': pub,
            'score': round(score, 2),
            'razones': analyzer.obtener_razones_recomendacion(pub)
        })
    
    return render(request, 'posts/recomendaciones.html', {
        'recomendaciones': recomendaciones_data,
        'preferencias': analyzer.preferencias
    })

@require_http_methods(["POST"])
def procesar_operacion(request):
    try:
        # Verificar autenticación
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado'}, status=401)

        # Obtener y validar datos
        data = json.loads(request.body)
        publicacion = get_object_or_404(Publicacion, id=data['publicacion_id'])
        
        if data['tipo'] == 'compra':
            # Crear registro en la tabla "ventas"
            venta = Venta.objects.create(
                publicacion=publicacion,
                vendedor=publicacion.usuario,
                comprador=request.user.usuario,
                precio_final=publicacion.precio,
                estado='pendiente',
                metodo_pago=data['metodo_pago'],
                direccion_envio=data['direccion'],
                notas=data.get('notas', '')
            )

            # Crear registro en la tabla "compras"
            compra = Compra.objects.create(
                comprador=request.user.usuario,
                publicacion=publicacion,
                vendedor=publicacion.usuario,
                precio_final=publicacion.precio,
                metodo_pago=data['metodo_pago'],
                direccion_envio=data['direccion'],
                notas=data.get('notas', '')
            )

            return JsonResponse({
                'success': True,
                'message': 'Compra registrada exitosamente',
                'venta_id': venta.id,
                'compra_id': compra.id
            })

        # Si el tipo no es "compra", manejar otros casos (como alquiler)
        return JsonResponse({'success': False, 'error': 'Operación no válida'}, status=400)

    except Publicacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Publicación no encontrada'})
    except ValueError as e:
        return JsonResponse({'success': False, 'error': str(e)})
    except Exception as e:
        print("Error procesando operación:", str(e))
        return JsonResponse({'success': False, 'error': 'Error interno del servidor'})

@require_http_methods(["GET"])
def get_publicacion(request, publicacion_id):
    """
    Vista para obtener los datos de una publicación específica
    """
    try:
        # Obtener la publicación
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)
        
        # Construir la respuesta
        data = {
            'success': True,
            'id': publicacion.id,
            'titulo': publicacion.titulo,
            'descripcion': publicacion.descripcion,
            'precio': str(publicacion.precio),
            'deposito': str(publicacion.deposito) if publicacion.deposito else '0',
            'imagen': publicacion.imagen.url if publicacion.imagen else '',
            'tipo': publicacion.tipo,
            'talla': publicacion.talla,
            'publico': publicacion.publico,
            'estilo': publicacion.estilo if isinstance(publicacion.estilo, list) else [],
            'colores': publicacion.colores if isinstance(publicacion.colores, list) else []
        }
        
        print("Datos de publicación enviados:", data)  # Debug log
        return JsonResponse(data)
        
    except Publicacion.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Publicación no encontrada'
        }, status=404)
    except Exception as e:
        print("Error al obtener publicación:", str(e))  # Debug log
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@login_required
@require_http_methods(["POST"])
def procesar_compra(request):
    try:
        # Obtener datos del formulario
        publicacion_id = request.POST.get('publicacion_id')
        direccion = request.POST.get('direccion')
        metodo_pago = request.POST.get('metodo_pago')
        notas = request.POST.get('notas')

        # Validar datos
        if not publicacion_id or not direccion or not metodo_pago:
            return JsonResponse({'success': False, 'error': 'Faltan datos obligatorios'}, status=400)

        # Obtener la publicación
        publicacion = get_object_or_404(Publicacion, id=publicacion_id)

        # Validar que la publicación esté disponible para la compra
        if publicacion.tipo not in ['venta', 'venta y alquiler']:
            return JsonResponse({'success': False, 'error': 'La publicación no está disponible para la compra'}, status=400)

        # Obtener el vendedor
        vendedor = publicacion.usuario

        # Crear el registro en la tabla "ventas"
        venta = Venta.objects.create(
            publicacion=publicacion,
            vendedor=vendedor,
            comprador=request.user.usuario,  # Usuario autenticado como comprador
            precio_final=publicacion.precio,
            estado='pendiente',  # Estado inicial de la venta
            metodo_pago=metodo_pago,
            direccion_envio=direccion,
            notas=notas
        )

        # Crear el registro en la tabla "compras"
        compra = Compra.objects.create(
            comprador=request.user.usuario,  # Usuario autenticado como comprador
            publicacion=publicacion,
            vendedor=vendedor,
            precio_final=publicacion.precio,
            metodo_pago=metodo_pago,
            direccion_envio=direccion,
            notas=notas
        )

        return JsonResponse({
            'success': True,
            'message': 'Compra procesada exitosamente',
            'venta_id': venta.id,
            'compra_id': compra.id
        })

    except Publicacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'La publicación no existe'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def procesar_alquiler(request):
    try:
        # Obtener datos del formulario
        publicacion_id = request.POST.get('publicacion_id')
        fecha_inicio = request.POST.get('fecha_inicio')
        fecha_fin = request.POST.get('fecha_fin')
        direccion = request.POST.get('direccion')
        metodo_pago = request.POST.get('metodo_pago')
        
        if not all([publicacion_id, fecha_inicio, fecha_fin, direccion, metodo_pago]):
            return JsonResponse({
                'success': False,
                'message': 'Faltan datos requeridos'
            }, status=400)
        
        # Convertir fechas
        fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        # Validar fechas
        if fecha_inicio >= fecha_fin:
            return JsonResponse({
                'success': False,
                'message': 'La fecha de fin debe ser posterior a la fecha de inicio'
            }, status=400)
        
        # Obtener la publicación y el usuario
        publicacion = Publicacion.objects.get(id=publicacion_id)
        usuario = request.user.usuario
        
        # Verificar que el usuario no sea el propietario
        if publicacion.usuario == usuario:
            return JsonResponse({
                'success': False,
                'message': 'No puedes alquilar tus propias publicaciones'
            }, status=400)
        
        # Calcular precio total
        dias = (fecha_fin - fecha_inicio).days
        precio_total = publicacion.precio * dias
        
        # Crear el alquiler
        alquiler = Alquiler.objects.create(
            publicacion=publicacion,
            arrendador=publicacion.usuario,
            arrendatario=usuario,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            precio_total=precio_total,
            deposito=publicacion.deposito,
            estado='pendiente'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Alquiler procesado exitosamente',
            'alquiler_id': alquiler.id
        })
        
    except Publicacion.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Publicación no encontrada'
        }, status=404)
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': 'Formato de fecha inválido'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def obtener_metricas_publicacion(request, publicacion_id):
    try:
        # Obtener la publicación
        publicacion = Publicacion.objects.get(id=publicacion_id)
        comentarios = Comentario.objects.filter(publicacion=publicacion)

        # Calcular métricas
        comentarios_positivos = comentarios.filter(clasificacion_chatgpt='positivo').count()
        comentarios_neutros = comentarios.filter(clasificacion_chatgpt='neutro').count()
        comentarios_negativos = comentarios.filter(clasificacion_chatgpt='negativo').count()
        total_comentarios = comentarios.count()

        # Responder con las métricas
        return JsonResponse({
            'success': True,
            'comentarios_positivos': comentarios_positivos,
            'comentarios_neutros': comentarios_neutros,
            'comentarios_negativos': comentarios_negativos,
            'total_comentarios': total_comentarios
        })
    except Publicacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Publicación no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)