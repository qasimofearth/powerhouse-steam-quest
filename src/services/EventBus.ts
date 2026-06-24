import { EventCallback, EventData, EventMap } from '../types/interfaces';

/**
 * EventBus - A singleton service for pub/sub communication between components
 */
class EventBusService {
  instanceId: string;
  constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 15);
  }

  private eventMap: EventMap = new Map();

  /**
   * Emit an event with optional data
   * @param eventName - The name of the event to emit
   * @param data - Optional data to pass to listeners
   */
  public emit(eventName: string, data?: EventData): void {
    const listeners = this.eventMap.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Subscribe to an event
   * @param eventName - The name of the event to listen for
   * @param callback - The function to call when the event is emitted
   */
  public on(eventName: string, callback: EventCallback): void {
    // Get or create the listeners set for this event
    if (!this.eventMap.has(eventName)) {
      this.eventMap.set(eventName, new Set());
    }

    const listeners = this.eventMap.get(eventName)!;
    listeners.add(callback);
  }

  /**
   * Unsubscribe from a specific event and callback
   * @param eventName - The name of the event
   * @param callback - The callback function to remove
   */
  public off(eventName: string, callback: EventCallback): void {
    const listeners = this.eventMap.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Subscribe to an event but only trigger the callback once
   * @param eventName - The name of the event to listen for
   * @param callback - The function to call when the event is emitted
   */
  public once(eventName: string, callback: EventCallback): void {
    const onceCallback: EventCallback = (data) => {
      callback(data);
      this.off(eventName, onceCallback);
    };

    this.on(eventName, onceCallback);
  }
}

// Create and export a singleton instance
export const EventBus = new EventBusService();
