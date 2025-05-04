import openai
from django.conf import settings

class DashboardInterpreter:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        openai.api_key = self.openai_key

    def interpret_chart_data(self, chart_type, data):
        """
        Interpreta los datos de una gráfica específica usando ChatGPT
        """
        try:
            prompt = self._create_prompt(chart_type, data)
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Eres un analista experto en moda y comercio electrónico."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,  # Aumentamos el límite de tokens para respuestas más completas
                temperature=0.7
            )
            return response.choices[0].message['content']
        except Exception as e:
            return f"No se pudo generar la interpretación: {str(e)}"

    def _create_prompt(self, chart_type, data):
        """
        Crea prompts específicos y personalizados para el usuario solicitando respuestas concisas
        """
        base_prompt = "Como experto en moda, genera un análisis breve y conciso (máximo 2-3 oraciones) sobre: "
        
        prompts = {
            'EstiloColor': (
                f"{base_prompt}las siguientes preferencias de color: {data}. "
                "Enfócate en las tendencias principales y una recomendación específica."
            ),
            'LikesFavoritos': (
                f"{base_prompt}estos patrones de likes y favoritos: {data}. "
                "Menciona las preferencias más destacadas y una sugerencia."
            ),
            'Sentimientos': (
                f"{base_prompt}la distribución de comentarios: {data}. "
                "Indica el sentimiento predominante y una recomendación clave."
            ),
            'ComprasVentasAlquileres': (
                f"{base_prompt}estas estadísticas de transacciones: {data}. "
                "Identifica el patrón principal y una sugerencia de mejora."
            ),
            'IngresosGastos': (
                f"{base_prompt}este balance financiero: {data}. "
                "Destaca el aspecto más relevante y un consejo financiero."
            ),
            'ActividadTiempo': (
                f"{base_prompt}esta actividad temporal: {data}. "
                "Señala el período más activo y una recomendación."
            ),
            'TransaccionesEstado': (
                f"{base_prompt}el estado de las transacciones: {data}. "
                "Resalta el estado predominante y una sugerencia de optimización."
            ),
            'EstilosColores': (
                f"{base_prompt}estas preferencias de estilos y colores: {data}. "
                "Menciona la combinación más popular y una recomendación de estilo."
            )
        }
        
        prompt = prompts.get(chart_type, f"{base_prompt}estos datos: {data}")
        prompt += "\nPor favor, mantén tu respuesta breve y directa, comenzando con 'Basándome en tu actividad...' "
        prompt += "y limitándola a 2-3 oraciones que incluyan una observación principal y una recomendación concreta."
        
        return prompt