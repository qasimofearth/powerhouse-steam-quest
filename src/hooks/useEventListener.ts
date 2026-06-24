import { useCallback, useEffect, useState } from 'react';
import { EventBus } from '../services/EventBus';
import { EventData } from '../types/interfaces';

/**
 * A hook to subscribe to an event with automatic cleanup on unmount
 * @param eventName - The name of the event to listen for
 * @param callback - The callback function to execute when the event is emitted
 */
export const useEventListener = (eventName: string, once: boolean = false): { payload: EventData } => {
  const [payload, setPayload] = useState<EventData>(null);

  const callback = useCallback((data: EventData) => {
    setPayload(data);
  }, []);

  useEffect(() => {
    if (once) {
      EventBus.once(eventName, callback);
    } else {
      EventBus.on(eventName, callback);
    }

    // Clean up the subscription when the component unmounts
    return () => {
      EventBus.off(eventName, callback);
    };
  }, [eventName, callback, once]);

  return {
    payload,
  };
};
