from fastapi import FastAPI, HTTPException, Header, status, Depends


app = FastAPI()

@app.get("/")
def probando():
    return {"Test": "Prueba con Unicorn"}
