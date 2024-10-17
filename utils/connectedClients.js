const connectedClients = new Map();

const setConnectedClient = (userId, socket) => {
  connectedClients.set(userId, { socket, lastActivity: Date.now() });
};

const removeConnectedClient = (userId) => {
  connectedClients.delete(userId);
};

const emitToConnectedClient = (userId, eventName, data) => {
  const client = connectedClients.get(userId.toString());
  if (client) {
    client.socket.emit(eventName, data);
    client.lastActivity = Date.now();
  }
};

// Cleanup inactive clients periodically
const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, client] of connectedClients) {
    if (now - client.lastActivity > INACTIVE_TIMEOUT) {
      removeConnectedClient(userId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export { 
  setConnectedClient, 
  removeConnectedClient, 
  emitToConnectedClient
};
