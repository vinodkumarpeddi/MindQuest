export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      console.log(`👤 User ${socket.id} joined session: ${sessionId}`);
      socket.to(sessionId).emit('user-joined', { socketId: socket.id });
    });

    socket.on('leave-session', (sessionId) => {
      socket.leave(sessionId);
      console.log(`👋 User ${socket.id} left session: ${sessionId}`);
      socket.to(sessionId).emit('user-left', { socketId: socket.id });
    });

    socket.on('idea-created', (data) => {
      console.log(`💡 Broadcasting new idea to session: ${data.sessionId}`);
      socket.to(data.sessionId).emit('idea-created', data.idea);
    });

    socket.on('idea-updated', (data) => {
      console.log(`✏️  Broadcasting idea update to session: ${data.sessionId}`);
      socket.to(data.sessionId).emit('idea-updated', data.idea);
    });

    socket.on('idea-deleted', (data) => {
      console.log(`🗑️  Broadcasting idea deletion to session: ${data.sessionId}`);
      socket.to(data.sessionId).emit('idea-deleted', data.ideaId);
    });

    socket.on('idea-moved', (data) => {
      socket.to(data.sessionId).emit('idea-moved', {
        ideaId: data.ideaId,
        position: data.position
      });
    });

    socket.on('idea-voted', (data) => {
      console.log(`👍 Broadcasting vote to session: ${data.sessionId}`);
      socket.to(data.sessionId).emit('idea-voted', data.idea);
    });

    socket.on('idea-reacted', (data) => {
      socket.to(data.sessionId).emit('idea-reacted', data.idea);
    });

    socket.on('clusters-updated', (data) => {
      console.log(`🎨 Broadcasting cluster update to session: ${data.sessionId}`);
      io.to(data.sessionId).emit('clusters-updated', data.clusters);
    });

    socket.on('user-typing', (data) => {
      socket.to(data.sessionId).emit('user-typing', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO handlers configured');
}
