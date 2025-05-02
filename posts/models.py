from django.contrib.postgres.fields import ArrayField  # Importar ArrayField
from django.db import models
from users.models import Usuario
from django.db.models import Avg
from django.utils import timezone


class Publicacion(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(null=True)
    imagen = models.ImageField(upload_to='publicaciones/', null=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    precio_alquiler = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(
        max_length=20, 
        choices=[
            ('venta', 'Venta'),
            ('alquiler', 'Alquiler'),
            ('venta y alquiler', 'Venta y Alquiler')
        ],
        default='venta'
    )
    deposito = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    publico = models.CharField(max_length=10, choices=[
        ('mujer', 'Mujer'), ('hombre', 'Hombre'), ('niño', 'Niño'),
        ('niña', 'Niña'), ('mascota', 'Mascota')
    ], default='mujer')
    talla = models.CharField(max_length=10, default='M')
    estilo = ArrayField(models.CharField(max_length=50), default=list)
    colores = ArrayField(models.CharField(max_length=50), default=list)

    class Meta:
        db_table = 'publicaciones'
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return f"{self.titulo} - {self.usuario.nombre}"


class Comentario(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    publicacion = models.ForeignKey('Publicacion', on_delete=models.CASCADE, db_column='publicacion_id')
    comentario = models.TextField()  # Texto del comentario
    fecha_comentario = models.DateTimeField(auto_now_add=True)  # Fecha en que se hizo el comentario
    polaridad = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)  # Polaridad (análisis previo)
    subjetividad = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)  # Subjetividad (análisis previo)
    clasificacion_chatgpt = models.CharField(max_length=10, null=True, blank=True)  # Positivo, neutro o negativo
    clasificacion_textblob = models.CharField(max_length=10, null=True, blank=True)  # Positivo, neutro o negativo
    analizado_por_chatgpt = models.BooleanField(default=False)  # Indica si ya fue analizado por ChatGPT
    fecha_analisis = models.DateTimeField(null=True, blank=True)  # Fecha del análisis

    class Meta:
        db_table = 'comentarios'  # Vincula el modelo a la tabla existente
        ordering = ['-fecha_comentario']  # Ordena por fecha de comentario (más reciente primero)

    def __str__(self):
        return f"Comentario de {self.usuario.nombre} en {self.publicacion.titulo}"


class MetricasSentimiento(models.Model):
    publicacion = models.OneToOneField(
        Publicacion,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column='publicacion_id'
    )
    sentimiento_promedio = models.DecimalField(max_digits=4, decimal_places=3, null=True)
    subjetividad_promedio = models.DecimalField(max_digits=4, decimal_places=3, null=True)
    total_comentarios = models.IntegerField(default=0)
    comentarios_positivos = models.IntegerField(default=0)
    comentarios_negativos = models.IntegerField(default=0)
    comentarios_neutros = models.IntegerField(default=0)
    ultima_actualizacion = models.DateTimeField(null=True)

    class Meta:
        db_table = 'metricas_sentimiento'

    def __str__(self):
        return f"Métricas de sentimiento para {self.publicacion.titulo}"

    def actualizar_metricas(self):
        """Actualiza las métricas de sentimiento basadas en los comentarios"""
        comentarios = Comentario.objects.filter(
            publicacion=self.publicacion,
            polaridad__isnull=False
        )

        self.total_comentarios = comentarios.count()
        if self.total_comentarios > 0:
            self.sentimiento_promedio = comentarios.aggregate(
                Avg('polaridad')
            )['polaridad__avg']
            self.subjetividad_promedio = comentarios.aggregate(
                Avg('subjetividad')
            )['subjetividad__avg']

            self.comentarios_positivos = comentarios.filter(polaridad__gt=0).count()
            self.comentarios_negativos = comentarios.filter(polaridad__lt=0).count()
            self.comentarios_neutros = comentarios.filter(polaridad=0).count()

        self.ultima_actualizacion = timezone.now()
        self.save()


class Compra(models.Model):
    id = models.AutoField(primary_key=True)
    comprador = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='compras_realizadas')
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='compras_vendidas')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE)
    fecha_compra = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('pagado', 'Pagado'),
            ('enviado', 'Enviado'),
            ('entregado', 'Entregado'),
            ('cancelado', 'Cancelado')
        ],
        default='pendiente'
    )
    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50)
    direccion_envio = models.TextField()
    tracking_envio = models.CharField(max_length=100, null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'compras'
        ordering = ['-fecha_compra']

    def __str__(self):
        return f"Compra #{self.id} - {self.publicacion.titulo}"


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


class Venta(models.Model):
    id = models.AutoField(primary_key=True)
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    vendedor = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='vendedor_id', related_name='ventas_realizadas')
    comprador = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='comprador_id', related_name='ventas_compradas')
    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_venta = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('completada', 'Completada'),
            ('cancelada', 'Cancelada')
        ],
        default='pendiente'
    )
    metodo_pago = models.CharField(max_length=50)
    direccion_envio = models.TextField()
    notas = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ventas'
        ordering = ['-fecha_venta']
        constraints = [
            models.CheckConstraint(
                check=models.Q(estado__in=['pendiente', 'completada', 'cancelada']),
                name='venta_estado_valid'
            )
        ]

    def __str__(self):
        return f"Venta de {self.publicacion.titulo} a {self.comprador.nombre}"

    def save(self, *args, **kwargs):
        # Validamos que el precio final sea positivo
        if self.precio_final <= 0:
            raise ValueError("El precio final debe ser mayor a 0")
        super().save(*args, **kwargs)


class Alquiler(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='usuario_id')
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='publicacion_id')
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    propietario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='propietario_id', related_name='alquileres_propietario', null=True)
    cliente = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='cliente_id', related_name='alquileres_cliente', null=True)
    precio_por_dia = models.DecimalField(max_digits=10, decimal_places=2)
    deposito = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('reservado', 'Reservado'),
            ('activo', 'Activo'),
            ('completado', 'Completado'),
            ('cancelado', 'Cancelado')
        ],
        default='reservado'
    )
    metodo_pago = models.CharField(max_length=50, null=True)
    direccion_envio = models.TextField(null=True)
    notas = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    tracking_envio = models.CharField(max_length=100, null=True, blank=True)
    tracking_devolucion = models.CharField(max_length=100, null=True, blank=True)
    terminos_aceptados = models.BooleanField(default=False)
    instrucciones_devolucion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'alquileres'
        constraints = [
            models.CheckConstraint(check=models.Q(fecha_fin__gt=models.F('fecha_inicio')),
                                 name='fecha_valida'),
            models.CheckConstraint(
                check=models.Q(estado__in=['reservado', 'activo', 'completado', 'cancelado']),
                name='estado_valido'
            )
        ]

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


# Obtén todos los comentarios
comentarios = Comentario.objects.all()

# Revisa los campos de cada comentario
for comentario in comentarios:
    print(f"ID: {comentario.id}")
    print(f"Texto: {comentario.comentario}")
    print(f"Polaridad: {comentario.polaridad}")
    print(f"Subjetividad: {comentario.subjetividad}")
    print(f"Clasificación ChatGPT: {comentario.clasificacion_chatgpt}")
    print(f"Analizado por ChatGPT: {comentario.analizado_por_chatgpt}")
    print(f"Fecha de Análisis: {comentario.fecha_analisis}")
    print("-" * 50)
