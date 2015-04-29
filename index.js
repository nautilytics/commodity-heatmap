// Get futures quote data from Agricharts and create a treemap object from the quotes
var express = require('express')
    , request = require('request')
    , _ = require('lodash')
    , app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'jade');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// set the home page route
app.get('/', function (req, res) {
    res.render('index', {port: port});
});

var commodityCodes = {
        //'Grains': {
        //    'C': {}, 'S': {}, 'W': {}, 'KW': {}, 'MW': {}, 'SM': {}, 'BO': {}, 'RR': {},
        //    'RS': {}, 'AB': {}, 'O': {}
        //}
        'Livestock': {'LC': {}, 'FC': {}, 'LH': {}, 'DA': {}, 'PB': {}, 'DB': {}},
        // [broken] 'Softs': {'CC': {}, 'KC': {}, 'CT': {}, 'LB': {}, 'SB': {}, 'OJ': {}},
        'Energies': {'CL': {}, 'AK': {}, 'HO': {}, 'NG': {}, 'RB': {}},
        'Metals': {'HG': {}, 'GC': {}, 'PA': {}, 'PL': {}, 'SI': {}}
    },
    months = ["Jan", "Feb", "Mar", "Apr", "May",
        "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Go through all sectors and retrieve the quote data for each symbol
var sectorKeys = _.keys(commodityCodes);
var allQuoteKeys = _.flatten(_.map(sectorKeys, function (d) {
    return _.keys(commodityCodes[d]).map(function (e) {
        return {
            key: d,
            value: e,
            url: "http://www.agricharts.com/marketdata/jsquote.php?varname=quotes&allsymbols=" + e + "&user=&pass=&display_ice="
        };
    })
}));

app.get('/getQuotes', function (req, res) {
    var xs = getQuotes(allQuoteKeys, function (xs) {
        res.status(200).json(xs);
    });
});

app.listen(port, function () {
    console.log('Our app is running on http://localhost:' + port);
});

var timeStamp;

function getQuotes(collection, callback) {
    timeStamp = new Date().toLocaleString();
    var coll = collection.slice(0); // clone collection
    (function insertOne() {
        var currentKey = coll.pop();
        try {

            var options = {
                url: currentKey.url,
                headers: {
                    'User-Agent': 'request'
                }
            };
            request(options, function (error, response, body) {

                if (!error && response.statusCode == 200) {
                    eval(body);
                    commodityCodes[currentKey.key][currentKey.value] = quotes; // quotes is name of jsonp variable
                    if (!coll.length) {
                        var data = formatOutputDataToTreemap(commodityCodes);
                        data['timestamp'] = timeStamp;
                        callback(data);
                    } else {
                        insertOne();
                    }
                }
            });
        } catch (exception) {
            callback(exception);
        }
    })();
}

function formatOutputDataToTreemap(allCommodityData) {
    // Format the output data into a parent-child structure ready for treemap

    var overallName = "Commodities",
        root = {},
        nearestToExpirationContracts = []
        , validCommoditySectors = _.keys(allCommodityData);

    // Get all tickers of contracts nearest to expiration
    _.forEach(validCommoditySectors, function (d) { // sectors
        _.forEach(_.keys(allCommodityData[d]), function (e) { // commodity

            var allContracts = _.map(_.keys(allCommodityData[d][e]), function (k) { // contract tickers
                var v = allCommodityData[d][e][k];
                return {contract: k, date: v.shortmonth};
            });

            if (allContracts.length > 0) {
                var nearestTickerObject = allContracts.sort(sortDateAscending)[0];
                if (nearestTickerObject.date) {
                    nearestToExpirationContracts.push(nearestTickerObject.contract);
                }
            }
        });
    });

    // Save the parent child relationship into a JSON object
    root["name"] = overallName;

    var allChildren = [];
    _.forEach(validCommoditySectors, function (f) {
        var children = {};
        children['name'] = f;
        var grandChildren = [];
        _.keys(allCommodityData[f]).forEach(function (k) {
            var v = allCommodityData[f][k];
            if (v) { // only add non-null commodities
                var quoteLevel = {};
                var name;
                quoteLevel["children"] = _.map(_.values(v), function (e, i) {
                    name = e.name;
                    var temp = e.shortmonth.split(' ');
                    e.name = temp[0] + " " + temp[1].slice(2, 4); // truncate year to only two digits
                    e.index = i;
                    e.commodity = name;
                    return e;
                });
                quoteLevel['ticker'] = k;
                quoteLevel["name"] = name;
                grandChildren.push(quoteLevel);
            }
        });
        children["children"] = grandChildren;
        allChildren.push(children);
    });
    root["children"] = allChildren;
    root["timestamp"] = timeStamp;
    root["NearestToExpirationContracts"] = nearestToExpirationContracts;
    return root;
}

function sortDateAscending(a, b) {

    var aMonth = a.date,
        bMonth = b.date;

    var a1 = aMonth.split(' '),
        b1 = bMonth.split(' ');

    var aDate = new Date(a1[1], months.indexOf(a1[0]), 1),
        bDate = new Date(b1[1], months.indexOf(b1[0]), 1);

    return aDate - bDate;
}