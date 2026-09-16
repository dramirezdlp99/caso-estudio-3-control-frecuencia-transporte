README.md

# Control de frecuencia del transporte público urbano

## Estructura del proyecto

- `frontend/`: aplicación Angular (mapa, workers, service worker).
- `simulador/`: backend en Python (FastAPI + WebSocket) que genera el
  flujo de posiciones de los 310 buses con las imperfecciones descritas
  en la sección 2.4 del caso (ruido, saltos, silencios, desorden, desfase
  de reloj).

## Estado actual

- RF-1 (índice espacial): implementado en
  `frontend/src/app/core/spatial-index/grid.service.ts`. Rejilla uniforme
  de 20 metros por celda, justificada porque las calles paralelas del
  centro distan 25 metros.
- Simulador base: genera mensajes con la forma esperada por el WebSocket
  (bus, ruta, lat, lon, vel, rumbo, ts, hdop, sats) e introduce silencios,
  rebotes de señal y mensajes desordenados.

## Cómo correr (si hay entorno disponible)

Frontend:
    cd frontend
    npx ng serve

Simulador:
    cd simulador
    pip install -r requirements.txt
    uvicorn simulador:app --reload --port 8000

## Desarrollado por: 

David Fernando Ramírez de la Parra