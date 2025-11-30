export class TimeService {
  /**
   * Formatea milisegundos a formato mm:ss
   *
   * @param ms Milisegundos a formatear
   * @returns Tiempo en formato "mm:ss"
   */
  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
