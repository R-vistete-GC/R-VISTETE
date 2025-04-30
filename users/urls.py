from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Autenticación
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Perfil de usuario
    path('perfil/', views.ver_perfil, name='ver_perfil'),
    path('perfil/editar/', views.editar_perfil, name='editar_perfil'),
    path('perfiles/<int:usuario_id>/', views.ver_perfil_usuario, name='ver_perfil_usuario'),

    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard/data/', views.dashboard_data, name='dashboard_data'),
    path('dashboard/sentimientos/', views.dashboard_data_sentimientos, name='dashboard_data_sentimientos'),
    path('dashboard/recomendaciones-estilo-color/', views.recomendaciones_estilo_color, name='recomendaciones_estilo_color'),
    path('dashboard/likes-favoritos-estilo-color/', views.likes_favoritos_estilo_color, name='likes_favoritos_estilo_color'),
    path('dashboard/comentarios-sentimientos-usuario/', views.comentarios_sentimientos_usuario, name='comentarios_sentimientos_usuario'),
]

# Example usage of the endpoint
