// Developed by Almatrass

module.exports = io => {
  const handler = App.require('server/sockets/handler');
  io.on('connection', socket => {
    let socketuser = null;
    if (socket.handshake.session.passport && socket.handshake.session.passport.user)
      socketuser = socket.handshake.session.passport.user;
    
    handler(socket, socketuser);
  });
};