var tests = {
    "IS_DEAD":{
        "description":"Hits when there are no seeds",
        "test": function(result) {
            return result.info.seeds === 0;
        }
    },
    "IS_DYING":{
        "description":"Hits when there are less then 3 seeds",
        "test" : function(result) {
            return result.info.seeds < 3;
        }
    },
    "ENOUGH_SEEDS":{
        "description":"When there are more then 10 seeds",
        "test": function(result) {
            return result.info.seeds > 10;
        }
    },
    "IS_FAMOUS":{
        "description":"When there are more then 30 seeds",
        "test": function(result) {
            return result.info.seeds > 30;
        }
    },
    "SEEMS_UNSTABLE":{
        "description":"When there are less then 6 seeds but double the leechers",
        "test": function(result){
            return result.info.seeds > 0 && result.info.seeds < 6 && (result.info.seeds * 2) < result.info.leechers;
        }
    },
    "LOW_QAULITY":{
        "description":"When the result has a qaulity lower then 720",
        "test": function(result){
            return result.meta.qaulity < 720;
        }
    },
    "HIGH_QAULITY":{
        "description":"When the result has a qaulity higher then 720",
        "test":function(result) {
            return result.meta.qaulity > 720
        }
    }
}

module.exports = tests;