module.exports.register = (server, options, next) => {

  const io = require(`socket.io`)(server.listener);

  let players = [];

  const rooms = io.sockets.adapter.rooms;

  io.on(`connection`, socket => {

    const {id: playerId} = socket;

    const player = {
      id: playerId,
      picture: ``,
      room: ``
    };

    players.push(player);

    //naar iedereen buiten jezelf sturen dat je gejoined bent
    socket.broadcast.emit(`add`, player);

    //naar jezelf alle players die geconnect zijn met de server sturen
    socket.emit(`addAll`, players);

    console.log(`Player with ID: ${player.id} is connected. ${players.length} spelers in totaal`);
    console.log(players);

    socket.on(`createRoom`, () => {
      const code = Math.floor(Math.random() * 9000) + 1000; //generate random nummer tussen 1000 en 9999

      socket.join(code);

      const data = {
        player: player,
        roomId: code
      };

      const me = players.find(p => {
        if (p.id === playerId) return p;
      });

      me.room = code;

      socket.emit(`roomCreated`, data);
    });

    socket.on(`newPicture`, picture => {
      const me = players.find(p => {
        if (p.id === playerId) return p;
      });

      me.picture = picture;

      io.in(me.room).emit(`pictureTaken`, me);
    });

    socket.on(`joinRoom`, room => {
      socket.join(room);

      //de room die je joined opvragen van socket
      const myRoom = io.sockets.adapter.rooms[room];

      const playersInMyRoom = [];

      //elke player (is enkel het id) die in de room zit pushen naar playersInMyRoom array
      Object.keys(myRoom.sockets).forEach(player => {
        console.log(player, `in my room`);
        //dit id zoeken in alle players en dat object pushen naar playersInMyRoom
        players.map(p => {
          console.log(player, p.id);
          if (p.id === player) playersInMyRoom.push(p);
        });
      });

      const me = players.find(p => {
        if (p.id === playerId) return p;
      });

      me.room = room;

      const data = {
        player: player,
        room: room,
        players: playersInMyRoom
      };

      //naar iedereen in de room sturen dat je gejoined bent
      io.in(room).emit(`joined`, data);
    });

    socket.on(`checkRoom`, id => {

      console.log(rooms);

      if (rooms.hasOwnProperty(id)) {
        socket.emit(`found`, id);
      } else {
        socket.emit(`notFound`, id);
      }
    });

    socket.on(`disconnect`, () => {

      players = players.filter(p => {
        return p.id !== playerId;
      });

      socket.broadcast.emit(`remove`, playerId);

      console.log(`Player[${player.id}] left`);
      console.log(players);

    });

  });

  next();

};

module.exports.register.attributes = {
  name: `App`,
  version: `0.1.0`
};
