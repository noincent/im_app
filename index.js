var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 4000;
const usedUsernames = new Set();

server.listen(port, function(){
    console.log('Listening on localhost:' + port);
});

app.use(express.static(path.join(__dirname, 'static')));
var numberOfUsers = 0;

io.on('connection', (socket) => {
    var userJoined = false;
    socket.on('new_message', (msg) => {
        socket.broadcast.emit('new_message', {
            username: socket.username,
            message: msg
        });
    });
    socket.on('check_username', (username) => {
        if (usedUsernames.has(username)) {
            socket.emit('username_taken');
        } else {
            usedUsernames.add(username);
            socket.emit('username_available');
        }
    });
    socket.on('user_added', (username) => { 
        //if (usedUsernames.has(username)) {
        //    socket.emit('username_taken', {
        //        message: 'Username is already in use. Please choose a different username.'
        //    });
        //    return;
        //}
        socket.username = username;
        userJoined = true;
        numberOfUsers++;
        usedUsernames.add(username);
        socket.emit('login', {
            numberOfUsers: numberOfUsers
        });
        socket.broadcast.emit('user_joined', {
            username: socket.username,
            numberOfUsers: numberOfUsers
        });
    });
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });
    socket.on('typing_stop', () => {
        socket.broadcast.emit('typing_stop', {
            username: socket.username
        });
    });
    socket.on('disconnect', () => {
        if (userJoined) {
            usedUsernames.delete(socket.username);
            --numberOfUsers;
            socket.broadcast.emit('user_left', {
                username: socket.username,
                numberOfUsers: numberOfUsers
            });
        }
    });
});