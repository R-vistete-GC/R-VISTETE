from django.contrib.postgres.fields import ArrayField  # Importar ArrayField
from django.db import models
from users.models import Usuario

class Publicacion(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(null=True)
    imagen_url = models.TextField(null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, default='venta', choices=[('venta', 'Venta'), ('alquiler', 'Alquiler')])
    deposito = models.DecimalField(max_digits=10, decimal_places=2, null=True)

    # 🔹 Campos faltantes
    publico = models.CharField(max_length=10, choices=[
        ('mujer', 'Mujer'), ('hombre', 'Hombre'), ('niño', 'Niño'),
        ('niña', 'Niña'), ('mascota', 'Mascota')
    ], default='mujer')

    talla = models.CharField(max_length=10, default='M')

    estilo = ArrayField(models.CharField(max_length=50), default=list)
    colores = ArrayField(models.CharField(max_length=50), default=list)

    class Meta:
        db_table = 'publicaciones'  # 🔗 Conectar con la tabla en PostgreSQL
        ordering = ['-fecha_publicacion']  # Ordenar por fecha más reciente

    def __str__(self):
        return f"{self.titulo} - {self.usuario.nombre}"


class Compra(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    fecha_compra = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'compras'

    def __str__(self):
        return f"Compra de {self.publicacion.titulo} por {self.usuario.nombre}"

class Like(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE)
    fecha_like = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes'
        unique_together = ('usuario', 'publicacion')

    def __str__(self):
        return f"{self.usuario.nombre} liked {self.publicacion.titulo}"

class Dislike(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE)
    fecha_dislike = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dislikes'
        unique_together = ('usuario', 'publicacion')

    def __str__(self):
        return f"{self.usuario.nombre} disliked {self.publicacion.titulo}"

class Comentario(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    comentario = models.TextField()
    fecha_comentario = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comentarios'  # 🔗 Conectar con la tabla en PostgreSQL
        ordering = ['-fecha_comentario']

    def __str__(self):
        return f"Comentario de {self.usuario.nombre} en {self.publicacion.titulo}"

class Venta(models.Model):
    id = models.AutoField(primary_key=True)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='vendedor_id', related_name='ventas_realizadas')
    comprador = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='comprador_id', related_name='compras_realizadas')
    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_venta = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=[
        ('pendiente', 'Pendiente'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada')
    ], default='pendiente')
    metodo_pago = models.CharField(max_length=50)
    direccion_envio = models.TextField()
    notas = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ventas'
        ordering = ['-fecha_venta']

    def __str__(self):
        return f"Venta de {self.publicacion.titulo} a {self.comprador.nombre}"

class Alquiler(models.Model):
    id = models.AutoField(primary_key=True)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    propietario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='propietario_id', related_name='alquileres_realizados')
    cliente = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='cliente_id', related_name='prendas_alquiladas')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    precio_por_dia = models.DecimalField(max_digits=10, decimal_places=2)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    deposito = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=[
        ('reservado', 'Reservado'),
        ('activo', 'Activo'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado')
    ], default='reservado')
    metodo_pago = models.CharField(max_length=50)
    direccion_envio = models.TextField()
    tracking_envio = models.CharField(max_length=100, null=True, blank=True)
    tracking_devolucion = models.CharField(max_length=100, null=True, blank=True)
    terminos_aceptados = models.BooleanField(default=False)
    instrucciones_devolucion = models.TextField(null=True, blank=True)
    notas = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alquileres'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Alquiler de {self.publicacion.titulo} a {self.cliente.nombre}"

    def save(self, *args, **kwargs):
        # Validar fechas
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio")
        
        # Validar montos
        if self.precio_por_dia <= 0:
            raise ValueError("El precio por día debe ser mayor a 0")
        if self.deposito < 0:
            raise ValueError("El depósito no puede ser negativo")
        if self.precio_total <= 0:
            raise ValueError("El precio total debe ser mayor a 0")
            
        super().save(*args, **kwargs)

    def calcular_precio_total(self):
        """Calcula el precio total del alquiler basado en los días"""
        if self.fecha_inicio and self.fecha_fin and self.precio_por_dia:
            dias = (self.fecha_fin - self.fecha_inicio).days
            return self.precio_por_dia * dias
        return 0

class Favorito(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    fecha_favorito = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favoritos'
        unique_together = ('usuario', 'publicacion')
        ordering = ['-fecha_favorito']

    def __str__(self):
        return f"Favorito de {self.usuario.nombre} - {self.publicacion.titulo}"
