const maps = require('./maps.js')
const ssf = require('./ssf.js');

function logErr(err) {
    console.log('\x1b[31m', err, '\x1b[37m');
}

function mixMissions(Players, mapName) {
    if (!mapName) {
        mapName = 'Originalkart';
    }

    let missions = ssf.shuffle(JSON.parse(JSON.stringify(maps.maps[mapName].missions)));

    Players.findAll({}).then((data) => {
        if (missions.length < data.length) {
            throw 'Too few missions';
        }

        for (let i = 0; i < data.length; i++) {
            Players.update({
                mission: missions[i]
            }, {
                where: {
                    ip: data[i].dataValues.ip
                }
            }).then(() => {
                //console.log('Missions were mixed successfully');
            }).catch((err) => {
                console.log('Missions were not mixed successfully');
                logErr(err);
            });
        }
    }).catch((err) => {
        logErr(err);
    });
}

exports.mixMissions = mixMissions;