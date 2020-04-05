console.log('Starting app RISK-LAN');

function logErr(err) {
    console.log('\x1b[31m', err, '\x1b[37m');
}

const mixTerritories = require('./mixTerritories.js');
const mixMissions = require('./mixMissions.js');
const maps = require('./maps.js');
const { rules } = require('./rules.js');

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const _ = require('underscore');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
const port = 80;
const path = require('path');

const Sequelize = require('sequelize');
const sequelize = new Sequelize('risk', 'risk', 'password', {
    host: 'localhost',
    dialect: 'postgres',
    pool: {
        max: 9,
        min: 0,
        idle: 10000
    },
    logging: (text) => {/** /console.log('\x1b[38;5;238m', text, '\x1b[37m');/**/}
});

const Players = sequelize.define('players', {
    ip: {
        primaryKey: true,
        type: Sequelize.STRING
    },
    territories: Sequelize.JSON,
    mission: Sequelize.STRING,
    timeLeft: Sequelize.INTEGER
}, {
    freezeTableName: true
});

const Games = sequelize.define('games', {
    currentPlayer: Sequelize.STRING
}, {
    freezeTableName: true
});

//Hvis ikke tabellene finnes fra f�r:
/** /Players.sync({
    force: true
});/**/
/** /Games.sync({
    force: true
});/**/

//Fjern alle spillere ved oppstart:
/**/
console.log('Removing all players on startup');
Players.destroy({
    where: {}
}).then(() => {
    Players.findAll({}).then((data) => {
        //console.log('Players:', data);
    });
});/**/

//Returnerer kun ok eller err. ok betyr at ip nå er registrert (uavhengig av om den var det fra før). err betyr error
app.post('/api/join', (req, res) => {
    console.log('Joining player:', req.ip);
    Players.findAll({
        where: {
            ip: req.ip
        }
    }).then((data) => {
        if (data.length > 1) {
            Players.destroy({
                where: {
                    ip: req.ip
                }
            });
        }
        if (data.length != 1) {
            Players.create({
                ip: req.ip,
                territories: [],
                mission: ''
            }).then((data) => {
               res.send(req.ip);
            }).catch((err) => {
                logErr(err);
                res.send('err');
            });
        }
        else {
            res.send(req.ip);
        }
    }).catch((err) => {
        logErr(err);
        res.send('err');
    });
});

//Returnerer true eller false avhengig av om ip-en er med eller ikke
app.get('/api/joined', (req, res) => {
    Players.findAll({
        where: {
            ip: req.ip
        }
    }).then((data) => {
        if (data.length == 0) {
            res.send('false');
        }
        else {
            res.send(req.ip);
        }
    }).catch((err) => {
        logErr(err);
        res.send('Det skjedde en feil');
    })
});

//Returnerer en array med territorienavnene til klienten sin ip
app.get('/api/territories', (req, res) => {
    Players.findAll({
        where: {
            ip: req.ip
        }
    }).then((data) => {
        res.send(JSON.stringify({territories: data[0].territories}));
    }).catch((err) => {
        logErr(err);
        res.send('err');
    })
});

//Returnerer string med oppdraget til klienten sin ip
app.get('/api/mission', (req, res) => {
    Players.findAll({
        where: {
            ip: req.ip
        }
    }).then((data) => {
        res.send(JSON.stringify(data[0].mission));
    }).catch((err) => {
        logErr(err);
        res.send('err');
    });
});

//Initialiserer et nytt spill med kartet gitt i data-feltet
app.post('/api/init', async (req, res) => {
    const players = await Players.findAll();
    const player = players[Math.floor(Math.random()*players.length)];
    await Games.create({
        currentPlayer: player.get('ip')
    });
    await Players.update({
        timeLeft: rules.timing.starttimeLeft
    }, {
        where: {}
    });
    console.log('Game initialized by', req.ip, req.body);
    mixTerritories.mixTerritories(Players, req.body.kart);
    mixMissions.mixMissions(Players, req.body.kart);

    let result = {};
    for (let i = 0; i < players.length; i++) {
        result[players[i].get('ip')] = rules.timing.starttimeLeft;
    }
    result.currentPlayer = player.get('ip');
    io.emit('next', result);

    //res.sendFile(__dirname+'/public/admin.html');
    res.send('<script>window.location.href = \'/\';</script>');
});

//Returnerer js-objektet med all infoen om kartene
app.get('/api/maps', (req, res) => {
    res.send(JSON.stringify(maps.maps));
});

//Returnerer en array med alle ip-ene som er med
app.get('/api/players', (req, res) => {
    Players.findAll({}).then((data) => {
        let ans = {
            players: []
        };

        for (let i = 0; i < data.length; i++) {
            ans.players.push({
                ip: data[i].dataValues.ip
            });
        }

        res.send(JSON.stringify(ans));
    }).catch((err) => {
        logErr(err);
    });
});

//Fjerner ip-en gitt ved data-feltet
app.delete('/api/removePlayer', (req, res) => {
    console.log('Player removed by', req.ip, req.body);
    Players.destroy({
        where: {
            ip: req.body.ip
        }
    }).then(() => {
        res.send('ok');
    }).catch((err) => {
        logErr(err);
        res.send('err');
    });
});

app.get('/api/turn', async (req, res) => {
    [game] = await Games.findAll({
        limit: 1,
        order: [['createdAt', 'DESC']]
    });
    const players = await Players.findAll({
        order: [['createdAt']]
    });
    if (players.length == 0) { res.send({}); return; }
    const currentPlayer = _.find(players, player => {
        return player.get('ip') == game.get('currentPlayer');
    });
    const timeLeft = currentPlayer.get('timeLeft') - (new Date().getTime() - new Date(game.updatedAt).getTime());
    players[players.indexOf(currentPlayer)].set('timeLeft', timeLeft);
    const result = {};
    for (let i = 0; i < players.length; i++) {
        result[players[i].get('ip')] = players[i].get('timeLeft');
    }
    result.currentPlayer = currentPlayer.get('ip');
    res.send(result);
});

app.get('/jquery', (req, res) => {
    res.sendFile(__dirname+'/node_modules/jquery/dist/jquery.min.js');
});

io.on('connection', (socket) => {
    console.log('A user connected!');
    socket.on('disconnect', () => {
        console.log('A user disconnected:(');
    });
    socket.on('next', async (playerIp) => {
        [game] = await Games.findAll({
            limit: 1,
            order: [['createdAt', 'DESC']]
        });
        const players = await Players.findAll({
            order: [['createdAt']]
        });
        const currentPlayer = _.find(players, player => {
            return player.get('ip') == game.get('currentPlayer');
        });
        if (currentPlayer.get('ip') != playerIp) return;
        const timeLeft = currentPlayer.get('timeLeft') - (new Date().getTime() - new Date(game.updatedAt).getTime()) + rules.timing.increment;
        players[players.indexOf(currentPlayer)].set('timeLeft', timeLeft);
        console.log(currentPlayer.get('ip'), 'has', timeLeft, 'ms left');
        const nextPlayer = players[(players.indexOf(currentPlayer)+1)%players.length];
        Games.update({
            currentPlayer: nextPlayer.get('ip')
        }, {
            where: {
                id: game.get('id')
            }
        });
        Players.update({
            timeLeft
        }, {
            where: {
                ip: currentPlayer.get('ip')
            }
        });
        const res = {};
        for (let i = 0; i < players.length; i++) {
            res[players[i].get('ip')] = players[i].get('timeLeft');
        }
        res.currentPlayer = nextPlayer.get('ip');
        io.emit('next', res);
    });
});

http.listen(port, () => console.log('RISK-LAN listening on port', port));
