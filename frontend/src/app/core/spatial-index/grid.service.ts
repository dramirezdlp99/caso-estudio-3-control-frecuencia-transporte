grid.service.ts

// grid.service.ts
// Indice espacial por rejilla uniforme sobre los segmentos de las 22 rutas.
//
// Justificacion del tamano de celda (RF-1):
// En el centro hay pares de calles paralelas separadas 25 metros.
// Si la celda fuera mayor a esa distancia, una sola celda podria contener
// segmentos de ambas calles y perderiamos la capacidad de distinguirlas
// rapido. Por eso uso 20 metros: es menor que la separacion minima real
// de la red vial, y sigue siendo lo bastante grande para que el numero
// total de celdas no explote en memoria.
//
// Costo de construccion: O(S) donde S es el total de segmentos (~40000),
// porque cada segmento se inserta en una o pocas celdas (las que toca su
// bounding box). Se hace una sola vez al cargar la cartografia (6 MB).
//
// Costo de consulta: O(1) amortizado. Para un punto, calculamos su celda
// y miramos esa celda mas las 8 vecinas (para no perder segmentos que
// cruzan el borde de una celda). La cantidad de segmentos por celda es
// aproximadamente constante en zonas normales, asi que esto no depende
// de las 40000 rutas totales.
//
// Comportamiento con densidad desigual (centro vs periferia):
// En el centro, hasta 9 rutas comparten la misma calle, asi que esas
// celdas concentran muchos mas segmentos que las de la periferia. La
// consulta ahi sigue siendo rapida (no es O(S) global), pero el costo
// por consulta en esas celdas puntuales es mayor. Es un desbalance
// aceptado porque afecta solo a un area pequena del mapa.

import { Injectable } from '@angular/core';
import { Segmento } from './segmento.model';

const TAMANO_CELDA_METROS = 20;
const METROS_POR_GRADO = 111320;
const TAMANO_CELDA_GRADOS = TAMANO_CELDA_METROS / METROS_POR_GRADO;

@Injectable({ providedIn: 'root' })
export class GridService {

  private celdas = new Map<string, Segmento[]>();

  construir(segmentos: Segmento[]): void {
    this.celdas.clear();

    for (const segmento of segmentos) {
      const filaMin = this.filaDe(Math.min(segmento.lat1, segmento.lat2));
      const filaMax = this.filaDe(Math.max(segmento.lat1, segmento.lat2));
      const colMin = this.columnaDe(Math.min(segmento.lon1, segmento.lon2));
      const colMax = this.columnaDe(Math.max(segmento.lon1, segmento.lon2));

      for (let fila = filaMin; fila <= filaMax; fila++) {
        for (let col = colMin; col <= colMax; col++) {
          const clave = this.clave(fila, col);
          if (!this.celdas.has(clave)) {
            this.celdas.set(clave, []);
          }
          this.celdas.get(clave)!.push(segmento);
        }
      }
    }
  }

  consultarCandidatos(lat: number, lon: number): Segmento[] {
    const filaCentro = this.filaDe(lat);
    const colCentro = this.columnaDe(lon);
    const resultado: Segmento[] = [];
    const vistos = new Set<Segmento>();

    for (let df = -1; df <= 1; df++) {
      for (let dc = -1; dc <= 1; dc++) {
        const clave = this.clave(filaCentro + df, colCentro + dc);
        const segmentosCelda = this.celdas.get(clave);
        if (segmentosCelda) {
          for (const seg of segmentosCelda) {
            if (!vistos.has(seg)) {
              vistos.add(seg);
              resultado.push(seg);
            }
          }
        }
      }
    }
    return resultado;
  }

  private filaDe(lat: number): number {
    return Math.floor(lat / TAMANO_CELDA_GRADOS);
  }

  private columnaDe(lon: number): number {
    return Math.floor(lon / TAMANO_CELDA_GRADOS);
  }

  private clave(fila: number, columna: number): string {
    return `${fila}_${columna}`;
  }
}