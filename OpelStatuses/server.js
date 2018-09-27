
const https = require('https');
const express = require('express');
const app = express();
const port = 666;
const fs = require('fs');

function compare(a, b) {
  if (a.item.vehicleDetail.lastVehicleEvent < b.item.vehicleDetail.lastVehicleEvent)
    return 1;
  else if (a.item.vehicleDetail.lastVehicleEvent > b.item.vehicleDetail.lastVehicleEvent)
    return -1;
  //jeżeli są dwa identyczne statusy:
  else {
    if (a.item.vehicleDetail.eventCodeUpdateTimestamp < b.item.vehicleDetail.eventCodeUpdateTimestamp)
      return 1;
    if (a.item.vehicleDetail.eventCodeUpdateTimestamp > b.item.vehicleDetail.eventCodeUpdateTimestamp)
      return -1;
    return 0;
  }
}

function histDataWrite(vehicle_key, histData) {
  fs.writeFile('vehicles/' + vehicle_key + '.json', JSON.stringify(histData), 'utf8', function readFileCallback(err) {
    if (err) {
      console.log(err);
    }
  });
}

function histDataRead(vehicle_key) {
  var histData = [];
  if (fs.existsSync('vehicles/' + vehicle_key + '.json') && (histData = fs.readFileSync('vehicles/' + vehicle_key + '.json', { encoding: 'utf8' }))) {
    histData = JSON.parse(histData);
  }
  return histData;
}

app.set('view engine', 'pug');

app.get('/', (req, res) => {
  if (!req.query.vehicle_key) {
    res.render('index', { title: 'OpelStatuses'});
  }
  else {

    var options = {
      host: 'my.opel.pl',
      port: 443,
      path: '/api/opel/pl/pl/search/vehicle/lookup_vehicle.do?vehicle_key=' + req.query.vehicle_key
    };
    
    https.get(options, function (resource) {
      var current = '';
      resource.on('data', function (chunk) {
        current += chunk;
      });
      resource.on('end', function () {
        current = JSON.parse(current);
        if (current.errorMsg) {
          res.render('error', { title: 'OpelStatuses', errMsg: current.errorMsg });
        }
        else {
          var histData = histDataRead(req.query.vehicle_key);
          if (histData === undefined || histData.length === 0) {
            histData = [current];
            histDataWrite(req.query.vehicle_key, histData);
          }
          else if (current.item.vehicleDetail.lastVehicleEvent !== histData[0].item.vehicleDetail.lastVehicleEvent || current.item.vehicleDetail.eventCodeUpdateTimestamp !== histData[0].item.vehicleDetail.eventCodeUpdateTimestamp) {
            histData.splice(0, 0, current);
            histDataWrite(req.query.vehicle_key, histData);
          }
          res.render('ok', { title: 'OpelStatuses', historical: histData });
        }
      });
    }).on('error', function (e) {
      res.render('error', { title: 'OpelStatuses', errMsg: e.message });
    });

  }
});

app.listen(port, () => console.log(`OpelStatuses nasluchuje na porcie ${port}!`));
