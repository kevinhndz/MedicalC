import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import requests
from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Clientes, Doctores, Citas, Consultas, Medicamentos
from routers.utils.autenticacion import el_vigilante

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

class MensajeChat(BaseModel):
    pregunta: str

def llamar_groq(mensaje: str, system_prompt: str) -> str:
    """
    Llama a la API de GROQ con manejo robusto de errores y modelos alternativos.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    #
    modelos = [
        "mixtral-8x7b-32768",      # Gratuito y robusto
        "gemma-7b-it",              # Alternativa gratuita
        "llama2-70b-4096",          # Otro modelo disponible
    ]
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    for modelo in modelos:
        try:
            payload = {
                "model": modelo,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": mensaje}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            elif response.status_code == 401:
                print(f" Clave API invalida o expirada")
                raise Exception("Credenciales de API no válidas")
            elif response.status_code == 404:
                print(f"Modelo {modelo} no disponible, intentando siguiente...")
                continue
            else:
                print(f"Error {response.status_code} con modelo {modelo}")
                continue
                
        except requests.exceptions.Timeout:
            print(f"⚠️  Timeout con modelo {modelo}")
            continue
        except requests.exceptions.ConnectionError:
            print(f"⚠️  Error de conexion con modelo {modelo}")
            continue
        except Exception as e:
            print(f"⚠️  Error con modelo {modelo}: {str(e)}")
            continue
    
    return None

@router.post("/")
async def chatbot(
    json: MensajeChat,
    base_datos: Session = Depends(abrir_puerta_a_bd),
    usuario: dict = Depends(el_vigilante)
):
    pregunta = json.pregunta.strip().lower()
    
    if not pregunta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La pregunta no puede estar vacía"
        )
    
    try:
        # Obtener datos de la base de datos
        total_pacientes = base_datos.query(Clientes).count()
        total_doctores = base_datos.query(Doctores).count()
        total_citas = base_datos.query(Citas).count()
        todos_medicamentos = base_datos.query(Medicamentos).all()
        todos_doctores = base_datos.query(Doctores).all()
        
        # Formatear informacion para el prompt
        meds_info = ", ".join([f"{m.nombre} (Stock: {m.stock})" for m in todos_medicamentos[:8]]) if todos_medicamentos else "Sin medicamentos"
        docs_info = ", ".join([f"Dr. {d.nombre} ({d.especialidad})" for d in todos_doctores[:8]]) if todos_doctores else "Sin doctores"
        
        system_prompt = f"""Eres un asistente medico profesional de la Clinica UPH. 
Responde siempre en español, de forma concisa y amable.

DATOS DEL SISTEMA:
- Total de pacientes: {total_pacientes}
- Total de doctores: {total_doctores}
- Total de citas: {total_citas}
- Medicamentos disponibles: {meds_info}
- Doctores: {docs_info}

Usa esta informacion para responder preguntas sobre la clinica.
Si no sabes algo, se honesto y sugiere contactar directamente a la clínica."""

        # Intentar llamar a GROQ
        texto_respuesta = llamar_groq(json.pregunta, system_prompt)
        
        # Si GROQ falla completamente, usar respaldo local
        if not texto_respuesta:
            print("  Todas las APIs de GROQ fallaron, usando respaldo local...")
            
            if any(word in pregunta for word in ["medicamento", "stock", "pastilla", "medicina"]):
                if todos_medicamentos:
                    meds = ", ".join([f"{m.nombre} ({m.stock} disponibles)" for m in todos_medicamentos[:5]])
                    texto_respuesta = f" Medicamentos en inventario: {meds}"
                else:
                    texto_respuesta = "No hay medicamentos registrados en el sistema."
            
            elif any(word in pregunta for word in ["doctor", "medico", "especialidad"]):
                if todos_doctores:
                    docs = ", ".join([f"Dr. {d.nombre} - {d.especialidad}" for d in todos_doctores[:5]])
                    texto_respuesta = f" Doctores disponibles: {docs}"
                else:
                    texto_respuesta = "No hay doctores registrados en el sistema."
            
            elif any(word in pregunta for word in ["cita", "citas", "agendar"]):
                texto_respuesta = f" Actualmente hay {total_citas} citas en el sistema. Puedes agendar una nueva desde la seccion 'Citas'."
            
            elif any(word in pregunta for word in ["paciente", "pacientes"]):
                texto_respuesta = f" Hay {total_pacientes} pacientes registrados en la clínica UPH."
        
            else:
                texto_respuesta = f"Bienvenido a la Clínica UPH. Tenemos {total_pacientes} pacientes, {total_doctores} doctores y {total_citas} citas registradas. ¿En qué puedo ayudarte?"

        return {
            "respuesta": texto_respuesta,
            "usuario": usuario["user"],
            "rol": usuario["rol"]
        }
    
    except Exception as e:
        print(f"❌ Error crítico en chatbot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar tu pregunta. Por favor, intenta de nuevo."
        )