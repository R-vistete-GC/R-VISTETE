from decouple import config
import openai

# Cargar la clave API desde el archivo .env
openai.api_key = config("OPENAI_API_KEY")

# Realizar una solicitud de prueba con la nueva API
try:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # Modelo recomendado
        messages=[
            {"role": "system", "content": "Eres un asistente útil."},
            {"role": "user", "content": "Hola, ¿cómo estás?"}
        ],
        max_tokens=50,
        temperature=0.7
    )
    print("Respuesta de OpenAI:", response['choices'][0]['message']['content'].strip())
except openai.error.AuthenticationError:
    print("Error: La clave API no es válida o ha expirado.")
except Exception as e:
    print("Error al conectar con OpenAI:", e)