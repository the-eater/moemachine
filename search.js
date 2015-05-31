var async = require('async'),
    nyaa = require('./nyaa.js');

module.exports = function(title, options, callback){
    var results = [];
    var strict = options.strict || false;
    var item = {
        series_title: title
    };

    var desire = item.series_title.trim().toLowerCase();

    async.forEach([{
        // DeadFish
        category:'English-translated Anime',
        query: item.series_title.trim(),
        user: 169660
    },{
        // HorribleSubs
        category:'English-translated Anime',
        query: item.series_title.trim(),
        user: 64513
    },{
        // Coalgirls
        category: 'English-translated Anime',
        query: item.series_title.trim(),
        user: 62260
    },{
        // Cthuko
        category: 'English-translated Anime',
        query: item.series_title.trim(),
        user: 227226
    }], function(query , next){
        nyaa.search(query, function(err, data){
            if (err) {
                callback(err);
            }

            var found = data.filter(function(a){
                if(a.meta){
                    var normalizeRegex = /[^a-z0-9]+/ig;
                    var aTitle = a.meta.title.toLowerCase().replace(normalizeRegex, ' ').trim();
                    var desireTitle = desire.replace(normalizeRegex, ' ').trim();
                    
                    if (strict) {
                        return aTitle == desireTitle && (a.meta.type == "ep" || a.meta.type == "batch");
                    } else {
                        var titleParts  = aTitle.split(' ').filter(function(a){ return !!a; });
                        var desireParts = desireTitle.split(' ').filter(function(a){ return !!a; });
                        var desireTrigger = options.desireTrigger || .8;

                        var amountMatched = 0;
                        desireParts.forEach(function(part){
                            if(titleParts.indexOf(part) !== -1)
                            {
                                amountMatched++;
                            }
                        });
                        return (amountMatched / desireParts.length) > desireTrigger

                    }
                }
                return false;
            });

            if(!found.length){
                next();
                return;
            }
            var batches = found.filter(function(a){
                return a.meta.type == "batch";
            });
            var eps = found.filter(function(a){
                return a.meta.type == "ep";
            });
            var specials = found.filter(function(a){
                return a.meta.type !== "ep" && a.meta.type !== "batch";
            });

            var epc = {};
            eps.forEach(function(a){
                var ep = a.meta.ep;
                var id = a.meta.title + '-' + a.meta.qaulity;

                if (!epc[id]) {
                    epc[id] = {
                        'type':'eps',
                        'meta': a.meta,
                        'info': a.info,
                        'eps': {}
                    };
                }
                if (!epc[id].eps[ep] || (epc[id].eps[ep].meta.version||0) < (a.meta.version||0)) {
                    epc[id].eps[ep] = a;
                }
            });
            
            Object.keys(epc).forEach(function(qaulity){
                var seeds = Infinity, leechers = Infinity;
                Object.keys(epc[qaulity].eps).forEach(function(ep){
                    if (seeds > epc[qaulity].eps[ep].info.seeds) {
                        seeds = epc[qaulity].eps[ep].info.seeds;
                    }

                    if (leechers > epc[qaulity].eps[ep].info.leechers) {
                        leechers = epc[qaulity].eps[ep].info.leechers;
                    }
                });

                epc[qaulity].info.leechers = leechers;
                epc[qaulity].info.seeds = seeds;
                results.push(epc[qaulity]);
            });

            results = results.concat(batches, specials);
            next();
        });
    }, function(){
        callback(null, results);
    });
};