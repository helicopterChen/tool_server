/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-05-05 18:19:37
 * @LastEditTime: 2019-05-06 15:10:30
 */
let SqliteDB = require('./SqliteDB').SqliteDB;
let moment = require("moment")
let pako= require("pako")
var encoding = require('encoding');
const STR_FORMAT = require('string-format');

let create_table_sql = "CREATE TABLE IF NOT EXISTS date_data(date INTEGER, Vungle BLOB,Admob BLOB,Mintegral BLOB,Applovin BLOB,Mopub BLOB,Facebook BLOB,UnityAds BLOB,PRIMARY KEY(date));";
let select_date_data_sql = "SELECT * FROM `date_data` WHERE date={};"
let insert_date_data_sql = "INSERT INTO `date_data`(date,{}) VALUES(?,?);"
let update_date_data_sql = "UPDATE `date_data` SET {}=? WHERE date={};"

function DbHelper() {
    this._T_CONF={};
    this._oSqliteDB = null;
}

DbHelper.prototype.Init=function(tConfig){
    this._T_CONF=tConfig;
    let oSqliteDB = new SqliteDB(tConfig.DbFileName);
    oSqliteDB.createTable(create_table_sql);
    this._oSqliteDB= oSqliteDB;
};

DbHelper.prototype.CheckHaveData=function(sDate,sType,pCallback){
    let nTime = parseInt( moment(sDate,"YYYY-MM-DD").format("YYYYMMDD"));
    let sSql = STR_FORMAT(select_date_data_sql,nTime);
    this._oSqliteDB.queryData(sSql,(tRows)=>{
        if(pCallback){
            if(tRows&&tRows[0]&&tRows[0][sType]){
                pCallback(true);
                return;
            }
            pCallback(false);
        }
    })
}

DbHelper.prototype.SaveDateTypeData=function(sDate,sType,tData){
    if(!tData){
        return;
    }
    let nTime = parseInt( moment(sDate,"YYYY-MM-DD").format("YYYYMMDD"));
    let sSelectSql = STR_FORMAT(select_date_data_sql,nTime);
    let sSaveStr = pako.deflate(JSON.stringify(tData), { to: 'string' });
    this._oSqliteDB.queryData(sSelectSql,(tRows)=>{
        if(tRows && tRows.length > 0 ){
            let sUpdateSql = STR_FORMAT(update_date_data_sql,sType,nTime);
            this._oSqliteDB.updateData(sUpdateSql,[sSaveStr]);
        }else{
            let sInsertSql = STR_FORMAT(insert_date_data_sql,sType);
            this._oSqliteDB.insertData(sInsertSql,[nTime,sSaveStr]);
        }
    });
}

DbHelper.prototype.GetDateData=function(sDate,pCallback){
    let nTime = parseInt( moment(sDate,"YYYY-MM-DD").format("YYYYMMDD"));
    let sSelectSql = STR_FORMAT(select_date_data_sql,nTime);
    this._oSqliteDB.queryData(sSelectSql,(tRows)=>{
        if(pCallback){
            if(!tRows[0]){
                pCallback();
            }else{
                let tDateData = tRows[0];
                let tRetData = {};
                for(let sAttriName in tDateData){
                    if(sAttriName!="date"){
                        let sSavedStr = tDateData[sAttriName];
                        if(sSavedStr){
                            let sSaveStr = pako.inflate(sSavedStr, { to: 'string' });
                            if(sSavedStr){
                                tRetData[sAttriName]=JSON.parse(sSaveStr);
                            }else{
                                tRetData[sAttriName]=null;
                            }
                        }
                    }
                }
                if(pCallback){
                    pCallback(tRetData);
                }
            }
        }
    });
}

module.exports ={
    Instance: new DbHelper()
};