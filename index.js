opt = require('node-getopt').create([
  ['p' , 'port=9091' , 'Port where transmission is running at'],
  ['H' ,'host=127.0.0.1' , 'Host where transmission is running at'],
  ['t' , 'title=', 'Title of the anime to download'],
  ['T' , 'type=', 'Only accept results from a cetrain type (batch or eps)'],
  ['b' , 'best' , 'Skip manual pick and do what\'s best for me'],
  ['q' , 'qaulity=', 'Only accept results from certain qaulity'],
  ['g' , 'group=', 'Only accept results from certain group'],
  ['P' , 'path=', 'Path to save downloaded files at (for eps it will be downloaded in a folder with the title as name)'],
  ['h' , 'help', 'Display this help']
])              
.bindHelp()     
.parseSystem();

var Transmission = require('transmission'),
    search = require('./search.js'),
    async = require('async'),
    readline = require('readline');

var title = opt.options.title;

if (!title) {
    console.log('No valid title given');
    process.exit(1);
}
console.log("Searching for: " + title);
search(title, function(error, results){
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

    if (opt.options.best) {
        console.log('got --best skipping prompt and picking best.');
        bestPick(results);
        return;
    }

    console.log('Found: ');
    results.forEach(function(item, index){
        var meta = item.meta;
        console.log('[' + (index + 1) + '][' + meta.group + ']['+meta.type+']['+meta.qaulity+']['+meta.container+'] '+meta.title);
    });

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
                bestPick(results);
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


function bestPick(results)
{
    console.log('Picking best from '+results.length + ' result(s)');
    if (results.length == 1) {
        download(results[0]);
        return;
    }

    var best = false;
    results.forEach(function(result){
        if (best == false) {
            best = result;
            return;
        }

        if (best.meta.qaulity < result.meta.qaulity) {
            best = result;
            return;
        }

        if (best.meta.type == 'ep' && result.meta.type == "batch") {
            best = result;
            return;
        }
    });

    download(best);
}

function download(result)
{
    var meta = result.meta;
    console.log('Queuing: [' + meta.group + ']['+meta.type+']['+meta.qaulity+']['+meta.container+'] '+meta.title)
    var transmission = new Transmission({
        port : opt.options.port||9091,
        host : opt.options.host||"localhost"
    });
    var options = {}
    if (opt.options.path) {
        options['download-dir'] = joinPath(opt.options.path, meta.type=='ep'?'['+meta.group+'] ' + meta.title + '/' : '');
    }

    if (meta.type == "batch") {
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