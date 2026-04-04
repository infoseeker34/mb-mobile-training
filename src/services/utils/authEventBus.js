const listeners = {};

const authEventBus = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => this.off(event, callback);
  },
  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  },
  emit(event, ...args) {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => cb(...args));
  },
};

export default authEventBus;
