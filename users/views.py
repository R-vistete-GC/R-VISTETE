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
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('users:login')
    
    try:
        # Buscar el usuario y su perfil
        usuario = Usuario.objects.get(id=usuario_id)
        perfil, created = PerfilUsuario.objects.get_or_create(usuario=usuario)
        
        # Obtener las publicaciones del usuario
        publicaciones = Publicacion.objects.filter(usuario=usuario).order_by('-fecha_publicacion')
        
        context = {
            'usuario': usuario,
            'perfil': perfil,
            'publicaciones': publicaciones,  # Para la lista de publicaciones
            'publicaciones_count': publicaciones.count(),  # Para el contador en estadísticas
            'ventas': Venta.objects.filter(vendedor=usuario).count(),
            'alquileres': Alquiler.objects.filter(cliente=usuario).count()
        }
        return render(request, 'users/perfil.html', context)
    except Usuario.DoesNotExist:
        request.session.flush()
        return redirect('users:login')

def editar_perfil(request):
    # Verificar si el usuario está autenticado
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('users:login')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        perfil, created = PerfilUsuario.objects.get_or_create(usuario=usuario)
        
        if request.method == 'POST':
            form = PerfilUsuarioForm(request.POST, instance=perfil)
            if form.is_valid():
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

def logout_view(request):
    # Limpiar la sesión
    request.session.flush()
    return redirect('users:login')

def dashboard(request):
    # Verificar si el usuario está autenticado mediante la sesión
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        return redirect('/users/login/')

    try:
        # Obtener publicaciones del usuario
        publicaciones = Publicacion.objects.filter(usuario_id=usuario_id)
        total_likes = sum([pub.likes.count() for pub in publicaciones])
        total_favoritos = Favorito.objects.filter(usuario_id=usuario_id).count()

        # Obtener recomendaciones y análisis de sentimientos
        recomendaciones = recomendaciones_view(request)
        analyzer = SentimentAnalyzer(usuario_id)
        sentimientos = analyzer.obtener_metricas_generales()

        # Preparar datos para el Dashboard
        context = {
            'total_likes': total_likes,
            'total_favoritos': total_favoritos,
            'recomendaciones': recomendaciones,
            'sentimientos': {
                'positivos': sentimientos['positivos'],
                'neutros': sentimientos['neutros'],
                'negativos': sentimientos['negativos'],
            },
        }
        return render(request, 'users/dashboard.html', context)

    except Exception as e:
        print(f"Error en el Dashboard: {str(e)}")
        return render(request, 'users/dashboard.html', {
            'error': 'Ocurrió un error al cargar el Dashboard.'
        })
