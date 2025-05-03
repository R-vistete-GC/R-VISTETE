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
        Crea prompts específicos basados en los datos del resumen
        """
        base_prompt = "Como experto en análisis de datos de moda, interpreta el siguiente resumen de datos: "
        
        if chart_type == 'EstiloColor':
            prompt = f"{base_prompt}En las recomendaciones por color: "
            for color, total in data.items():
                prompt += f"{color}: {total} recomendaciones, "
            prompt += "\n¿Qué nos dice esto sobre las preferencias de color de los usuarios y qué recomendaciones podrías dar?"

        elif chart_type == 'Sentimientos':
            prompt = (f"{base_prompt}En los comentarios tenemos: "
                     f"{data['positivos']} positivos, {data['neutros']} neutros y {data['negativos']} negativos. "
                     f"\n¿Qué nos indica esto sobre la satisfacción general de los usuarios y qué acciones se podrían tomar?")

        return prompt