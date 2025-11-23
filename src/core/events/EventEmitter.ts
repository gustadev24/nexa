import type { Callback } from '@/core/types/common';
import type { GameEventType } from '@/core/types/events.types';

/**
 * Event Emitter - Observer Pattern implementation
 * Permite suscripción y emisión de eventos del juego
 */
export class EventEmitter {
  private listeners: Map<GameEventType, Set<Callback<any>>>;
  
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Suscribe un callback a un tipo de evento
   * @param eventType Tipo de evento
   * @param callback Función a ejecutar cuando ocurra el evento
   * @returns Función para desuscribirse
   */
  on<T = any>(eventType: GameEventType, callback: Callback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const callbacks = this.listeners.get(eventType)!;
    callbacks.add(callback);
    
    // Retorna función para desuscribirse
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Suscribe un callback que se ejecutará solo una vez
   */
  once<T = any>(eventType: GameEventType, callback: Callback<T>): void {
    const unsubscribe = this.on(eventType, (data: T) => {
      callback(data);
      unsubscribe();
    });
  }

  /**
   * Emite un evento con datos opcionales
   */
  emit<T = any>(eventType: GameEventType, data?: T): void {
    const callbacks = this.listeners.get(eventType);
    
    if (!callbacks || callbacks.size === 0) {
      return; // No hay listeners para este evento
    }
    
    // Ejecutar todos los callbacks suscritos
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Desuscribe todos los listeners de un tipo de evento
   */
  off(eventType: GameEventType): void {
    this.listeners.delete(eventType);
  }

  /**
   * Limpia todos los listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Obtiene el número de listeners para un evento
   */
  listenerCount(eventType: GameEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Obtiene todos los tipos de eventos con listeners activos
   */
  eventTypes(): GameEventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Verifica si hay listeners para un evento
   */
  hasListeners(eventType: GameEventType): boolean {
    return this.listenerCount(eventType) > 0;
  }
}

/**
 * Singleton instance para eventos globales del juego
 * Se puede usar para eventos que no pertenecen a una instancia específica
 */
export const globalEvents = new EventEmitter();
