#!/bin/env node

var opt = require('node-getopt').create([
  ['p' , 'port=9091' , 'Port where transmission is running at'],
  ['H' , 'host=127.0.0.1' , 'Host where transmission is running at'],
  ['a' , 'auth=', 'Authenitcation string for transission given in user:pass']
  ['t' , 'type=', 'Only accept results from a cetrain type (batch or eps)'],
  ['b' , 'best' , 'Skip manual pick and do what\'s best for me'],
  ['q' , 'qaulity=', 'Only accept results from certain qaulity'],
  ['g' , 'group=', 'Only accept results from certain group'],
  ['P' , 'path=', 'Path to save downloaded files at (for eps it will be downloaded in a folder with the title as name)'],
  ['h' , 'help', 'Display this help'],
  ['s' , 'strict', 'Only strict matches are used'],
  ['S' , 'scores', 'Show scores with explaination'],
  ['c' , 'config=', 'Load config from alternative path (default is ~/.moemachine)']
])              
.bindHelp()
.setHelp("Usage: moemachine [TITLE] [OPTION]\n[[OPTIONS]]");


var Transmission = require('transmission'),
    search = require('./search.js'),
    async = require('async'),
    readline = require('readline'),
    fs = require('fs'),
    tests = require('./tests.js');

var title = process.argv[2];

if (!title) {
    console.log('No valid title given');
    process.exit(1);
}

if (title == '-h' || title == '--help') {
    console.log(opt.getHelp());
    process.exit(0);
}

opt = opt.parse(process.argv.slice(3));

var defaultConfig = require('./config.json');
var userConfig = {};
var argumentConfig = {
    host: opt.options.host,
    port: opt.options.port,
    path: opt.options.path
};
var config = {};

var userConfigPath = opt.options.config?opt.options.config:joinPath(getUserHome(), '.moemachine');
try {
    var userConfigData = fs.readFileSync(userConfigPath, { 'encoding':'utf-8' })
    userConfig = JSON.parse(userConfigData)||{};
} catch(e) {
    if (opt.options.config) {
        console.log('failed loading config: '+e.message);
        process.exit(1);
    }
}

config = mergeObjects([defaultConfig, userConfig, argumentConfig]);

if (title == '-S' || title == '--scores' || opt.options.scores) {
    showScores();
    process.exit(0);
}

if (opt.options.strict === true) {
    console.log('Using strict search');
}

console.log("Searching for: " + title);
search(title, {
    strict: opt.options.strict === true
}, function(error, results){
    if (error) {
        console.log('Fatal: '+error.message);
        process.exit(1);
    }

    if (opt.options.group)
    {
        var nGroup = opt.options.group.toLowerCase().trim();
        results = results.filter(function(result){
            return nGroup == result.meta.group.toLowerCase().trim();
        });
    }

    if (opt.options.type)
    {
        var nType = opt.options.type.toLowerCase().trim();
        results = results.filter(function(result){
            return nType == result.meta.type.toLowerCase().trim();
        });
    }    

    if (opt.options.qaulity)
    {
        var getNumber = function(str){
            var numberRegex = /[0-9]+/;
            var rslt = (str+"").match(numberRegex);
            if (!rslt) {
                return "0";
            }

            return rslt[0]||"0";
        }
        var nQaulity = getNumber(opt.options.qaulity);
        results = results.filter(function(result){
            return nQaulity == getNumber(result.meta.qaulity);
        });
    }

    if (results.length === 0) {
        console.log('Nothing found');
        process.exit(1);
    }

    results.forEach(function(a){
        a.score = createScore(a);
    });

    results.sort(function(a,b){
        return a.score.amount < b.score.amount ? 1 : a.score.amount > b.score.amount ? -1 : 0;
    });


    if (opt.options.best) {
        console.log('got --best skipping prompt and picking best.');
        download(results[0]);
        return;
    }

    console.log('Found: ');
    console.log('');
    results.forEach(function(item, index){
        //console.log(item);
        console.log("  " + (index + 1) + "\t"+getName(item));
    });
    console.log('');

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    askWhich();

    function askWhich() {
        rl.question("Please select which you want to download [c=cancel, b=best]: ", function(answer) {
            
            var answer = answer.trim();
            if (answer == 'c') {
                console.log('Cancelled.');
                rl.close();
                process.exit();
            }

            if (answer == 'b') {
                rl.close();
                download(results[0]);
                return;
            }
            
            if (/^[0-9]+$/.test(answer) && (parseInt(answer) <= results.length)) {
                rl.close();
                download(results[parseInt(answer)-1]);
                return;
            } 

            console.log('Invalid input');
            askWhich();
        });
    }
});


function getName(result)
{
    var meta = result.meta;
    return '[' + meta.group + ']['+meta.type+(meta.type=='ep'?' '+Object.keys(result.eps).length:'')+']['+meta.qaulity+']['+meta.container+'] "'+meta.title+'" Score: '+result.score.amount + ' (' + result.score.hits.join(', ') + ')';
}

function download(result)
{
    var meta = result.meta;
    console.log('Queuing: '+getName(result));
    var transmissionConfig = {
        port : config.port,
        host : config.host
    }

    if (config.auth) {
        var auth = (""+config.auth).split(':', 2);
        transmissionConfig.username = auth[0];
        transmissionConfig.password = auth[1];
    }

    var transmission = new Transmission(transmissionConfig);
    var options = {}
    if (opt.options.path) {
        options['download-dir'] = joinPath(config.path, meta.type!=='batch'?'['+meta.group+'] ' + meta.title + '/' : '');
    }

    if (meta.type !== "ep") {
        transmission.addUrl(result.link, options, function(err){
            if (err) {
                console.log('Fatal: '+err.message);
                process.exit(1);
            }

            console.log('Added torrent to transmission.');
        });
    } else {
        async.forEachOf(result.eps, function(val, key, next){
            transmission.addUrl(val.link, options, function(err){
                if (err) {
                    console.log('Fatal: '+err.message);
                    process.exit(1);
                }

                next();
            });
        }, function(){
            console.log('Added torrents to transmission.'); 
        });
    }
}

function joinPath(partA, partB) {
    if (partA.substring(-1) !== '/') {
        partA += '/';
    }

    if (partB[0] == '/') {
        partB = partB.substring(1);
    }
    return partA + partB;
}

function createScore(result)
{
    var score = {
        amount:0,
        hits:[]
    };

    var testKeys = Object.keys(tests);
    for (var i = testKeys.length - 1; i >= 0; i--) {
        var key = testKeys[i];
        if (tests[key].test(result)) {
            score.amount += config.scores[key];
            score.hits.push(key);
        }
    };

    return score;
}

function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE;
}

function mergeObjects(objs)
{
    var result = {};
    for (var i = 0; i < objs.length; i++) {
        var keys = Object.keys(objs[i]);
        for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            if (objs[i][key] !== undefined) {
                if (typeof(result[key]) === 'object') {
                    result[key] = mergeObjects([result[key], objs[i][key]]);
                } else {
                    result[key] = objs[i][key];
                }
            }
        };
    };
    return result;
}

function showScores()
{
    var testKeys = Object.keys(tests);
    console.log('Loaded score tests:')
    for (var i = testKeys.length - 1; i >= 0; i--) {
        var key = testKeys[i];
        console.log(key + '['+config.scores[key]+']: ' + tests[key].description)
    };
}