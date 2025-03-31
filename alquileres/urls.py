from django.urls import path
from . import views

app_name = 'alquileres'

urlpatterns = [
    path('', views.mis_alquileres, name='mis_alquileres'),
] 