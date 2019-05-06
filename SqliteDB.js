/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-30 17:03:03
 * @LastEditTime: 2019-05-06 11:33:51
 */

var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var DB = DB || {};
 
DB.SqliteDB = function(file){
    DB.db = new sqlite3.Database(file);
 
    DB.exist = fs.existsSync(file);
    if(!DB.exist){
        console.log("Creating db file!");
        fs.openSync(file, 'w');
    };
};
 
DB.printErrorInfo = function(err){
    console.log("Error Message:" + err.message + " ErrorNumber:" + errno);
};
 
DB.SqliteDB.prototype.createTable = function(sql,pCallback){
    DB.db.serialize(function(){
        DB.db.run(sql, function(err){
            if(null != err){
                DB.printErrorInfo(err);
                return;
            }else{
                if(pCallback){
                    pCallback();
                }
            }
        });
    });
};
 
/// tilesData format; [[level, column, row, content], [level, column, row, content]]
DB.SqliteDB.prototype.insertData = function(sql, objects){
    DB.db.serialize(function(){
        var stmt = DB.db.prepare(sql);
        stmt.run(objects);
        stmt.finalize();
    });
};

DB.SqliteDB.prototype.updateData = function(sql, objects,pCallback){
    DB.db.serialize(function(){
        var stmt = DB.db.prepare(sql);
        stmt.run(objects);
        stmt.finalize(pCallback);
    });
};
 
DB.SqliteDB.prototype.queryData = function(sql, callback){
    DB.db.all(sql, function(err, rows){
        if(callback){
            if(err){
                callback();
            }else{
                callback(rows);
            }
        }
    });
};
 
DB.SqliteDB.prototype.executeSql = function(sql){
    DB.db.run(sql, function(err){
        if(null != err){
            DB.printErrorInfo(err);
        }
    });
};

DB.SqliteDB.prototype.run = function(sql,pCallback){
    DB.db.run(sql, function(err){
        if(pCallback){
            pCallback(err);
        }
    });
};
 
DB.SqliteDB.prototype.close = function(){
    DB.db.close();
};

exports.SqliteDB = DB.SqliteDB