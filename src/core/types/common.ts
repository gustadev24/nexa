// Posición en el map/tablero
export interface Position {
  x: number;
  y: number;
}

// Representación RGB de Color
export interface Color {
  r: number;
  g: number;
  b: number;
  hex?: string;
}
// Identificador genérico (string o number)
export type ID = string | number;

// Marca de tiempo en milisegundos
export type Timestamp = number;

// Porcentaje representado como número entre 0 y 100
export type Percentage = number;

// Callback genérico que recibe un dato de tipo T
export type Callback<T = void> = (data: T) => void;
