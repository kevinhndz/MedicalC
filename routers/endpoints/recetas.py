from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Query
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Recetas, Consultas, Medicamentos
from base_datos.seguridad import Revisar_JSON_Crear_Receta
from utils.autenticacion import permiso_doctor

router = APIRouter(
    prefix="/recetas",
    tags=["Recetas"],
    dependencies=[Depends(permiso_doctor)]
)

@router.get("/")
def listar_recetas(
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10, ge=1, le=100),
    salto: int = Query(0, ge=0)
):
    
    check = base_datos.query(Recetas).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay recetas registradas"
        )
    else:
        return check


@router.get("/consulta/{consulta_id}")
def listar_recetas_por_consulta(
    consulta_id: int,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    consulta = base_datos.query(Consultas).filter(Consultas.id == consulta_id).first()
    
    if consulta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La consulta con ID {consulta_id} no existe"
        )
    
    recetas = base_datos.query(Recetas).filter(Recetas.id_consulta == consulta_id).all()
    
    if not recetas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay recetas para esta consulta"
        )
    
    return recetas


@router.post("/")
def crear_receta(
    json: Revisar_JSON_Crear_Receta,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
   
    consulta = base_datos.query(Consultas).filter(Consultas.id == json.id_consulta).first()
    
    if consulta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La consulta con ID {json.id_consulta} no existe"
        )
    
   
    medicamento = base_datos.query(Medicamentos).filter(Medicamentos.id == json.id_medicamento).first()
    
    if medicamento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El medicamento con ID {json.id_medicamento} no existe"
        )
    
    
    if medicamento.stock < json.cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Disponibles: {medicamento.stock}, Solicitados: {json.cantidad}"
        )
    
    
    nueva_receta = Recetas(
        id_consulta=json.id_consulta,
        id_medicamento=json.id_medicamento,
        cantidad=json.cantidad,
        indicaciones=json.indicaciones
    )
    
    
    medicamento.stock -= json.cantidad
    
    base_datos.add(nueva_receta)
    base_datos.commit()
    base_datos.refresh(nueva_receta)
    
    return {
        "receta_id": nueva_receta.id,
        "medicamento_id": medicamento.id,
        "medicamento_nombre": medicamento.nombre,
        "cantidad": nueva_receta.cantidad,
        "indicaciones": nueva_receta.indicaciones,
        "stock_restante": medicamento.stock,
        "mensaje": "Receta creada exitosamente y stock descontado"
    }


@router.patch("/{receta_id}")
def actualizar_receta(
    receta_id: int,
    json: Revisar_JSON_Crear_Receta,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    
    receta = base_datos.query(Recetas).filter(Recetas.id == receta_id).first()
    
    if receta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La receta con ID {receta_id} no existe"
        )
    
    medicamento = base_datos.query(Medicamentos).filter(Medicamentos.id == receta.id_medicamento).first()
    

    diferencia = json.cantidad - receta.cantidad
    
    if diferencia > 0:
        #
        if medicamento.stock < diferencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente. Disponibles: {medicamento.stock}, Necesarios: {diferencia}"
            )
        medicamento.stock -= diferencia
    elif diferencia < 0:
     
        medicamento.stock += abs(diferencia)
    
    receta.cantidad = json.cantidad
    receta.indicaciones = json.indicaciones
    
    base_datos.commit()
    base_datos.refresh(receta)
    
    return {
        "receta_id": receta.id,
        "cantidad_actualizada": receta.cantidad,
        "stock_restante": medicamento.stock
    }


@router.delete("/{receta_id}")
def eliminar_receta(
    receta_id: int,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    
    receta = base_datos.query(Recetas).filter(Recetas.id == receta_id).first()
    
    if receta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La receta con ID {receta_id} no existe"
        )
    
    medicamento = base_datos.query(Medicamentos).filter(Medicamentos.id == receta.id_medicamento).first()
    
   
    medicamento.stock += receta.cantidad
    
    base_datos.delete(receta)
    base_datos.commit()
    
    return {
        "mensaje": "Receta eliminada exitosamente",
        "stock_devuelto": receta.cantidad,
        "stock_actual": medicamento.stock
    }