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
                messages=[{
                    "role": "system",
                    "content": "Eres un analista experto en moda y comercio electrónico."
                },
                {
                    "role": "user",
                    "content": prompt
                }],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message['content']
        except Exception as e:
            return f"No se pudo generar la interpretación: {str(e)}"

    def _create_prompt(self, chart_type, data):
        """
        Crea prompts específicos según el tipo de gráfica para generar análisis más relevantes
        """
        base_prompt = "Actúa como un experto analista de moda y comercio electrónico. "
        
        prompts = {
            'actividadTiempo': (
                f"{base_prompt}Analiza la siguiente actividad temporal: {data}. "
                "Proporciona un análisis conciso que destaque: "
                "1. Los períodos de mayor actividad "
                "2. Tendencias en el comportamiento del usuario "
                "3. Sugerencias para optimizar la actividad"
            ),
            'estiloColor': (
                f"{base_prompt}Interpreta estas estadísticas de colores y estilos: {data}. "
                "Proporciona un análisis conciso que destaque: "
                "1. Los colores y estilos más populares "
                "2. Combinaciones preferidas "
                "3. Recomendaciones basadas en estas preferencias"
            ),
            'sentimientos': (
                f"{base_prompt}Analiza estos datos de sentimientos en comentarios: {data}. "
                "Proporciona un análisis conciso que destaque: "
                "1. La tendencia general de satisfacción "
                "2. Áreas de mejora potencial "
                "3. Recomendaciones basadas en los comentarios"
            )
        }
        
        return prompts.get(chart_type, f"{base_prompt}Analiza estos datos: {data}")