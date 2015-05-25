var http = require('http');
var parseString = require('xml2js').parseString;
var Nyaa = module.exports = {};

Nyaa.categories = {
    "All": "0_0",
    "Anime": "1_0",
    "Anime Music Video": "1_32",
    "English-translated Anime": "1_37",
    "Non-English-translated Anime": "1_38",
    "Raw Anime": "1_11",
    "Audio": "3_0",
    "Lossless Audio": "3_14",
    "Lossy Audio": "3_15",
    "Literature": "2_0",
    "English-translated Literature": "2_12",
    "Non-English-translated Literature": "2_39",
    "Raw Literature": "2_13",
    "Live Action": "5_0",
    "English-translated Live Action": "5_19",
    "Live Action Promotional Video": "5_22",
    "Non-English-translated Live Action": "5_21",
    "Raw Live Action": "5_20",
    "Pictures": "4_0",
    "Graphics": "4_18",
    "Photos": "4_17",
    "Software": "6_0",
    "Applications": "6_23",
    "Games": "6_24",
}

Nyaa.filters = {
	"All":0,
	"Remakes":1,
	"Trusted":2,
	"A+":3
}

Nyaa.indicators = {
	qaulity: [/[0-9]+p/i,/[0-9]+x[0-9]+/i, '720','1080','420'],
	source: ['dvd', 'bd'],
	audio: ['aac', 'mp3'],
	container:['mp4','mkv']
}

Nyaa.solveIndicator = function(indicator){
	indicator 
	var names = Object.keys(Nyaa.indicators);
	for (var i = 0; i < names.length; i++) {
		for(var j=0; j < Nyaa.indicators[names[i]].length; j++){
			var item = Nyaa.indicators[names[i]][j];
			if(typeof(item) == 'string'){
				if(item == indicator.toLowerCase()) return names[i];
			}else if (item instanceof RegExp){
				if(item.test(indicator)) return names[i];
			}
		}
	};
	return false;
};

Nyaa.animeGroups = {
	'deadfish': function(title){
		var pattern = /^\[DeadFish\]\s*((?:(?! [\-\+] |[0-9]+\-[0-9]+).)+)(.*)(?:\s*\-? (Movie|Special|O[NV]A|Batch|[0-9]+(?:v[0-9]+)?))\s*((?:\[[0-9a-z\a]+\]\s*)*)(?:\.(mp4|mkv))?$/i
		//var pattern = /^\[DeadFish\]\s*(.*)\s*(Movie|Special|O[NV]A|Batch|[0-9]+(?:v[0-9]+)?)\s*((?:\[[0-9a-z\a]+\]\s*)*)(\.mp4|\.mkv)?$/i;
		var match;
		if(match = title.match(pattern)){
			var data = {
				group:'DeadFish'
			};
			if(match[5]){
				data.container = match[5];
			}
			if(match[4]){
				var itemreg = /\[([a-z0-9]+)\]/ig;
				var item;
				while(item = itemreg.exec(match[4])){
					var key = Nyaa.solveIndicator(item[1]);
					if(key == "qaulity"){
						data[key] = parseInt(item[1].match(/^[x]?([0-9]+)[p]?/)[1]);
					}else{
						data[key] = item[1];
					}
				}
			}
			if(match[3]){
				if(match[3] == 'Batch'){
					data.type = "batch"
					data.batch = true;
				}else if(/[0-9]+(v[0-9]+)?/i.test(match[3])){
					data.type = "ep";
					var parts = match[3].split('v');
					data.ep = parseInt(parts[0]);
					if(parts[1]){
						data.version = parts[1];
					}
				}else{
					data.type = match[3].toLowerCase().trim();
				}
			}
			if(match[2]){
				data.extra = match[2].match(/^(?:\s*[+-]\s*)?(((?!\s*[+-]\s*$).)*)(?:\s*[+-]\s*)?$/)[1];
			}
			if(match[1]){
				data.title = match[1].trim();
			}
			return data;
		}else return false;
	},
	'horriblesubs':function(title){
		// [HorribleSubs] PSYCHO-PASS - 19 [480p].mkv
		var pattern = /\[HorribleSubs\] ((?:(?! - [0-9]+ \[).)+) - ([0-9]+) \[([0-9]+)p\](?:\[[a-e0-9]{8}\])?(?:.(mkv|mp4)$)/i
		var match;
		if(match = title.match(pattern)){
			var data = {
				group:'HorribleSubs'
			};
			if(match[4]){
				data.container = match[4];
			}
			if(match[3]){
				data.qaulity = parseInt(match[3]);
			}
			if(match[2]){
				data.type = "ep";
				data.ep = parseInt(match[2]);
			} else {
				data.type = "batch";
			}
			if(match[1]){
				data.title = match[1];
			}
			return data;
		}
		return false;
	},
	'coalgirls': function(title)
	{
		// [Coalgirls]_Evangelion_2.22_You_Can_(Not)_Advance_(1280x720_Blu-ray_FLAC)_[12DF18F3].mkv
		var pattern = /^\[Coalgirls\]_(.+)_([0-9]+-[0-9]+_)?\([0-9]+x([0-9]+)_([^_]+)_([^_]+)\)(?:_\[[A-F0-9]{8}\])?(?:\.([a-z]+))?$/i;
		var match;
		if(match = title.match(pattern)){
			var data = {
				group:'Coalgirls'
			};

			if (match[6]) {
				data.container = match[6];
			}

			if (match[3]) {
				data.qaulity = parseInt(match[3]);
			}

			if (match[2]) {
				data.type = "ep";
				data.ep = match[2];
			} else {
				data.type = "batch";
			}

			if (match[1]) {
				data.title = match[1].replace(/_+/g,' ');
			}

			return data;
		}
		return false;
	}
}

Nyaa.solveInfo = function(info){
	var number = /[0-9]+(\.[0-9])?/ig,
		i = 0,
		names = ["seeds",'leechers','downloads'],
		data={},
		val;
	while((val = number.exec(info)) && i < 3){
		data[names[i++]] = parseFloat(val[0]);
	}
	return data;
};

Nyaa.solveAnime = function(title){ 
	var group = /^\s*\[([^\]]+)\]/;
	var match; 
	if(match = title.match(group)){
		if(Nyaa.animeGroups[match[1].toLowerCase()]){
			return Nyaa.animeGroups[match[1].toLowerCase()](title.trim());
		}
	}
	return false;
};

Nyaa.search = function(query, maxPages, cb){
	if(typeof(query) == "string"){
		query = {
			category: '0_0',
			filter:0,
			query: query
		};
	}else{
		query.category = Nyaa.categories[query.category] || query.category || "0_0";
		query.filter = Nyaa.filters[query.filter] || query.filter || 0; 
	}
	if(typeof(maxPages) == 'function') {
		cb = maxPages;
	}
	maxPages = 10;
	var items = [];
	doRequest(1);

	function doRequest(offset) {
		var req = http.get(
			'http://www.nyaa.se/?page=rss&cats=' + encodeURIComponent(query.category) +
			"&filter=" + query.filter +
			'&term=' + encodeURIComponent(query.query||"") +
			(query.user?'&user=' + encodeURIComponent(query.user):'') +
			'&offset=' + offset,
			function(resp){
			var xml = "";
			resp.on('data', function(data){
				xml += data.toString('utf-8');
			});
			resp.on('end', function(){
				parseString(xml, function (err, result) {

	    			var item = result.rss.channel[0].item||[];

		    		items = items.concat(item.map(function(a){
		    			return {
		    				title:a.title[0],
		    				category:a.category[0],
		    				info: Nyaa.solveInfo(a.description[0]),
		    				guid: a.guid[0],
		    				link:a.link[0],
		    				publishDate: new Date(a.pubDate[0]),
		    				meta: Nyaa.solveAnime(a.title[0])
		    			};
	    			}));
		    		if (item.length === 100 && offset <= maxPages) {
		    			doRequest(offset+1);
		    		} else {
		    			cb(null, items);
		    		}
				});
			});
		});
	}
};