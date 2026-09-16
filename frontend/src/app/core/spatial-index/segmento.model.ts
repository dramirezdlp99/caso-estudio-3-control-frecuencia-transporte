segmento.model.ts

// segmento.model.ts
// Un segmento es el tramo de recta entre dos vertices consecutivos
// de la polilinea de una ruta. Cada ruta tiene entre 900 y 2400 vertices,
// es decir, casi la misma cantidad de segmentos.

export interface Segmento {
  rutaId: string;
  indice: number;       // posicion del segmento dentro de la polilinea de su ruta
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  distanciaAcumuladaInicio: number; // metros desde el inicio de la ruta hasta lat1/lon1
}