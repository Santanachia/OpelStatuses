
// settings
const config = {
  port: 666,
  lang: 'pl'
};

const https = require('https');
const express = require('express');
const app = express();
const fs = require('fs');

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
    res.render('index', { title: 'OpelStatuses' });
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
          res.render('error', { errMsg: current.errorMsg });
        }
        else {
          var now = new Date();
          var lastModified = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

          var histData = histDataRead(current.item.vehicleDetail.sono);
          if (histData === undefined || histData.length === 0) {
            histData = [current];
            histDataWrite(current.item.vehicleDetail.sono, histData);
          }
          else if (current.item.vehicleDetail.lastVehicleEvent !== histData[0].item.vehicleDetail.lastVehicleEvent || current.item.vehicleDetail.eventCodeUpdateTimestamp !== histData[0].item.vehicleDetail.eventCodeUpdateTimestamp) {
            histData.splice(0, 0, current);
            histDataWrite(current.item.vehicleDetail.sono, histData);
          }

          res.render('ok', {
            lastModified: lastModified,
            statuses: fillStages(histData),
            details: {
              make: histData[0].item.vehicleDetail.make,
              modelDescription: histData[0].item.vehicleDetail.modelDescription,
              modelYearSuffix: histData[0].item.vehicleDetail.modelYearSuffix,
              registrationDate: prettyDate(histData[0].item.registrationDate),
              dateFirstRegistered: prettyDate(histData[0].item.vehicleDetail.dateFirstRegistered),
              registrationMark: histData[0].item.registrationMark,
              vin: histData[0].item.vehicleDetail.vin,
              colour: getColour(histData[0].item.vehicleDetail.optionCodes, histData[0].item.vehicleDetail.colour),
              engine: translate(histData[0].item.vehicleDetail.engineCode),
              tapicerka: translate(histData[0].item.vehicleDetail.trim).replace('Tapicerka ', ''),
              onStarEquipped: histData[0].item.vehicleDetail.onStarEquipped ? '✓' : '<span style="color:darkred">✗</span>'
            },
            options: translateOptions(histData[0].item.vehicleDetail.optionCodes)
          });
        }
      });
    }).on('error', function (e) {
      res.render('error', { errMsg: e.message });
    });

  }
});

app.listen(config.port, () => console.log(`OpelStatuses nasluchuje na porcie ${config.port}!`));

const translations = {
  en: {
    //RPO
    '01A': 'TRIM COLOUR SEAT - JET BLACK',
    '02P': 'TRIM COLOUR SEAT - COCOA',
    '01W': 'TRIM COLOUR SEAT - OCEAN',
    '01Y': 'TRIM COLOUR SEAT - SONIC BLUE',
    '1AB': 'TRIM COLOUR DR PANEL - JET BLACK',
    '1AW': 'TRIM COLOUR DR PANEL - OCEAN',
    '1AX': 'TRIM COLOUR DR PANEL - SPICE RED',
    '2BP': 'MOULDING DOOR INTR - ONE LAYER PAINT DARK PEARL',
    '2BQ': 'MOULDING DOOR INTR - DUAL LAYER PAINT SILVER DUST',
    '2CG': 'MOULDING DOOR INTR - DUAL FOIL LIQUID PALLADIUM/DARK MATRIX',
    '2CL': 'MOULDING DOOR INTR - DUAL FOIL PIANO BLACK & LIQUID PALLADIUM',
    '4A0': 'INTERIOR TRIM - JET BLACK/SPICE RED',
    '4AA': 'INTERIOR TRIM - JET BLACK',
    '4AZ': 'INTERIOR TRIM - JET BLACK/OCEAN',
    '9C1': 'SALES PACKAGE - POLICE VEHICLE',
    'A01': 'WINDOW TINTED - ALL, SHADED WINDSCREEN (DO NOT USE AFTER M.Y. 2011)',
    'A51': 'SEAT - FRT BKT, CUSTOM',
    'A64': 'SEAT RR - SPLIT, FOLDING, 40/60',
    'A69': 'RESTRAINT - SEAT BELT TENSIONER, FRT, VAR. 2',
    'AC4': 'RESTRAINT PROVISIONS - CHILD, FRONT, RH',
    'ADL': 'RESTRAINT SYSTEM - SEAT, INFLATABLE, DRIVER & PASS, SINGLE STAGE',
    'AE4': 'SEAT - FRT BKT, SPORT',
    'AEF': 'WINDOW - POWER OPERATED, PASSENGER, EXPRESS UP/DOWN',
    'AER': 'WINDOW - POWER OPERATED, RR DRS, EXPRESS UP/DOWN',
    'AF8': 'LOCK CONTROL - SIDE DOOR, ANTI THEFT PROTECTION',
    'AFA': 'INTERIOR TRIM CONFIG - #1',
    'AG5': 'ADJUSTER PASS ST - MANUAL, 2 WAY',
    'AG6': 'ADJUSTER PASS ST - MANUAL, 4 WAY',
    'AH3': 'ADJUSTER FRT ST - MANUAL, 4 WAY, DRIVER',
    'AH4': 'ADJUSTER FRT ST - MANUAL, 6 WAY, DRIVER',
    'AHC': 'CONTROL - SEAT, MANUAL CUSHION EXTN, DRIVER',
    'AHF': 'CONTROL - SEAT, MANUAL CUSHION EXTN, PASS',
    'AHN': 'RESTRAINT PROVISIONS - CATCH',
    'AHS': 'RESTRAINT - HEAD, FRT SEAT, UP/DOWN, FORE/AFT ADJUSTMENT, ACTIVE',
    'AJC': 'RESTRAINT - HEAD, FRT SEAT, UP/DOWN ADJUSTMENT',
    'AJF': 'RESTRAINT - HEAD, FRT SEAT, UP/DOWN ADJUSTMENT, ACTIVE',
    'AJG': 'RESTRAINT SYSTEM - SEAT, INFLATABLE, DRIVER & PASS, FRT & SEAT SIDE, SINGLE STAGE',
    'AKN': 'WINDOW TYPE - TINTED',
    'AKO': 'WINDOW TYPE - PRIVACY',
    'AKW': 'WINDSCREEN TYPE - TINTED',
    'AL9': 'CONTROL - SEAT, POWER LUMBAR, DRIVER',
    'AQP': 'RESTRAINT - HEAD, RR SEAT, CENTRE',
    'ASV': 'EQUIPMENT - SENSOR AIR MOISTURE & W/S TEMP',
    'AT9': 'CONTROL - SEAT, POWER LUMBAR, PASS',
    'AWO': 'RESTRAINT SYSTEM RR - SEAT BELT, REAR, 3 POINT, CTR',
    'AXG': 'WINDOW - POWER OPERATED-EXPRESS DRIVER UP/DOWN',
    'AXJ': 'VEHICLE TYPE - PASSENGER CAR',
    'AYC': 'RESTRAINT SYSTEM - SEAT, INFLATABLE, DRIVER & PASS FRT, SEAT SIDE, ROOF SIDE, SINGLE STAGE',
    'B35': 'COVERING REAR - FLOOR MATS, CARPETED INSERT',
    'B58': 'COVERING - FLOOR MAT, FRT & RR, CARPETED INSERT',
    'B6U': 'FLOOR - LUGGAGE, ADJUSTABLE',
    'B72': 'PLATE - DOOR SILL CVR',
    'B75': 'TRIM EQUIPMENT - LUGG COMPT LINING',
    'BA8': 'COMPARTMENT - STOWAGE, FRT SEAT, PASS',
    'BA9': 'COMPARTMENT - I/P (COOLED)',
    'BAH': 'EQUIPMENT - SECURITY SYSTEM, IMMOBILIZATION, STEP TWO',
    'BD8': 'MOULDING ROOF - BODY COLOUR',
    'BF7': 'COMPARTMENT - STOWAGE, FRT SEAT, LEFT',
    'C1R': 'ORNAMENTATION INTR - I/P PAD, JET BLACK',
    'C1S': 'ORNAMENTATION INTR - I/P PAD, SPICE RED',
    'C1T': 'ORNAMENTATION INTR - I/P PAD, OCEAN',
    'C25': 'WIPER SYSTEM - RR WINDOW, INTERMITTENT',
    'C32': 'HEATER - HEATING/DEFROSTER SYSTEM, REINFORCED, ELECTRIC',
    'C42': 'HVAC SYSTEM - HEATER, OUTSIDE AIR, DELUXE',
    'C49': 'DEFOGGER - RR WINDOW, ELECTRIC',
    'C67': 'HVAC SYSTEM - AIR CONDITIONER FRT, ELECTRONIC CONTROLS',
    'C95': 'LAMP - INTR, ROOF, COURTESY & DUAL READING',
    'C99': 'SWITCH - INFL RST I/P MDL MAN SUPPRESSION',
    'C9B': 'LAMP - INTR, AMBIENT, DOOR',
    'C9D': 'LAMP - INTR, AMBIENT, CONSOLE',
    'CAU': 'ACCESSORY - HANDS FREE PHONE/BLUETOOTH',
    'CE1': 'WIPER SYSTEM - WINDSCREEN, PULSE, MOISTURE SENSITIVE',
    'CE4': 'WASHER - HEADLAMP, HIGH PRESSURE',
    'CF5': 'ROOF - SUN, GLASS, SLIDING, ELEC',
    'CJ2': 'HVAC SYSTEM - AIR CONDITIONER FRT, AUTO TEMP CONT, AUX TEMP CONT',
    'CJ6': 'COUNTRY - IRELAND',
    'CJ8': 'COUNTRY - BULGARIA',
    'CJ9': 'COUNTRY - ROMANIA',
    'CK2': 'COUNTRY - YEMEN',
    'CK4': 'COUNTRY - GREECE',
    'CK7': 'COUNTRY - SINGAPORE',
    'CL4': 'COUNTRY - UZBEKISTAN',
    'CL9': 'COUNTRY - HONG KONG',
    'CR2': 'COUNTRY - SLOVENIA',
    'CR4': 'COUNTRY - DUBAI',
    'CR5': 'COUNTRY - CROATIA',
    'CR6': 'COUNTRY - POLAND',
    'CR7': 'COUNTRY - HUNGARY',
    'CR8': 'COUNTRY - EGYPT',
    'CR9': 'COUNTRY - MOROCCO',
    'CS0': 'COUNTRY - CZECH REPUBLIC',
    'CS1': 'COUNTRY - TUNISIA',
    'CS3': 'COUNTRY - TOGO',
    'CS5': 'COUNTRY - ANGOLA',
    'CS6': 'COUNTRY - ETHIOPIA',
    'CS8': 'COUNTRY - ZIMBABWE',
    'CS9': 'COUNTRY - BOTSWANA',
    'CT0': 'COUNTRY - SLOVAKIA',
    'CT1': 'COUNTRY - BELGIUM',
    'CT2': 'COUNTRY - AUSTRIA',
    'CT3': 'COUNTRY - GERMANY',
    'CT4': 'COUNTRY - LUXEMBOURG',
    'CT5': 'COUNTRY - NETHERLANDS',
    'CT6': 'COUNTRY - ITALY',
    'CT7': 'COUNTRY - DENMARK',
    'CT8': 'COUNTRY - PORTUGAL',
    'CT9': 'COUNTRY - SPAIN',
    'CU0': 'COUNTRY - UKRAINE',
    'CU1': 'COUNTRY - NORWAY',
    'CU2': 'COUNTRY - FINLAND',
    'CU3': 'COUNTRY - FRANCE',
    'CU4': 'COUNTRY - SWEDEN',
    'CU5': 'COUNTRY - SWITZERLAND',
    'CU6': 'COUNTRY - TAIWAN',
    'CU7': 'COUNTRY - KUWAIT',
    'CU8': 'COUNTRY - SAUDI ARABIA',
    'CU9': 'COUNTRY - UNITED KINGDOM',
    'CV0': 'COUNTRY - ALBANIA',
    'CV1': 'COUNTRY - ICELAND',
    'CV4': 'COUNTRY - ISRAEL',
    'CV9': 'COUNTRY - TURKEY',
    'CW0': 'COUNTRY - ARMENIA',
    'CWR': 'COUNTRY - REUNION ISLAND',
    'CX0': 'COUNTRY - AZERBAIJAN',
    'CX5': 'COUNTRY - AUSTRALIA',
    'CX6': 'COUNTRY - NEW ZEALAND',
    'CX8': 'COUNTRY - SYRIA',
    'CX9': 'COUNTRY - LEBANON',
    'CY2': 'COUNTRY - JORDAN',
    'CY3': 'COUNTRY - CAMEROON',
    'CY4': 'COUNTRY - IVORY COAST',
    'CY5': 'COUNTRY - SERBIA',
    'CY6': 'COUNTRY - GABON',
    'CY9': 'COUNTRY - ESTONIA',
    'CZ0': 'COUNTRY - CENTRAL AFRICA',
    'CZ3': 'COUNTRY - RUSSIA',
    'CZ5': 'COUNTRY - SOUTH AFRICA',
    'CZ6': 'COUNTRY - KAZAKHSTAN',
    'CZ8': 'COUNTRY - MACEDONIA',
    'D2G': 'COUNTRY - ALGERIA',
    'D2H': 'COUNTRY - BENIN',
    'D2I': 'COUNTRY - LITHUANIA',
    'D2J': 'COUNTRY - GUINEA',
    'D2S': 'COUNTRY - KYRGYZSTAN',
    'D2T': 'COUNTRY - NIGER',
    'D2V': 'COUNTRY - TANZANIA',
    'D2W': 'COUNTRY - RWANDA',
    'D2X': 'COUNTRY - BURUNDI',
    'D31': 'MIRROR I/S R/V - TILT',
    'D3C': 'COUNTRY - BOSNIA-HERZEGOVINA',
    'D3E': 'COUNTRY - ERITREA',
    'D3G': 'COUNTRY - CAPE VERDE ISLANDS',
    'D3H': 'COUNTRY - BELARUS',
    'D3N': 'COUNTRY - YUGOSLAVIA',
    'D3O': 'COUNTRY - MOLDOVA',
    'D3S': 'COUNTRY - QATAR',
    'D3T': 'COUNTRY - TURKMENISTAN',
    'D3Z': 'COUNTRY - ANDORRA',
    'D4A': 'COUNTRY - LATVIA',
    'D4B': 'COUNTRY - CHAD',
    'D4C': 'COUNTRY - BAHRAIN',
    'D4F': 'COUNTRY - ASCENSION ISLANDS',
    'D4I': 'COUNTRY - BURKINA FASO',
    'D4L': 'COUNTRY - COMORO ISLANDS',
    'D4M': 'COUNTRY - CONGO BRAZZ',
    'D4P': 'COUNTRY - DJIBOUTI',
    'D5F': 'COUNTRY - SENEGAL',
    'D5G': 'COUNTRY - SEYCHELLES',
    'D5H': 'COUNTRY - SIERRA LEONE',
    'D5J': 'COUNTRY - SOMALIA',
    'D5L': 'COUNTRY - SWAZILAND',
    'D5M': 'COUNTRY - TAJIKISTAN',
    'D5N': 'COUNTRY - UGANDA',
    'D6F': 'COUNTRY - DEMOCRATIC REPUBLIC OF THE CONGO',
    'D6I': 'MIRROR I/S FRT VAN - SUNSHADE, DRIVER, W/MIRROR, COVER, ILLUM, PASS, W/MIRROR, COVER, ILLUM',
    'D70': 'RATIO - TRANSAXLE FINAL DRIVE 2.77',
    'D75': 'HANDLE O/S DOOR - BODY COLOUR',
    'D8G': 'CARRIER PKG - RR MOUNTED, 2 PLACE BICYCLE',
    'DA2': 'ARM REST - RR SEAT, STORAGE, PASS THROUGH',
    'DBU': 'CONSOLE - FRT COMPT, FLOOR, ARM REST SLIDING',
    'DD8': 'MIRROR I/S R/V - LT SENSITIVE',
    'DLU': 'MIRROR I/S FRT VAN - SUNSHADE, DRIVER, W/O MIRROR, PASS, W/MIRROR & COVER',
    'DP6': 'MIRROR PROVISIONS - HOUSING, PAINTED',
    'DVA': 'CLUSTER COLOUR - INST, BLACK, BLACK RINGS W/SILVER TOP',
    'DVN': 'CLUSTER COLOUR - INST, BLACK, TRANSLUCENT RINGS',
    'DWE': 'MIRROR O/S - LH & RH, RC, ELEC, HEAT, AUX WFOV/DRVR, MANFOLD, CNVX/PASS',
    'DWF': 'MIRROR O/S - LH & RH, RC, ELEC, HEAT, AUX WFOV/DRVR, PWRFOLD, CNVX/PASS',
    'DWT': 'MIRROR O/S - LH & RH, RC, MANFOLD, AUX WFOV/DRVR, CNVX/PASS',
    'E17': 'BUMPER - 2.5 MPH',
    'E19': 'BUMPER - 5.0 MPH',
    'E3C': 'COVER - EXHAUST, REAR PIPE',
    'E3E': 'HANDLE - O/S, L/GATE, R/CMPT, CHROME',
    'E6A': 'COUNTRY - FRENCH INDIAN OCEAN',
    'E6F': 'COUNTRY - GEORGIA',
    'E6G': 'COUNTRY - GHANA',
    'E6H': 'COUNTRY - OMAN',
    'E6K': 'COUNTRY - RIO MUNI',
    'E6L': 'COUNTRY - SAINT HELENA',
    'E6R': 'COUNTRY - GREENLAND',
    'E7A': 'COUNTRY - LESOTHO',
    'E7B': 'COUNTRY - LIBERIA',
    'E7C': 'COUNTRY - LIBYA',
    'E7E': 'COUNTRY - MADAGASCAR',
    'E7F': 'COUNTRY - MALAWI',
    'E7G': 'COUNTRY - MALI',
    'E7I': 'COUNTRY - MAURITANIA',
    'E7J': 'COUNTRY - MAURITIUS',
    'E7M': 'COUNTRY - MONTENEGRO',
    'E7S': 'COUNTRY - ZAMBIA',
    'EA1': 'POCKET - FRONT SEAT BACK, LH',
    'EA2': 'POCKET - FRONT SEAT BACK, RH',
    'EBW': 'TRIM SEAT - CLOTH, CORDOBA',
    'EBX': 'TRIM SEAT - CLOTH, SCENE MODIFIED',
    'EBY': 'TRIM SEAT - CLOTH, LACE',
    'EBZ': 'TRIM SEAT - CLOTH, RIBBON',
    'ECB': 'EQUIPMENT - ADDITIONAL FOLDABLE KEY',
    'ECC': 'TRIM SEAT - LEATHER, PERFORATED MONDIAL',
    'EF2': 'COUNTRY - GUINEA-BISSAU',
    'EF4': 'COUNTRY - SUDAN',
    'EF8': 'COUNTRY - NAMIBIA',
    'ELL': 'PLANT CODE - ELLESMERE PORT, ENGLAND',
    'EMB': 'TRIM SEAT - CLOTH, TRACK',
    'ET2': 'COUNTRY - MOZAMBIQUE',
    'F45': 'CHASSIS - CONTINUOUSLY VARIABLE REAL TIME DAMPING',
    'F82': 'RATIO - TRANSAXLE FINAL DRIVE 3.23',
    'FBD': 'TRIM DOOR - CLOTH, ATLANTIS',
    'FCS': 'TRIM DOOR - URETHANE, MONDIAL',
    'FM9': 'RATIO - TRANSAXLE FINAL DRIVE 3.20',
    'FP9': 'RATIO - TRANSAXLE FINAL DRIVE 3.55',
    'FV1': 'RATIO - TRANSAXLE FINAL DRIVE 3.72',
    'FV2': 'RATIO - TRANSAXLE FINAL DRIVE 4.18',
    'FV5': 'RATIO - TRANSAXLE FINAL DRIVE 4.19',
    'FW6': 'RATIO - TRANSAXLE FINAL DRIVE 3.42',
    'FX1': 'RATIO - TRANSAXLE FINAL DRIVE 3.94',
    'FX3': 'RIDE AND HANDLING - AUTOMATIC ELECTRONIC CONTROLLED',
    'FX4': 'RATIO - TRANSAXLE FINAL DRIVE 3.35',
    'FX6': 'RATIO - TRANSAXLE FINAL DRIVE 3.87',
    'FXB': 'RATIO - TRANSAXLE FINAL DRIVE 3.65',
    'FXH': 'RATIO - TRANSAXLE FINAL DRIVE 3.53',
    'GAL': 'PRIMARY COLOUR - EXTERIOR, TECHNICAL GREY, MET.2',
    'GAN': 'PRIMARY COLOUR - EXTERIOR, SWITCHBLADE SILVER MET (G) 636R',
    'GAR': 'PRIMARY COLOUR - EXTERIOR, CARBON FLASH MET (G) 501Q',
    'GAZ': 'PRIMARY COLOUR - EXTERIOR, OLYMPIC WHITE (G) 8624',
    'GBG': 'PRIMARY COLOUR - EXTERIOR, BLACK SAPPHIRE, MICA (G)',
    'GCS': 'PRIMARY COLOUR - EXTERIOR, VELVET RED MET (G)',
    'GCT': 'PRIMARY COLOUR - EXTERIOR, MOROCCAN BLUE MET (G)',
    'GCU': 'PRIMARY COLOUR - EXTERIOR, ATLANTIS BLUE MET (G)',
    'GCV': 'PRIMARY COLOUR - EXTERIOR, PEWTER GREY MET(G)',
    'GCW': 'PRIMARY COLOUR - EXTERIOR, MISTY LAKE MET (G)',
    'GCY': 'PRIMARY COLOUR - EXTERIOR, POLY SILVER MET(G)',
    'GCZ': 'PRIMARY COLOUR - EXTERIOR, LIGHT GOLD MET (G)',
    'GEK': 'PRIMARY COLOUR - EXTERIOR, ROYAL BLUE (G)',
    'GEU': 'PRIMARY COLOUR - EXTERIOR, WATERWORLD BLUE MET (G)',
    'GGE': 'PRIMARY COLOUR - EXTERIOR, SUPER RED (G) 717R',
    'GKE': 'PRIMARY COLOUR - LINEN BEIGE MET',
    'GNA': 'CHASSIS EQUIP FRONT - STRUT ASM',
    'GNG': 'CHASSIS EQUIP REAR - REAR AXLE, COMPOUND CRANK, ADDITIONAL WATT AGE',
    'GOK': 'PRIMARY COLOUR - EXTERIOR, SILKY SHADOW, MET (G)',
    'GOL': 'PRIMARY COLOUR - EXTERIOR, FRESKO, MET (G)',
    'GSI': 'MODEL CONVERSION - SPORT GSI',
    'GWP': 'PLANT CODE - GLIWICE, POLAND',
    'GZ3': 'FUEL TANK FILLER - NECK, UNRESTRICTED',
    'HLE': 'MERCHANDISED PKG - PERFORMANCE CONVERSION',
    'IK9': 'CAMPAIGN PKG - CAMPAIGN "ECOFLEX"',
    'J60': 'BRAKE SYSTEM - POWER, FRT & RR DISC, ABS, 16"',
    'J61': 'BRAKE SYSTEM - POWER, FRT & RR DISC, ABS, 17"',
    'J67': 'BRAKE SYSTEM - POWER, FRT & RR DISC, ABS, 15"',
    'J71': 'BRAKE PARKING - POWER OPERATED',
    'JF5': 'PEDALS - SPORTY, ALLOY',
    'JP2': 'PEDALS - DOUBLE, DRIVING SCHOOL',
    'K07': 'HEATER - RADIATOR, COOLANT, FUEL FIRED, TIMER',
    'K09': 'GENERATOR - 120 AMP',
    'K34': 'CRUISE CONTROL - AUTOMATIC, ELECTRONIC',
    'K3K': 'BATTERY - LBN1, FLA, 12V, 50AH, 375 ENCCA',
    'K3L': 'BATTERY - LBN2, FLA, 12V, 60AH, 438 ENCCA',
    'K3N': 'BATTERY - LBN3, FLA, 12V, 70AH, 512 ENCCA',
    'K3S': 'BATTERY - LBN4, FLA, 12V, 75AH, 720 ENCCA',
    'K48': 'EQUIPMENT - PACKAGE, EXTREME DUST',
    'K60': 'ALTERNATOR - 100 AMP',
    'KA1': 'HEATER - SEAT, FRT',
    'KB5': 'CONTROL - ECM GRADE BRAKING',
    'KC5': 'RECEPTACLE - ELECTRICAL, ACCESSORY',
    'KCL': 'HEATER - DUCT, RR PASS (2ND POSN)',
    'KG9': 'ALTERNATOR - 140 AMP',
    'KL9': 'ENG CONTROL - STOP/START SYS',
    'KRP': 'PROVISIONS - INFOTAINMENT UNIT DELETE',
    'KTA': 'AUDIO INTERFACE',
    'KTB': 'AUDIO INTERFACE - WIRELESS',
    'KTM': 'KEY - PRIMARY FOLDABLE, ADDITIONAL RIGID',
    'L2I': 'ENGINE - PETROL, 4 CYL, 1.4L, MFI, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, FAM O, 74 KW, E85 MAX, GME',
    'LBS': 'ENGINE - DIESEL, 4 CYL, 2.0L, L4, CPI, TURBO, HO, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, 121KW',
    'LBX': 'ENGINE - DIESEL, 4 CYL, 2.0L, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, TURBO VGT, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, 96KW',
    'LBY': 'ENGINE - DIESEL, 4 CYL, 2.0L, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, TWIN TURBO, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, 140 KW,',
    'LDD': 'ENGINE - PETROL, 4 CYL, 1.4L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, VARIABLE CAMSHAFT PHASING, FAM 0',
    'LDE': 'ENGINE - PETROL, 4 CYL, 1.6L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, VVT, VARIABLE CAMSHAFT PHASING, VARIABLE INTAKE MODULE (VIM)',
    'LED': 'ENGINE - PETROL, 4 CYL, 1.6L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, VVT, VARIABLE INTAKE MODULE (VIM), E85 MAX',
    'LHD': 'VEHICLE DRIVE - LEFTHAND DRIVE',
    'LLU': 'ENGINE - PETROL, 4 CYL, 1.6L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, TURBO, PT-JV, 132KW',
    'LPL': 'ENGINE - DIESEL, 4 CYL, 1.7L, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, TURBO-HIGH, HO, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>',
    'LPV': 'ENGINE - DIESEL, 4 CYL, 1.7L, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, TURBO-HIGH, HO, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a> 81KW',
    'LSF': 'ENGINE - DIESEL, 4 CYL, 1.3L, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, TURBO-<a target="_blank" href="https://en.wikipedia.org/wiki/Variable-geometry_turbocharger">VGT</a>',
    'LUD': 'ENGINE - DIESEL, 4 CYL, 1.7L, L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, <a target="_blank" href="https://en.wikipedia.org/wiki/Variable-geometry_turbocharger">VGT</a>, 96KW',
    'LUE': 'ENGINE - ENGINE DIESEL, 4 CYL, 1.7L,L4, <a target="_blank" href="https://en.wikipedia.org/wiki/Common_rail">CRI</a>, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, <a target="_blank" href="https://en.wikipedia.org/wiki/Variable-geometry_turbocharger">VGT</a>, 81KW',
    'LUJ': 'ENGINE - PETROL, 4 CYL, L4, 1.4L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, TURBO HO, ALUM, GME',
    'LUV': 'ENGINE - PETROL, 4 CYL, 1.4L, MFI, <a target="_blank" href="https://en.wikipedia.org/wiki/Overhead_camshaft#Dual_overhead_camshaft">DOHC</a>, TURBO, VVT, ALUM, GME, E85 MAX',
    'M26': 'GEARBOX - MAN 5 SPD, OPEL, 65 MM, 1.96 2ND, 1.323 3RD, 0.946 4TH, 0.756 5TH, F17 (WR)',
    'M36': 'TRANSMISSION - AUTO 6 SPD, AISIN-WARNER, A6-F40, ELECTRONIC (ACTIVE SELECT)',
    'M7Q': 'GEARBOX - MAN 5 SPD, 65 MM, 3.727 1ST, 2.136 2ND, 1.323 3RD, 0,892 4TH ,0.674 5TH, (F17 ER)',
    'MDB': 'MOULDING B/S UPPER - BLACK',
    'MDE': 'MOULDING B/S UPPER - BRIGHT, WINDOW ALL AROUND',
    'MDG': 'GEARBOX - MAN 5 SPD, 180MM, 3.909 1ST, 0.892 5TH, F17',
    'MDK': 'TRANSMISSION - AUTO 6 SPD, AISIN-WARNER, A6-AF40, ELECTRONIC, GEN2',
    'MH7': 'TRANSMISSION - AUTO 6 SPD, HMD, X23FHD',
    'MH8': 'TRANSMISSION - AUTO 6 SPD, HMD, X23F',
    'MYJ': 'GEARBOX - MAN 6 SPD, (F40-6, FWD) 1ST 4.167, SIXTH 0.623',
    'MZ0': 'GEARBOX - MAN 6 SPD, OPEL, 76.5 MM, 3.82 1ST, 0.74 6TH, (M32 WR)',
    'MZ4': 'GEARBOX - MAN 6 SPD, OPEL, 76.5 MM, 3.82 1ST, 0.615 6TH, (M32 WR)',
    'N34': 'STEERING WHEEL - LEATHER, 3 SPOKES',
    'N35': 'STEERING WHEEL - LEATHER, 3 SPOKES, SPORT',
    'N37': 'STEERING COLUMN - TILT, TELESCOPING',
    'N40': 'STEERING - POWER, NON-VARIABLE RATIO',
    'N45': 'STEERING WHEEL - 3 SPOKES',
    'N52': 'STEERING WHEEL - 3 SPOKES, DELUXE',
    'N55': 'STEERING WHEEL - LEATHER, 3 SPOKES, SPORT, ERGONOMIC',
    'NE9': 'EMISSION SYSTEM - EEC 09',
    'NJ0': 'STEERING - POWER, NON-VARIABLE RATIO, ELECTRIC, REDUCED RACK TRAVEL',
    'NJ1': 'STEERING - POWER, NON-VARIABLE RATIO, ELECTRIC',
    'NT3': 'EMISSION SYSTEM - EEC 00',
    'NV7': 'STEERING - POWER, VARIABLE EFFORT',
    'NXC': 'STEERING - POWER, VARIABLE EFFORT, REDUCED RACK TRAVEL',
    'P76': 'TYRE & WHEEL - SPARE, SPACE SAVER, STEEL 16" (DO NOT USE AFTER M.Y. 2011)',
    'PGQ': 'WHEEL - 17 X 7, ALUMINIUM, DESIGN 14 (TBD) GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PL1': 'POWER LEVEL - PERFORMANCE INCREASE LEVEL 1',
    'PWM': 'WHEEL - 16 X 6.5, STEEL, DESIGN2 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PWP': 'WHEEL - 17 X 7, STEEL, DESIGN3 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PWT': 'WHEEL - 17 X 7, STEEL, DESIGN5 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PWX': 'WHEEL - 17 X 7, ALUMINIUM, DESIGN8 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PXS': 'WHEEL - 17 X 7, ALUMINIUM, DESIGN T.B.D, CAMPAIGN MY11 (DO NOT USE AFTER M.Y. 2011)',
    'PZJ': 'WHEEL - 18 X 8, ALUMINIUM, DESIGN9 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PZK': 'WHEEL - 18 X 8, ALUMINIUM, DESIGN10 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PZS': 'WHEEL - 19 X 8, ALUMINIUM, DESIGN 12 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PZT': 'WHEEL - 19 X 8, ALUMINIUM, DESIGN13 TBD GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PZV': 'WHEEL - 18 X 7.5, ALUMINIUM, DESIGN15 (TBD), GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'PZW': 'WHEEL - 18 X 7.5, ALUMINIUM, DESIGN16 (TBD), GLOBAL DELTA (DO NOT USE AFTER M.Y. 2011)',
    'Q1X': 'TYRE ALL - 205/55R16 SL 91H BW HW3',
    'Q5Q': 'TYRE ALL - 225/45R17 SL 91V BW HW3',
    'QAJ': 'TYRE ALL - 215/50R17-91V BW R/ST TL HW4 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QDR': 'TYRE ALL - 225/45R18-91V BW R/ST TL HW4 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGRAMS)',
    'QOG': 'TYRE ALL - 205/60R16-92H BW R/ST TL AL3 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QQ5': 'TYRE & WHEEL - SPARE, FULL SIZE, STEEL - (DO NOT USE AFTER MY 2011)',
    'QQI': 'TYRE ALL - 215/60R16 SL 95V BW HW3',
    'QQT': 'TYRE ALL - 215/60R16 SL 95H BW AL3',
    'QRO': 'TYRE ALL - 235/45R18-94W BW R/ST TL HW4 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QUH': 'TYRE ALL - 225/50R17-94V BW R/ST TL HW4 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QVF': 'TYRE ALL - 205/60R16-92H BW R/ST TL HW3 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QXX': 'TYRE ALL - 235/40R19-92W BW R/ST TL HW4 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QYA': 'TYRE ALL - 225/50R17-94V BW R/ST TL AL3 (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QYW': 'TYRE ALL - P215/60R16-94S BW R/PE ST TL ALS (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QZQ': 'TYRE ALL - 215/60R16-95H BW R/ST TL HW3 (LOW ROLL RESISTANCE) (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'QZZ': 'TYRE ALL - 225/50R17-94V BW R/ST TL HW4 (LOW ROLL RESISTANCE) (DO NOT USE AFTER 2011 ON NEW/MAJOR PROGS)',
    'RHD': 'VEHICLE DRIVE - RIGHTHAND DRIVE',
    'RSB': 'WHEEL - 17 X 7.0, J, ALUMINIUM, DESIGN 1',
    'RT4': 'WHEEL - 18 X 8.0, J, ALUMINIUM, DESIGN 1',
    'RV2': 'WHEEL - 19 X 8.0, J, ALUMINIUM, DESIGN 4',
    'RWK': 'ACCESSORY - BODY SIDE MOULDINGS, PAINTED',
    'RWR': 'ACCESSORY - CAMERA, REAR VISION',
    'RX6': 'ACCESSORY - CARRIER BICYCLE, TRAILER HITCH MOUNTED',
    'RXH': 'ACCESSORY - CENTRE CAP, WHEEL, DESIGN 1',
    'RXM': 'ACCESSORY - CHILD SEAT - AGE GROUP 0+',
    'RYT': 'ACCESSORY - FIRST AID KIT',
    'RYV': 'ACCESSORY - FLOOR MATS, ECONOMY CARPET',
    'RZ1': 'ACCESSORY - FLOOR MATS, VELOUR',
    'RZG': 'ACCESSORY - WINTER WHEEL PKG - 17" STEEL',
    'RZW': 'ACCESSORY - HARNESS, TRAILER HITCH',
    'RZY': 'ACCESSORY - HARNESS, WIRING',
    'S07': 'ACCESSORY - HEATER KIT, PARKING',
    'S0M': 'ACCESSORY - ILLUMINATED DOOR SILLS',
    'S1Q': 'ACCESSORY - VOLTAGE PROVIDER - TRAILER HARNESS',
    'S5W': 'ACCESSORY - ORGANISER PANEL, SEAT BACK',
    'S5X': 'ACCESSORY - PARK ASSIST, REAR',
    'S6B': 'ACCESSORY - PERIPHERAL DEVICE INTERFACE MODULE KIT',
    'S6H': 'ACCESSORY - PROTECTIVE FILM - BONNET',
    'SAI': 'ACCESSORY - SILL PLATES, STAINLESS',
    'SAO': 'ACCESSORY - SMOKERS PACKAGE',
    'SAP': 'ACCESSORY - CHILD SEAT - AGE GROUP 1',
    'SB6': 'ACCESSORY - SPOILER, ROOF',
    'SBZ': 'ACCESSORY - SPORT PEDAL KIT',
    'SCQ': 'ACCESSORY - SUN SHADES, REAR SIDE WINDOWS',
    'SDB': 'ACCESSORY - CHILD SEAT - AGE GROUP 2/3',
    'SDD': 'ACCESSORY - TRAILER HITCH, FIXED',
    'SDE': 'ACCESSORY - TRAILER HITCH - REMOVABLE',
    'SDH': 'ACCESSORY - FLOOR MAT COVER',
    'SDI': 'ACCESSORY - TRIANGLE, REFLECTIVE',
    'SDK': 'ACCESSORY - UHP (UNIVERSAL HANDS FREE PHONE) CRADLE',
    'SE2': 'ACCESSORY - WHEEL, 17", ALUMINIUM, DESIGN 3',
    'SE6': 'ACCESSORY - WHEEL, 18", ALUMINIUM, DESIGN 3',
    'SED': 'ACCESSORY - WHEEL, 19", ALUMINIUM, DESIGN 1',
    'SF4': 'ACCESSORY - WHEEL COVERS - ALTERNATE DESIGN',
    'SFE': 'ACCESSORY - WHEEL LOCKS',
    'SFO': 'ACCESSORY - WINTER WHEEL PACKAGE, 16" STEEL',
    'SFP': 'ACCESSORY - WINTER WHEEL PACKAGE, 17" ALUMINIUM',
    'T39': 'LAMP - INDICATOR, AUX',
    'T3N': 'LAMP SYSTEM - DAYTIME RUNNING, SEPARATE CAVITY',
    'T3U': 'LAMP - FRT FOG',
    'T3X': 'LAMP SYSTEM - DAYTIME RUNNING, REGULAR INTENSITY DIPPED BEAM',
    'T43': 'SPOILER - RR',
    'T4A': 'HEADLAMPS - HALOGEN',
    'T4F': 'HEADLAMPS - HIGH INTENSITY DISCHARGE',
    'T74': 'HEADLAMPS CONTROL - AUTOMATIC, DELAY',
    'T79': 'LAMP - FOG, RR',
    'T94': 'HEADLAMPS CONTROL - LH RULE OF THE ROAD',
    'T95': 'HEADLAMP CONTROL - BEAM, DIRECTIONAL (AFL)',
    'TBT': 'PLANT CODE - ST.PETERSBURG, RUSSIA',
    'TPX': 'GRILLE - RADIATOR, BLACK, W/COLOURED BAR',
    'TQ5': 'SENSOR - HEADLAMP HIGH BEAM AUTO CONTROL',
    'TR0': 'LAMP - INTR, ROOF, RR, COURTESY & DUAL READING',
    'TR6': 'HEADLAMPS CONTROL - LEVELING SYSTEM, MANUAL',
    'TR7': 'HEADLAMP CONTROL - LEVELLING SYSTEM, AUTOMATIC, STATIC',
    'TS6': 'LAMP - STOP, HIGH LEVEL',
    'TTO': 'RADIO EQUIPMENT - COOLING SYSTEM',
    'TTW': 'HEADLAMPS CONTROL - AUTOMATIC ON-OFF, TUNNEL DETECTION',
    'TTX': 'RADIO EQUIPMENT - AUX CONNECTOR (LINE IN)',
    'U04': 'HORN - SINGLE NOTE',
    'U07': 'HORN - FANFARE',
    'U18': 'SPEEDOMETER - INST, KILO',
    'U65': 'SPEAKER SYSTEM - 7, PREMIUM',
    'U66': 'SPEAKER SYSTEM - 7, CUSTOM',
    'U68': 'DISPLAY - DRIVER INFO CENTRE',
    'U71': 'ANTENNA - ROOF, RADIO',
    'U74': 'ANTENNA - RADIO - DELETE',
    'U91': 'AERIAL - SHORT, ROOF, RADIO',
    'UAG': 'INFOTAINMENT DISPLAY - GRAPHIC INFO DISPLAY (GID), VAR 1',
    'UBT': 'DIGITAL AUDIO SYSTEM - BROADCAST, TEXT',
    'UC3': 'CONTROL - STEERING WHEEL, RADIO & PHONE, REDUNDANT CONTROLS',
    'UCU': 'RADIO - AM/FM STEREO, SD NAV, CD-ROM, CAF, USB, RSA, TMC (GME VERSION)',
    'UCW': 'RADIO - AM/FM STEREO, SD NAV, CD-ROM, CAF, USB, RSA, VOICE REC (GME VERSION)',
    'UD5': 'SENSOR INDICATOR - PARKING ASSIST',
    'UD7': 'SENSOR INDICATOR - REAR PARKING ASSIST',
    'UDB': 'DISPLAY INSTRUMENT - DRIVER INFO ENHANCED (SEGMENTED)',
    'UDC': 'DISPLAY INSTRUMENT - DRIVER INFO ENHANCED (ONE COLOUR GRAPHIC)',
    'UDK': 'INFOTAINMENT DISPLAY - COLOUR INFO DISPLAY (CID) 7", QVGA',
    'UE1': 'COMMUNICATION SYSTEM - VEHICLE, G.P.S. 1',
    'UEC': 'SENSOR INDICATOR - AUTOMATIC AIR RECIRCULATION',
    'UFD': 'INFOTAINMENT DISPLAY - TIME, EXTERNAL TEMP, RADIO',
    'UFL': 'SENSOR INDICATOR - LANE DEPARTURE WARNING',
    'UH0': 'INDICATOR - SEAT BELT WARNING , LH',
    'UH1': 'INDICATOR - SEAT BELT WARNING , RH',
    'UH5': 'INDICATOR - SEAT BELT WARNING, REAR SEAT',
    'UJN': 'TYRE PRESS INDICATOR - AUTO LEARN',
    'ULS': 'LOCK CONTROL - STEERING COLUMN',
    'UMN': 'SPEEDOMETER - INST, MILES & KILO, MILES ODOMETER',
    'UPH': 'WIRELESS INTERFACE - SHORT RANGE, VOICE REC, SMS',
    'UPI': 'WIRELESS INTERFACE - SHORT RANGE, VOICE REC, LOW SPEED, GMLAN',
    'UPJ': 'WIRELESS INTERFACE - SHORT RANGE, VOICE REC, SMS, EMBEDDED PHONE',
    'UQ9': 'SPEAKER SYSTEM - (- DELETE)',
    'UQA': 'SPEAKER SYSTEM - PREMIUM AUDIO BRANDED WITH AMPLIFIER',
    'URC': 'SWITCH - FLEXRIDE MODE SYSTEM',
    'US3': 'ANTENNA - DIVERSITY',
    'UTJ': 'THEFT DETERENT - ELECTRICAL, UNAUTHORIZED ENTRY',
    'UTR': 'ALARM, HORN - CONTENT THEFT DETERENT, SELF POWERED',
    'UTT': 'THEFT DETERENT - BODY SECURITY CONTENT',
    'UTU': 'SENSOR, VEHICLE - INCLINATION',
    'UTV': 'SENSOR, VEHICLE - INTERIOR MOVEMENT',
    'UVD': 'SWITCH - STEERING WHEEL, HEATED',
    'UVT': 'CAMERA - LANE DEPARTURE WARNING, TRAFFIC SIGN RECOGNITION (DO NOT USE AFTER M.Y. 2011 USE UVW)',
    'UVW': 'SENSOR INDICATOR - TRAFFIC SIGN RECOGNITION BASIC',
    'UW4': 'SPEAKER SYSTEM - 4, CUSTOM',
    'UWI': 'TELEPHONE - MOBILE, CRADLE, ANTENNA & RECHARGE, FLOOR CONSOLE',
    'UXW': 'RADIO - AM/FM STEREO, NAV, CD-ROM, CAF, USB, RSA, TMC, (GME VERSION)',
    'UXX': 'RADIO - AM/FM STEREO, NAV, DVD-ROM, CAF, USB, RSA, TMC, (GME VERSION)',
    'UYB': 'RADIO - AM/FM STEREO, CD-ROM, CAF, RSA (GME/ME/TAIWAN VERSION)',
    'UYI': 'RADIO - AM/FM STEREO, CDX-ROM, CAF, RSA, MUSIC NAVIGATOR (GME/ME/TAIWAN VERSION)',
    'UZZ': 'RADIO - AM/FM STEREO, CD-ROM, CAF, RSA, MUSIC NAVIGATOR (GME/ME/TAIWAN VERSION)',
    'V2O': 'PANEL CENTRE - ONE LAYER PAINT DARK PEARL',
    'V3X': 'PANEL CENTRE - DUAL LAYER PAINT SILVER DUST',
    'V4L': 'PANEL CENTRE - DUAL FOIL LIQUID PALLADIUM/DARK MATRIX',
    'V5U': 'PANEL CENTRE - DUAL FOIL PIANO BLACK & LIQUID PALLADIUM',
    'V9K': 'FUEL - DIESEL-LOW QUALITY',
    'VAV': 'ACCESSORY - FLOOR MATS - ALL WEATHER',
    'VFB': 'PROTECTOR - BODY, QTR OUTER PANEL DAMAGE',
    'VG9': 'PROTECTOR - WAX, EXTERIOR BODY',
    'VGC': 'PROTECTOR - FILM, PAINT ETCH PREVENTIVE',
    'VHY': 'PROTECTOR - BODY SHEET METAL, HIGH CORROSION PREVENTIVE',
    'VK8': 'HOLDER - EYEGLASSES',
    'VLL': 'ACCESSORY - CROSS RAILS - ROOF RACK, REMOVABLE',
    'VNF': 'ISOLATOR - BATTERY',
    'VPQ': 'VEHICLE PREPARATION - REMOVER, PROTECTIVE SHIPPING WAX',
    'VQ9': 'TRAILER HITCH - REMOVABLE HOOK, HEAVY DUTY',
    'VQK': 'ACCESSORY - SPLASH GUARDS - CUSTOM MOULDED',
    'VS1': 'FIRST AID KIT - VEHICLE',
    'VTD': 'ACCESSORY - GROUND EFFECTS PACKAGE',
    'VTW': 'COMPARTMENT - STOWAGE, I/P, W/LID',
    'VTY': 'ACCESSORY - CARRIER, BICYCLE - REAR END CARRIER EXTENSION',
    'VY7': 'KNOB - TRANS CONT LEVER, LEATHER',
    'W72': 'SALES PACKAGE - DRIVING SCHOOL',
    'W2D': 'ACCESSORY - CARGO NET',
    'W2E': 'SEAT - FRT BKT, RECARO',
    'W2V': 'ORNAMENTATION - LETTERING, VAR - DELETE',
    'W4D': 'SALES PACKAGE - CIVIL AUTHORITY (DO NOT USE AFTER M.Y. 2009)',
    'W9X': 'CONVERSION NAME PLT - "SRI"',
    'WBP': 'SALES PACKAGE - APPEARANCE',
    'WTC': 'TYRE & WHEEL - INFLATOR KIT (DO NOT USE AFTER M.Y. 2011)',
    'XFE': 'FUEL ECONOMY - EXTRA FUEL ECONOMY',
    'XJ2': 'CHASSIS - SPORT, LOWERED',
    'XJ3': 'CHASSIS - SPORT, LOWERED, MODIFIED',
    'XL4': 'CHASSIS - PROTECTION KIT, ENGINE COMPARTMENT',
    'XL8': 'FREQUENCIES RATING - 433 MHZ',
    'XQ2': 'EQUIPMENT - VAUXHALL',
    'Y67': 'DISPLAY - REMINDER PACKAGE',
    'Z1V': 'EQUIPMENT - ADDITIONAL KEY',
    'Z3S': 'CONVERSION NAME PLT - "ELITE"',
    'ZP7': 'SEATING ARRANGEMENT - 7 PASS',
  },
  pl: {
    //RPO
    '2EB': 'Pakiet Zimowy',
    '2EC': 'Pakiet "Zimowy 2"',
    '4AA': 'Listwy ozdobne Piano Black, czarne',
    '5PB': 'Felgi aluminiowe 18 x 7,5, 5 podwójnych ramion',
    '5PC': 'Felgi aluminiowe 18 x 7,5, Bi-Color',
    A51: 'Fotel kierowcy z regulacją wysokości',
    A53: 'Fotel pasażera regulowany ręcznie w 8 kierunkach (przód-tył, góra-dół, pochylenie oparcia, "kołyska")',
    A64: 'Tylna kanapa dzielona w stosunku 40/60',
    A69: 'Dodatkowe napinacze przednich pasów bezpieczeństwa po stronie klamer',
    A74: 'Funkcja zapamiętywania ustawienia fotela kierowcy',
    AE4: 'Przednie fotele typu "sport"',
    AEF: 'Elektryczne szyby przednie',
    AER: 'Elektryczne szyby, tył',
    AF6: 'Elektryczna, 8-kierunkowa regulacja fotela kierowcy z funkcją masażu',
    AG1: 'Pakiet "Elektryczny Fotel Kierowcy AGR"',
    AG5: 'Ręczna regulacja fotela pasażera w 4 kierunkach (przód-tył, pochylenie oparcia)',
    AH4: 'Fotel kierowcy regulowany ręcznie w 8 kierunkach (przód-tył, góra-dół, pochylenie oparcia, "kołyska")',
    AHC: 'Regulacja długości siedziska fotela kierowcy',
    AHE: 'Regulowane i elektrycznie sterowane boczne elementy oparcia kierowcy',
    AHF: 'Regulacja długości siedziska fotela pasażera',
    AHN: 'Zaczepy Isofix na oparciach tylnych foteli',
    AJC: 'Zagłówki przednich foteli regulowane góra/dół (nieaktywne)',
    AKO: 'Tylne szyby przyciemniane, typu "Privacy"',
    AKP: 'Szyby boczne pochłaniające promieniowanie cieplne',
    AKX: 'Szyba przednia odbijająca promieniowanie cieplne',
    AP9: 'Siatka oddzielająca przestrzeń bagażową od pasażerskiej za 2. rzędem siedzeń',
    AQ2: 'Flex Organizer (szyny montażowe, 4 adaptery/haki, przegroda z siatki, siatki boczne)',
    AQP: 'Centralny zagłówek z tyłu',
    ARJ: 'Tylna kanapa dzielona 40/20/40',
    ASV: 'Czujnik wilgotności',
    ATH: 'System automatycznego sterowania zamkami drzwi i zapłonem Open&Start',
    AU3: 'Zdalnie sterowany zamek centralny',
    AVJ: 'Open & Start - System automatycznego odblokowywaniazamków przednich drzwi I sterowania zapłonem',
    AVK: 'Elektryczna regulacja podparcia lędźwiowego fotela kierowcy (4 kierunki)',
    AVU: 'Elektryczna regulacja podparcia lędźwiowego fotela pasażera (4 kierunki)',
    AWO: '3-punktowy pas bezpieczeństwa, centralne miejsce kanapy tylnej',
    AXG: 'Elektryczne szyby przednie',
    AXJ: 'Typ pojazdu – osobowy',
    AYC: 'Przednie, boczne i kurtynowe poduszki powietrzne dla kierowcy i pasażera',
    B34: 'Dywaniki welurowe na przód',
    B35: 'Dywaniki welurowe na tył',
    BCX: 'Podsufitka w kolorze czarnym',
    BDP: 'Dyfuzor 2 zapachów AirWellness',
    BS1: 'Pakiet "Wyciszenie"',
    BTM: 'Bezkluczykowe zapalanie silnika',
    C32: 'Dodatkowe elektryczne ogrzewanie w systemie nawiewu powietrza',
    C67: 'Klimatyzacja sterowana recznie',
    C91: 'Lampka w podsufitce (przód)',
    C93: 'Dodatkowe oświetlenie wnętrza',
    C99: 'Wyłącznik poduszki powietrznej pasażera',
    CE1: 'Czujnik deszczu',
    CF5: 'Okno dachowe (zmiana koloru podsufitki z czarnego na jasnoszary)',
    CHL: 'Chromowana listwa z logo z przodu',
    CJ2: 'Klimatyzacja elektroniczna dwustrefowa',
    CKL: 'Wewnętrzna strona klapy bagażnika w kolorze czarnym',
    CR6: 'Kraj – Polska',
    CWH: 'Pakiet "Czarny Dach" (dach oraz obudowy lusterek w kolorze czarnym)',
    D31: 'Regulowane lusterko wsteczne',
    D6i: 'Podświetlane lusterka w osłonach przeciwsłonecznych',
    D75: 'Klamki zewnętrzne w kolorze nadwozia',
    DA5: 'Podłokietnik na tylnej kanapie',
    DBU: 'Konsola centralna z przesuwanym podłokietnikiem i zamykanym schowkiem',
    DD8: 'Lusterko wewnętrzne światłoczułe',
    DP6: 'Lusterka zewnętrzne w kolorze nadwozia',
    DT4: 'Pakiet palacza (zapalniczka i wyjmowana popielniczka)',
    DWE: 'Elektrycznie sterowane i podgrzewane lusterka zewnętrzne w kolorze nadwozia, składane ręcznie',
    DWF: 'Elektrycznie składane lusterka boczne',
    E3C1: 'Pojedyńcza widoczna końcówka rury wydechowej',
    E3C2: 'Podwójna widoczna końcówka rury wydechowej',
    EA1: 'Kieszeń z tyłu fotela kierowcy',
    EA2: 'Kieszeń z tyłu fotela pasażera',
    FX3: 'ESP, ABS, układ wspomagania ruszania na pochyłościach HSA',
    G6R: 'Zielony - Emerald, perłowy',
    G7I: 'Granatowy - Agean, bazowy',
    GAN: 'Srebrny - Sovereign, metaliczny',
    GAZ: 'Biały - Summit, bazowy',
    GB9: 'Czarny - Mineral, metaliczny',
    GDB: 'Brązowy - Dark Caramel, metaliczny',
    GDX: 'Niebieski - Darkmoon, metaliczny',
    GG7: 'Czerwony - Absolute, brylantowy',
    GNG: 'Tylne zawieszenie z drążkami Watt\'a',
    GR5: 'Szary - Cosmic, metaliczny',
    GWD: 'Srebrny - Magnetic, metaliczny',
    IO6: 'Navi 900 IntelliLink (Bluetooth)',
    iOB: 'System multimedialny R 4.0 IntelliLink (Bluetooth)',
    J69: 'Ręczny hamulec postojowy',
    J71: 'Hamulec postojowy sterowany elektrycznie',
    JF5: 'Aluminiowe nakładki na pedały',
    K33: 'Tempomat z ogranicznikiem prędkości',
    K38: 'Aktywny tempomat z funkcją hamowania awaryjnego',
    KA1: 'Podgrzewane fotele przednie',
    KA6: 'Podgrzewane fotele tylne (2 skrajne siedziska)',
    KCL: 'Ogrzewanie na drugi rząd siedzeń (nawiewy w podłodze)',
    KL9: 'System START/STOP',
    KSA: 'Aktywny tempomat z funkcją hamowania awaryjnego & Stop&Go',
    KTF: 'Drugi kluczyk składany (czarny)',
    KTI: 'Zestaw naprawczy do opon',
    KTM: 'Kluczyk główny składany, kluczyk zapasowy sztywny',
    KU1: 'Fotel kierowcy wentylowany',
    KU3: 'Fotel pasażera wentylowany',
    LHD: 'Kierownica z lewej strony',
    LP4A: 'Pakiet Enjoy Biznes',
    LP4B: 'Pakiet Enjoy Biznes Plus',
    LP4E: 'Pakiet Kierowcy Plus',
    LPZ9: 'Pakiet "Kierowcy Plus"',
    LVL: 'DIESEL, 4 CYL, 1.6L, <a target="_blank" href="https://pl.wikipedia.org/wiki/Common_rail">CRI</a>, <a target="_blank" href="https://pl.wikipedia.org/wiki/OHC#DOHC">DOHC</a>, <a target="_blank" href="https://pl.wikipedia.org/wiki/Turbospr%C4%99%C5%BCarka_o_zmiennej_geometrii_%C5%82opatek">VGT</a>',
    MCY: 'Wejście USB',
    MDB: 'Czarna listwa boczna zamiast chromowanej',
    MDQ: 'Chromowana listwa wzdłuż górnej linii okien',
    N34: 'Kierownica trójramienna pokryta skórą',
    N35: 'Kierownica sportowa spłaszczona u dołu',
    N37: 'Regulacja kolumny kierownicy w 2 płaszczyznach',
    NJ1: 'Elektryczne wspomaganie układu kierowniczego',
    PJE: 'Felgi Aluminiowe 7.0 x 17, 10-ramienne, srebrne',
    PWN: 'Obręcze kół strukturalne 16"',
    Q5P: 'Opony 225 / 45 R17 SL - 91V',
    Q5Y: 'Opony 225 / 40 R18 XL - 92W',
    QO3: 'Obręcze kół ze stopów lekkich 16”',
    RHD: 'Kierownica z prawej strony',
    RM5: 'Felgi aluminiowe 17 x 7.5, 5 podwójnych ramion',
    RRL: 'Obręcze kół stalowe 15"',
    RRY: 'Obręcze kół stalowe 16"',
    RSE: 'Felgi aluminiowe 17 x 7,5, 5-ramienne, czarne',
    RT0: 'Felgi aluminiowe 16 x 7.0, 5 podwójnych ramion',
    RU9: 'Zapasowe koło pełnowymiarowe, stalowe 16”',
    SBK: 'Napinacze tylnych pasów',
    SJQ: 'Dojazdowe koło zapasowe 16 x 4.0',
    SR1: 'Pakiet "Fotel Ergonomiczny Kierowcy"',
    SRY: 'Pakiet "Fotel Ergonomiczny Kierowcy i Pasażera"',
    T2L: 'Lotki na tylnej szybie',
    T3S: 'Światła do jazdy dziennej typu LED',
    T3U: 'Światła przeciwmgłowe - przednie',
    T43: 'Tylny spojler',
    T4A: 'Przednie lampy halogenowe',
    T4L: 'Matrycowe reflektory LED IntelliLux®',
    T74: 'Światła z funkcją opóźnionego wyłączania',
    T79: 'Swiatła przeciwmgielne - tył',
    T95: 'Światła AFL',
    T9T: 'Oznaczenie "EcoFlex"',
    TAP4: 'Tapicerka Sienna / Morocana, Jet Black, skóra naturalna łączona ze skórą sztuczną, czarna',
    TAQL: 'Tapicerka Formula/Atlantis, Jet Black, materiałowa, czarna',
    TAU3: 'Tapicerka Alcantara Jet Black',
    TC2: 'Elektrycznie otwierane i zamykane drzwi bagaznika',
    TG5: 'Odtwarzacz CD i mp3 w schowku na rękawiczki',
    TR0: 'Lampki do czytania z tyłu',
    TR6: 'Ręczna regulacja wysokości przednich świateł',
    TR7: 'Automatyczne poziomowanie reflektorów',
    TSP: 'Pakiet "Oświetlenie Wnętrza"',
    TSQ: 'Pakiet "Dobrej Widoczności"',
    TTW: 'Automatyczny włącznik świateł z czujnikiem tunelu',
    U04: 'Pojedynczy sygnał klaksonu',
    U25: 'Lampka w bagażniku',
    U2Q: 'Tuner radia cyfrowego DAB/ DAB+/ DMB-R',
    U91: 'Antena dachowa standardowa, Obsługa za pomocą funkcji komend głosowych wbudowanej w smartfonie',
    UC3: 'Sterowanie radiem z koła kierownicy',
    UD5: 'Czujniki parkowania przód i tył',
    UD7: 'Czujniki parkowania - tył',
    UDC: 'Wyświetlacz graficzny pomiędzy zegarami',
    UDD: 'Wyświetlacz pomiędzy zegarami - komputer pokładowy 4,2"<br />\
Zintegrowana funkcja komend głosowych',
    UDQ: 'Ostrzeżenie o martwym polu w lusterkach',
    UE1: 'System OnStar',
    UE4: 'Wskaźnik odległości od poprzedzającego pojazdu',
    UEU: 'Ostrzeganie przed kolizją z poprzedzającym pojazdem',
    UFQ: 'System parkowania "Advanced Park Assist II"<br />\
Czujniki parkowania na przód i tył',
    UGE: 'Tylne lampy LED',
    UH5: 'System przypominania o zapięciu pasów z tyłu',
    UHG: 'Ostrzeżenie o niezapięciu pasa kierowcy',
    UHH: 'Ostrzeżenie o niezapięciu pasa pasażera',
    UHX: 'Układ ostrzegania przed niezamierzonązmianą pasa ruchu z układemutrzymania pasa ruchu',
    UHY: 'Systemem automatycznego hamowaniaprzy niskich prędkościach',
    UJ2: 'Wskaźnik zużycia oleju',
    UJC: 'Przycisk zmiany trybu jazdy Sport',
    UJM: 'Czujnik ćiśnienia w oponach z ręczną kalibracją',
    UK4: 'Funkcja wyświetlania ciścnienia w podziale na poszczególne koła',
    US3: 'Antena "płetwa rekina", czarna (w przypadku zamówienia z UE1 - w kolorze nadwozia)<br />\
Fabryczny system nawigacji (mapa europy)',
    USS: '2 wejścia USB na tylnej części konsoli centralnej',
    UTJ: 'Alarm',
    UVC: 'Kamera cofania',
    UVD: 'Podgrzewana kierownica',
    UVG: 'Automatyczne sterowanie światłami drogowymi',
    UVX: 'Rozpoznawanie znaków ograniczenia prędkości i zakazu wyprzedzania',
    UY4: 'Nawigacja dla R 4.0 IntelliLink',
    UZ6: '6 głośników<br />\
8-calowy ekran dotykowy',
    V6C: 'Ozdobne rengi dachowe, czarne',
    V6D: 'Ozdobne relingi dachowe chromowane',
    VQ9: 'Hak holowniczy',
    VRi: 'Aktywne przesłony grilla',
    WDH: 'Pakiet "Sport OPC":<br />\
Przedni zderzak OPC<br />\
Tylny zderzak OPC<br />\
Spojlery boczne OPC w kolorze nadwozia ',
    WLI: 'Moduł PowerFlex (wielofunkcyjny moduł, mocowany na konsoli centralnej, umożliwiający podłączenie akcesoriów)',
    WLQ: 'Uchwytem na smartfona',
    WPG: 'Pakiet "Wygodny"',
    XK0: 'Pakiet wnętrze OPC Line',
    Y67: 'Komputer pokładowy',
    ZQ2: 'Pakiet "Asystent Kierowcy 1"',
    ZQ3: 'Pakiety "Asystenta Kierowcy 2"',
  }
};

function translate(str) {
  if (translations[config.lang][str]) {
    return translations[config.lang][str];
  }
  else if (config.lang !== 'en' && translations.en[str]) {
    return translations.en[str];
  }
  return str;
}

function translateOptions(optionCodes) {
  var options = [];
  if (optionCodes) {
    for (var i = 0; i < optionCodes.length; i++) {
      options.push({ key: optionCodes[i], name: translate(optionCodes[i]) });
    }
  }
  return options;
}

function fillStages(histData) {
  var statuses = [
    { stage: 'Zamawianie', statuses: [] },
    { stage: 'Ustawianie produkcji', statuses: [] },
    { stage: 'Produkcja', statuses: [] },
    { stage: 'Transport', statuses: [] },
    { stage: 'Sprzedaż', statuses: [] }
  ];

  for (var i = 0; i < histData.length; i++) {
    switch (parseInt(histData[i].item.vehicleDetail.lastVehicleEvent)) {
      case 20:
        statuses[0].statuses.push({ status: 20, description: 'Przyjęcie zamówienia', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 21:
        statuses[0].statuses.push({ status: 21, description: 'Przetwarzanie zamówienia', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 25:
        statuses[1].statuses.push({ status: 25, description: 'Ustawianie zamówienia do produkcji', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 30:
        statuses[1].statuses.push({ status: 30, description: 'Oczekiwanie na zwolnienie do produkcji', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 32:
        statuses[1].statuses.push({ status: 32, description: 'Zwolnienie do produkcji', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 33:
        statuses[2].statuses.push({ status: 33, description: 'Przyjęcie do produkcji przez fabrykę', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 35:
        statuses[2].statuses.push({ status: 35, description: 'Samochód na linii produkcyjnej', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 38:
        statuses[2].statuses.push({ status: 38, description: 'Samochód wyprodukowany', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 40:
        statuses[2].statuses.push({ status: 40, description: 'Samochód przekazany do sprzedarzy', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 42:
        statuses[3].statuses.push({ status: 42, description: 'Samochód opuścił bamy fabryki', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 43:
        statuses[3].statuses.push({ status: 43, description: 'Samochód na centralnym składzie dystrybucyjnym', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 44:
        statuses[3].statuses.push({ status: 44, description: 'Samochód wysłany do Polski', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 48:
        statuses[3].statuses.push({ status: 48, description: 'Samochód na składzie w Polsce', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 49:
        statuses[3].statuses.push({ status: 49, description: 'Samochód wysłany do dealera', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 58:
        statuses[4].statuses.push({ status: 58, description: 'Samochód dojechał do dealera', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      case 60:
        statuses[4].statuses.push({ status: 60, description: 'Samochód sprzedany', eventCodeUpdateTimestamp: prettyDate(histData[i].item.vehicleDetail.eventCodeUpdateTimestamp), estimatedDeliveryDateTime: prettyDate(histData[i].item.vehicleDetail.estimatedDeliveryDateTime) });
        break;
      default:
        console.log(histData[i].item.vehicleDetail.lastVehicleEvent);
        break;
    }
  }
  statuses.reverse();

  return statuses;

}

function prettyDate(dateString) {
  if (!dateString) { return null }
  var date = new Date(dateString);
  var d = date.getDate();
  if (d < 10) d = '0' + d;
  var m = date.getMonth() + 1;
  if (m < 10) m = '0' + m;
  var y = date.getFullYear();

  return y + '-' + m + '-' + d;
}

function getColour(optionCodes, defaultColour) {
  var colours = ['G6R', 'G7I', 'GAN', 'GAZ', 'GB9', 'GDB', 'GDX', 'GG7', 'GR5', 'GWD'];
  if (optionCodes) {
    for (var i = 0; i < colours; i++) {
      if (-1 !== optionCodes.indexOf(colours[i])) {
        return translate(colours[i]);
      }
    }
  }
  return defaultColour;
}
