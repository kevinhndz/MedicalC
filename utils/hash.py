from passlib.context import CryptContext

contexto = CryptContext(schemes=["argon2"], deprecated="auto")

def hashear_contrasena(contrasena: str) -> str:
    
    hash_contrasena = contexto.hash(contrasena)
    
    return hash_contrasena


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    
    resultado = contexto.verify(contrasena, hash_guardado)
    
    return resultado