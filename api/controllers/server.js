//
//  Created by Mingliang Chen on 17/12/24.  Merry Christmas
//  illuspas[a]gmail.com
//	edit : Cengiz AKCAN | 05/03/2018
//	edit : adana.web.software@gmail.com
//  Copyright (c) 2017 Nodemedia. All rights reserved.
//

const OS = require('os');

function cpuAverage() {

  //Initialise sum of idle and time of cores and fetch CPU info
  let totalIdle = 0, totalTick = 0;
  let cpus = OS.cpus();

  //Loop through CPU cores
  for (let i = 0, len = cpus.length; i < len; i++) {

    //Select CPU core
    let cpu = cpus[i];

    //Total up the time in the cores tick
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }

    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }

  //Return the average Idle and Tick times
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

function percentageCPU() {
  return new Promise(function (resolve, reject) {
    let startMeasure = cpuAverage();
    setTimeout(() => {
      let endMeasure = cpuAverage();
      //Calculate the difference in idle and total time between the measures
      let idleDifference = endMeasure.idle - startMeasure.idle;
      let totalDifference = endMeasure.total - startMeasure.total;

      //Calculate the average percentage CPU usage
      let percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
      resolve(percentageCPU);
    }, 100);
  });
}

function getSessionsInfo(sessions) {
  let info = {
    inbytes: 0,
    outbytes: 0,
    rtmp: 0,
    http: 0,
    ws: 0,
  };
  sessions.forEach((session, id) => {
    let socket = session.TAG === 'rtmp' ? session.socket : session.req.socket;
    info.inbytes += socket.bytesRead;
    info.outbytes += socket.bytesWritten;
    info.rtmp += session.TAG === 'rtmp' ? 1 : 0;
    info.http += session.TAG === 'http-flv' ? 1 : 0;
    info.ws += session.TAG === 'websocket-flv' ? 1 : 0;
  });
  return info;
}


function getInfo(req, res, next) {
  let s = this.sessions;
  percentageCPU().then((cpuload) => {
    let sinfo = getSessionsInfo(s);
    let info = {
      os: {
        arch: OS.arch(),
        platform: OS.platform(),
        release: OS.release(),
      },
      cpu: {
        num: OS.cpus().length,
        load: cpuload,
        model: OS.cpus()[0].model,
        speed: OS.cpus()[0].speed,
      },
      mem: {
        totle: OS.totalmem(),
        free: OS.freemem()
      },
      net: {
        inbytes: this.inbytes + sinfo.inbytes,
        outbytes: this.outbytes + sinfo.outbytes,
      },
      nodejs: {
        uptime: Math.floor(process.uptime()),
        version: process.version,
        mem: process.memoryUsage()
      },
      clients: {
        accepted: this.accepted,
        active: this.sessions.size - this.idlePlayers.size,
        idle: this.idlePlayers.size,
        rtmp: sinfo.rtmp,
        http: sinfo.http,
        ws: sinfo.ws
      },
    };
    res.json(info);
  });
}

exports.getInfo = getInfo;