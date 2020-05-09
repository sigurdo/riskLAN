const maps = require('./maps.js')
const ssf = require('./ssf.js');

function logErr(err) {
    console.log('\x1b[31m', err, '\x1b[37m');
}

function mixTerritories(Players, mapName) {
    if (!mapName) {
        mapName = 'Originalkart';
    }
    let map = ssf.shuffle(JSON.parse(JSON.stringify(maps.maps[mapName].territories)));
    let players = [];
    Players.findAll({}).then((data) => {
        for (let i = 0; i < data.length; i++) {
            players.push({
                ip: data[i].dataValues.ip,
                territories: []
            });
        }

        for (let i = 0; i < map.length; i++) {
            players[i%players.length].territories.push({ name: map[i], troops: 1 });
        }

        for (let i = 0; i < players.length; i++) {
            const totalTroops = [undefined, 60, 45, 35, 30, 25, 20][players.length];
            for (let j = 0; j < totalTroops - players[i].territories.length; j++) {
                players[i].territories[ssf.all.randInt(0, players[i].territories.length-1)].troops++;
            }
        }

        for (let i = 0; i < players.length; i++) {
            Players.update({
                territories: players[i].territories
            }, {
                where: {
                    ip: players[i].ip
                }
            }).then(() => {
                //console.log('Territories were mixed successfully');
            }).catch((err) => {
                console.log('Territories were not mixed successfully');
                logErr(err);
            })
        }
    }).catch((err) => {
        logErr(err);
    });
}

exports.mixTerritories = mixTerritories;