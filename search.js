var async = require('async'),
    nyaa = require('./nyaa.js');

module.exports = function(title, callback){
    var results = [];

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
                    return aTitle == desireTitle && (a.meta.type == "ep" || a.meta.type == "batch");
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
            var epc = {};
            eps.forEach(function(a){
                var ep = a.meta.ep;

                if (!epc[a.meta.qaulity]) {
                    epc[a.meta.qaulity] = {
                        'type':'eps',
                        'meta': a.meta,
                        'eps': {}
                    };
                }
                if (!epc[a.meta.qaulity].eps[ep] || (epc[a.meta.qaulity].eps[ep].meta.version||0) < (a.meta.version||0)) {
                    epc[a.meta.qaulity].eps[ep] = a;
                }
            });
            
            Object.keys(epc).forEach(function(qaulity){
                results.push(epc[qaulity]);
            });

            results = results.concat(batches);
            next();
        });
    }, function(){
        callback(null, results);
    });
};