from django import forms
from .models import PerfilUsuario
import json
from django.contrib.postgres.fields import RangeField
from psycopg2.extras import NumericRange

class PerfilUsuarioForm(forms.ModelForm):
    TALLAS = [
        ('XS', 'XS'),
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('XXL', 'XXL')
    ]

    ESTILOS = [
        ('Casual', 'Casual'),
        ('Formal', 'Formal'),
        ('Deportivo', 'Deportivo'),
        ('Elegante', 'Elegante'),
        ('Bohemio', 'Bohemio'),
        ('Vintage', 'Vintage'),
        ('Minimalista', 'Minimalista'),
        ('Streetwear', 'Streetwear')
    ]

    COLORES = [
        ('Negro', 'Negro'),
        ('Blanco', 'Blanco'),
        ('Rojo', 'Rojo'),
        ('Azul', 'Azul'),
        ('Verde', 'Verde'),
        ('Amarillo', 'Amarillo'),
        ('Rosa', 'Rosa'),
        ('Morado', 'Morado'),
        ('Marrón', 'Marrón'),
        ('Gris', 'Gris')
    ]

    GENERO= [
        ('hombre', 'Hombre'),  # Valor en BD: 'hombre' (minúsculas)
        ('mujer', 'Mujer'),
        ]

    ESTADOS = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('vacaciones', 'De Vacaciones'),
        ('ocupado', 'Ocupado')
    ]

    talla = forms.ChoiceField(choices=TALLAS, required=False)
    estilos_preferidos = forms.MultipleChoiceField(
        choices=ESTILOS,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )
    colores_preferidos = forms.MultipleChoiceField(
        choices=COLORES,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )
    
    
    ocasiones_uso = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Ingresa las ocasiones separadas por comas (ej: trabajo, fiesta, casual)',
        required=False
    )
    genero = forms.ChoiceField(
            choices=PerfilUsuario.GENERO,
            widget=forms.Select(attrs={'class': 'form-control'})
        )    
    descripcion = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4}),
        required=False
    )
    telefono = forms.CharField(max_length=20, required=False)
    ubicacion = forms.CharField(max_length=100, required=False)
    redes_sociales = forms.JSONField(required=False)
    estado = forms.ChoiceField(
        choices=ESTADOS,
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=False
    )
    intereses = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tus intereses separados por comas (ej: moda, tendencias, vintage)'
        }),
        required=False
    )
    foto_perfil = forms.ImageField(required=False)

    class Meta:
        model = PerfilUsuario
        fields = [
            'descripcion', 'estado', 'telefono', 'ubicacion', 
            'talla', 'estilos_preferidos', 'colores_preferidos',
            'ocasiones_uso','genero','intereses', 'redes_sociales', 'foto_perfil'
        ]
        widgets = {
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'ubicacion': forms.TextInput(attrs={'class': 'form-control'}),
            'talla': forms.Select(attrs={'class': 'form-select'}),
            'ocasiones_uso': forms.TextInput(attrs={'class': 'form-control'}),
            'genero': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Configurar los campos de tipo array como MultipleChoiceField
        self.fields['estilos_preferidos'] = forms.MultipleChoiceField(
            choices=self.ESTILOS,
            required=False,
            widget=forms.CheckboxSelectMultiple(attrs={'class': 'checkbox-group'})
        )
        
        self.fields['colores_preferidos'] = forms.MultipleChoiceField(
            choices=self.COLORES,
            required=False,
            widget=forms.CheckboxSelectMultiple(attrs={'class': 'checkbox-group'})
        )


    def clean_ocasiones_uso(self):
        ocasiones = self.cleaned_data.get('ocasiones_uso', '')
        # Devolver el texto tal cual lo ingresa el usuario
        return ocasiones.strip()

    def clean_redes_sociales(self):
        redes = self.cleaned_data.get('redes_sociales', {})
        if not isinstance(redes, dict):
            redes = {}
        return redes

    def clean_intereses(self):
        intereses = self.cleaned_data.get('intereses', '')
        return intereses.strip()

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Asegurarse de que los campos se guarden como texto
        instance.estilos_preferidos = ', '.join(self.cleaned_data.get('estilos_preferidos', []))
        instance.colores_preferidos = ', '.join(self.cleaned_data.get('colores_preferidos', []))
        
        if commit:
            instance.save()
        return instance