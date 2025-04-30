from django.urls import path
from . import views

app_name = 'recommendations'

urlpatterns = [
    path('', views.recomendaciones_view, name='list'),
    path('api/', views.recomendaciones_api, name='api'),  # Nueva ruta para el API
]