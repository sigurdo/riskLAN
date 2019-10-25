console.log('Starting app RISK-LAN');

function logErr(err) {
    console.log('\x1b[31m', err, '\x1b[37m');
}

const mixTerritories = require('./mixTerritories.js');
const mixMissions = require('./mixMissions.js');
const maps = require('./maps.js');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
const port = 8080;
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
    mission: Sequelize.STRING
}, {
    freezeTableName: true
});

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
               res.send('ok');
            }).catch((err) => {
                logErr(err);
                res.send('err');
            });
        }
        else {
            res.send('ok');
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
            res.send('true');
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
app.post('/api/init', (req, res) => {
    console.log('Initializing game with options', req.body);
    mixTerritories.mixTerritories(Players, req.body.kart);
    mixMissions.mixMissions(Players, req.body.kart);

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
    console.log('Removing player:', req.body);
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

app.listen(port, () => console.log('RISK-LAN listening on port', port));

