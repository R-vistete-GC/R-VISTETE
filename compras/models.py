from django.db import models
from posts.models import Publicacion
from users.models import Usuario

class Compra(models.Model):
    id = models.AutoField(primary_key=True)
    comprador = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='compras')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='compras')
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ventas')
    fecha_compra = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=[
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ], default='pendiente')
    precio_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, null=True, blank=True)
    direccion_envio = models.TextField(null=True, blank=True)
    tracking_envio = models.CharField(max_length=100, null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'compras'  # Apuntar al esquema existente
        managed = False  # Evitar que Django intente crear o modificar la tabla

    def __str__(self):
        return f"Compra {self.id} - {self.estado}"