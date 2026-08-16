import bcrypt

def hashear_contrasena(contrasena: str) -> str:
   
    # 1. Convertir texto a bytes (bcrypt trabaja con bytes)
    contrasena_bytes = contrasena.encode('utf-8')
    
    # 2. Generar un "salt" aleatorio con 12 rondas
    salt = bcrypt.gensalt(rounds=12)
    
    # 3. Hashear: combina contraseña + salt (una formula por asi decirlo para mezclar textos y palabras)
    hash_contrasena = bcrypt.hashpw(contrasena_bytes, salt)
    
    # 4. Convertir de bytes a texto (para guardar en BD)
    hash_string = hash_contrasena.decode('utf-8')
    
    return hash_string


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
   
    # 1. Convertir ambas a bytes
    contrasena_bytes = contrasena.encode('utf-8')
    hash_bytes = hash_guardado.encode('utf-8')
    
    # 2. Usar bcrypt.checkpw() para verificar
    #    Compara la contraseña contra el hash
    resultado = bcrypt.checkpw(contrasena_bytes, hash_bytes)
    
    # 3. Retornar True o False
    return resultado