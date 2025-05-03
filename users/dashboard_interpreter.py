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
        Crea prompts específicos basados en los datos del resumen
        """
        base_prompt = "Como experto en análisis de datos de moda, interpreta el siguiente resumen de datos: "
        
        prompts = {
            'EstiloColor': (
                f"{base_prompt}En las recomendaciones por color: {data}. "
                "¿Qué tendencias observas en las preferencias de color? "
                "¿Qué sugerencias darías basadas en estos datos?"
            ),
            'LikesFavoritos': (
                f"{base_prompt}En la distribución de likes y favoritos: {data}. "
                "¿Qué nos dice esto sobre las preferencias de los usuarios? "
                "¿Qué colores y estilos son más populares?"
            ),
            'Sentimientos': (
                f"{base_prompt}En los comentarios tenemos: {data}. "
                "¿Cuál es el sentimiento general? "
                "¿Qué acciones recomendarías basado en estos datos?"
            ),
            'ComprasVentasAlquileres': (
                f"{base_prompt}En las transacciones: {data}. "
                "¿Qué tipo de transacción es más común? "
                "¿Qué sugiere esto sobre el comportamiento de los usuarios?"
            ),
            'IngresosGastos': (
                f"{base_prompt}En el balance financiero: {data}. "
                "¿Cómo se ve el balance entre ingresos y gastos? "
                "¿Qué recomendaciones financieras darías?"
            ),
            'ActividadTiempo': (
                f"{base_prompt}En la actividad temporal: {data}. "
                "¿Qué patrones temporales observas? "
                "¿Cuáles son los períodos de mayor actividad?"
            ),
            'TransaccionesEstado': (
                f"{base_prompt}En los estados de las transacciones: {data}. "
                "¿Qué nos dice esto sobre la eficiencia del proceso? "
                "¿Qué aspectos podrían mejorarse?"
            ),
            'EstilosColores': (
                f"{base_prompt}En las preferencias de estilos y colores: {data}. "
                "¿Cuáles son las combinaciones más populares? "
                "¿Qué tendencias de moda se pueden identificar?"
            )
        }
        
        return prompts.get(chart_type, f"{base_prompt}Analiza estos datos: {data}")