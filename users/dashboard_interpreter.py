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
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message['content']
        except Exception as e:
            return f"No se pudo generar la interpretación: {str(e)}"

    def _create_prompt(self, chart_type, data):
        """
        Crea prompts específicos y personalizados para el usuario
        """
        base_prompt = "Como experto en moda y analista de datos, analizando tu comportamiento en la aplicación, "
        
        prompts = {
            'EstiloColor': (
                f"{base_prompt}puedo observar que en tus recomendaciones: {data}. "
                "Basándome en estos datos, ¿qué tendencias personales observo en tus preferencias de color? "
                "¿Qué sugerencias específicas te puedo dar para mejorar tu experiencia?"
            ),
            'LikesFavoritos': (
                f"{base_prompt}he notado que en tus interacciones con likes y favoritos: {data}. "
                "¿Qué me dice esto sobre tus gustos personales? "
                "¿Qué tipos de prendas y colores pareces preferir?"
            ),
            'Sentimientos': (
                f"{base_prompt}analizando tus comentarios: {data}. "
                "¿Qué puedo decir sobre tu nivel de satisfacción general? "
                "¿Qué recomendaciones personalizadas te puedo ofrecer para mejorar tu experiencia?"
            ),
            'ComprasVentasAlquileres': (
                f"{base_prompt}observo que en tus transacciones: {data}. "
                "¿Qué patrones de consumo personales identifico? "
                "¿Qué sugerencias te puedo dar para optimizar tus futuras transacciones?"
            ),
            'IngresosGastos': (
                f"{base_prompt}analizando tu balance financiero: {data}. "
                "¿Qué observaciones puedo hacer sobre tu comportamiento financiero? "
                "¿Qué consejos personalizados te puedo ofrecer?"
            ),
            'ActividadTiempo': (
                f"{base_prompt}he notado que tu actividad temporal muestra: {data}. "
                "¿Qué patrones de uso personal identifico? "
                "¿Cómo podrías aprovechar mejor la plataforma según estos datos?"
            ),
            'TransaccionesEstado': (
                f"{base_prompt}revisando el estado de tus transacciones: {data}. "
                "¿Qué puedo decir sobre tu gestión de transacciones? "
                "¿Qué sugerencias específicas te puedo dar para mejorar?"
            ),
            'EstilosColores': (
                f"{base_prompt}analizando tus preferencias de estilos y colores: {data}. "
                "¿Qué tendencias personales de moda identifico? "
                "¿Qué recomendaciones de estilo te puedo sugerir basado en tus gustos?"
            )
        }
        
        # Instrucción adicional para hacer el análisis más personal
        prompt = prompts.get(chart_type, f"{base_prompt}analizando estos datos: {data}")
        prompt += "\nPor favor, genera una respuesta personalizada, dirigiéndote directamente al usuario, " \
                 "comenzando con frases como 'Basándome en tu actividad...' o 'He notado que tú...' y " \
                 "proporcionando conclusiones y recomendaciones específicas para mejorar su experiencia."
        
        return prompt