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
        Crea prompts específicos para describir el comportamiento del usuario
        """
        base_prompt = "Como analista, describe de manera simple y directa "
        
        prompts = {
            'EstiloColor': (
                f"{base_prompt}el patrón de colores en las recomendaciones del usuario: {data}. "
                "Enfócate en explicar qué colores han sido más relevantes en su experiencia."
            ),
            'LikesFavoritos': (
                f"{base_prompt}cómo ha interactuado el usuario con likes y favoritos: {data}. "
                "Explica las tendencias en sus preferencias."
            ),
            'Sentimientos': (
                f"{base_prompt}cómo ha sido el balance de sentimientos en los comentarios: {data}. "
                "Explica el panorama general de su experiencia."
            ),
            'ComprasVentasAlquileres': (
                f"{base_prompt}el balance entre las diferentes transacciones realizadas: {data}. "
                "Describe cómo ha sido su participación en la plataforma."
            ),
            'IngresosGastos': (
                f"{base_prompt}el panorama de sus movimientos financieros: {data}. "
                "Explica cómo se han distribuido sus transacciones."
            ),
            'ActividadTiempo': (
                f"{base_prompt}sus patrones de actividad temporal: {data}. "
                "Identifica los momentos de mayor actividad."
            ),
            'TransaccionesEstado': (
                f"{base_prompt}cómo se han desarrollado sus transacciones: {data}. "
                "Explica la distribución de los diferentes estados."
            ),
            'EstilosColores': (
                f"{base_prompt}sus preferencias en estilos y colores: {data}. "
                "Describe las combinaciones que han sido más significativas."
            )
        }
        
        prompt = prompts.get(chart_type, f"{base_prompt}estos datos: {data}")
        prompt += "\nPor favor, genera una descripción breve y clara, comenzando con 'Basándome en tu actividad...' "
        prompt += "y limítala a 2-3 oraciones que expliquen los patrones observados, sin incluir recomendaciones."
        
        return prompt