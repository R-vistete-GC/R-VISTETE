from django.urls import path
from . import views

app_name = 'compras'

urlpatterns = [
    path('mis-compras/', views.mis_compras, name='mis_compras'),
] 