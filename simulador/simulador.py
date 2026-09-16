simulador.py 

# simulador.py
# Simulador de flota: genera el flujo de posiciones GPS de los 310 buses
# con las imperfecciones descritas en la seccion 2.4 del caso de estudio:
# rebote de señal en el centro, silencios por tunel, desorden de mensajes
# y desfase de reloj entre el bus y el servidor.

import asyncio
import json
import random
import time

from fastapi import FastAPI, WebSocket

app = FastAPI()

NUM_BUSES = 310
NUM_RUTAS = 22

# Estado interno de cada bus: posicion aproximada y su ruta asignada.
# En una version completa esto se inicializaria repartiendo los buses
# sobre las polilineas reales de las 22 rutas (archivo de cartografia,
# seccion 2.2). Aqui se deja una version simplificada para poder emitir
# datos con forma correcta mientras se conecta la cartografia real.
buses = []
for i in range(NUM_BUSES):
    buses.append({
        "bus": 200 + i,
        "ruta": f"R{(i % NUM_RUTAS) + 1:02d}",
        "lat": 1.2130 + random.uniform(-0.01, 0.01),
        "lon": -77.2810 + random.uniform(-0.01, 0.01),
        "vel": random.uniform(0, 12),
        "rumbo": random.uniform(0, 360),
    })


def generar_mensaje(bus):
    """
    Construye un mensaje de posicion para un bus, aplicando las
    imperfecciones del dato real descritas en la tabla de la seccion 2.4:

    - hdop y sats: calidad de la senal GPS, peor en el centro.
    - desfase de reloj: el timestamp del bus puede diferir hasta 90s
      del reloj del servidor, por eso se simula con un offset aleatorio.
    - rebote de senal: con baja probabilidad, se agrega un salto de
      hasta 60 metros a la posicion, simulando el rebote en edificios
      del centro historico.
    """
    lat = bus["lat"]
    lon = bus["lon"]

    # Simulacion de rebote de senal (aprox. 60 m de salto, poco frecuente)
    if random.random() < 0.05:
        lat += random.uniform(-0.0005, 0.0005)
        lon += random.uniform(-0.0005, 0.0005)

    # Avance simple del bus (version simplificada; la version final debe
    # avanzar sobre la polilinea real de su ruta, no en linea recta)
    bus["lat"] += random.uniform(-0.0001, 0.0001)
    bus["lon"] += random.uniform(-0.0001, 0.0001)

    # Desfase de reloj del equipo del bus frente al servidor (hasta 90s)
    desfase_reloj = random.uniform(-90, 90)
    ts_bus = time.time() + desfase_reloj

    return {
        "bus": bus["bus"],
        "ruta": bus["ruta"],
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "vel": round(bus["vel"], 1),
        "rumbo": round(bus["rumbo"], 1),
        "ts": int(ts_bus),
        "hdop": round(random.uniform(1.5, 4.0), 1),
        "sats": random.randint(4, 10),
    }


@app.websocket("/ws")
async def flujo_posiciones(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            for bus in buses:
                # Silencio de cobertura: con baja probabilidad, este bus
                # simplemente no envia nada en este ciclo (tunel o zona
                # sin señal, seccion 2.4).
                if random.random() < 0.01:
                    continue

                mensaje = generar_mensaje(bus)

                # Mensaje fuera de orden: en vez de enviarlo ahora, lo
                # guardamos y lo enviamos con retardo artificial en el
                # siguiente ciclo, para simular el 3% de mensajes que
                # llegan desordenados.
                if random.random() < 0.03:
                    await asyncio.sleep(0.05)

                await websocket.send_text(json.dumps(mensaje))

            # Frecuencia total del flujo: entre 10 y 31 mensajes por
            # segundo segun el caso; este sleep controla el ritmo del
            # ciclo completo sobre los 310 buses.
            await asyncio.sleep(0.05)
    except Exception:
        pass