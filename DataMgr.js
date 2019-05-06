/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-08 16:30:36
 * @LastEditTime: 2019-05-06 15:21:06
 */
let moment = require('moment');
let fs = require('fs');
let DataFetcher = require('./DataFetcher.js');
let DbHelper = require('./DbHelper.js')
const STR_FORMAT = require('string-format');
let tNetworks = ["UnityAds","Vungle","Mopub","Applovin","Admob","Facebook","Mintegral"];
function DataMgr() {
    this._T_CONF={};
    this._tFetchOkTable={};
    this._tTodayNoDataTable = {};
    this._bGoogleAuth=false;
    this._tDataFetchedOk=false;
    this._oTimer=null;
    this._oDbHelper=null;
}

DataMgr.prototype.Init=function(tConfig){
    this._T_CONF=tConfig;
};

DataMgr.prototype.Start=function(){
    let self = this;
    setTimeout(() => {
        self.DoCheckAndFetech();
    }, 4000);
    this._oTimer=setInterval(()=>{
        self.DoCheckAndFetech();
    },18000);
};

DataMgr.prototype.Print=function(){
    console.log("PRINT");
};

DataMgr.prototype.SetGooglePlayAuthToken=function(sToken){
    this._sGoogleAuthToken = sToken;
}

DataMgr.prototype.GetNetworkDateData = function(sType,sDate,pCallback){ 
    let sFileName = STR_FORMAT("./saved_data/{}/{}.json",sDate,sType);
    if(fs.existsSync(sFileName)){
        fs.readFile(sFileName,"utf-8",(err,sData)=>{
            pCallback(JSON.parse(sData))
        });
    }
}

GetNetworkDateDataAsync = function(sType,sDate,pCallback){ 
    return new Promise(function (resolve, reject) {
        let sFileName = STR_FORMAT("./saved_data/{}/{}.json",sDate,sType);
        if(fs.existsSync(sFileName)){
            fs.readFile(sFileName,"utf-8",(err,sData)=>{
                resolve(JSON.parse(sData))
            });
        }else{
            reject();
        }
    });
}


DataMgr.prototype.GetDateAllNetworkData=async function(sDate,pCallback){
    let tData = {}
    for(let sNetworkName of tNetworks){
        tData[sNetworkName] = await GetNetworkDateDataAsync(sNetworkName,sDate);
    }
    pCallback(tData);
}

// DataMgr.prototype.GetDateHalfNetworkData=async function(sDate,pCallback){
//     let tData = {}
//     for(let sNetworkName of tNetworks){
//         if(sNetworkName!="Mopub"){
//             tData[sNetworkName] = await GetNetworkDateDataAsync(sNetworkName,sDate);
//         }
//     }
//     pCallback(tData);
// }

DataMgr.prototype.GetDateHalfNetworkData=function(sData,pCallback){
    // self._oDbHelper.GetDateData(sData,pCallback);
}

DataMgr.prototype.GetDateSavedAllData = function(sDate,pCallback){
    this._oDbHelper.GetDateData(sDate,(tData)=>{
        if(pCallback){
            pCallback(tData);
        }
    });
}

DataMgr.prototype.DoCheckAndFetech=function(){
    let oBeginTime = moment();
    let self = this;
    for(let i=0;i<15;++i){
        let sDate = oBeginTime.subtract(1,"day").format("YYYY-MM-DD");
        setTimeout(() => {
            self.DoCheckAndFetchUnity(sDate);
            self.DoCheckAndFetchVungle(sDate);
            self.DoCheckAndFetchApplovin(sDate);
            self.DoCheckAndFetchMopub(sDate);
            self.DoCheckAndFetchAdmob(sDate);
            self.DoCheckAndFetchFacebook(sDate);
            self.DoCheckAndFetchMintegral(sDate);
        },3500*i);
    }   
};

DataMgr.prototype.DoCheckAndFetchUnity=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"UnityAds",(result)=>{
        if(!result){
            DataFetcher.RequestUnityData(sDate,this._T_CONF.Keys.UnityAds,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"UnityAds",tData);
            });
        }
    });
}

DataMgr.prototype.DoCheckAndFetchVungle=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Vungle",(result)=>{
        if(!result){
            DataFetcher.RequestVungleData(sDate,this._T_CONF.Keys.Vungle,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"Vungle",tData);
            });
        }
    });
}

DataMgr.prototype.DoCheckAndFetchApplovin=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Applovin",(result)=>{
        if(!result){
            DataFetcher.RequestApplovinData(sDate,this._T_CONF.Keys.Applovin,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"Applovin",tData);
            });
        }
    });
}

DataMgr.prototype.DoCheckAndFetchMopub=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Mopub",(result)=>{
        if(!result){
            DataFetcher.RequestMopubData(sDate,this._T_CONF.Keys.MopubReportKey,this._T_CONF.Keys.MopubApiKey,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"Mopub",tData);
            });
        }
    });
}

DataMgr.prototype.DoCheckAndFetchAdmob=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Admob",(result)=>{
        if(!result){
            DataFetcher.RequestAdmobData(sDate,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"Admob",tData);
            });
        }
    });
} 

DataMgr.prototype.DoCheckAndFetchFacebook=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Facebook",(result)=>{
        if(result){
            return;
        }
        let tFacebookDateData = {}
        let tDataQueryFinished={};
        let nCount = 0;
        for(let sAppName in this._T_CONF.Keys.Facebook){
            setTimeout( async()=>{ 
                let tConf = this._T_CONF.Keys.Facebook[sAppName];
                if(tConf){
                    nCount++;
                    DataFetcher.RequestFacebookData(sDate,tConf.Token,tConf.ID, (tData)=>{
                        tDataQueryFinished[sAppName]=true
                        if(tData){
                            tFacebookDateData["Android_"+tConf.ID] = tData.android;
                            tFacebookDateData["IOS_"+tConf.ID] = tData.ios;  
                        }
                        for(let sName in this._T_CONF.Keys.Facebook){
                            if(!tDataQueryFinished[sName]){
                                return;
                            }
                        }
                        this._oDbHelper.SaveDateTypeData(sData,"Facebook",tFacebookDateData);
                    });    
                }   
            },nCount*200);
        }
    });
}

DataMgr.prototype.DoCheckAndFetchMintegral=function(sDate){
    this._oDbHelper.CheckHaveData(sDate,"Mintegral",(result)=>{
        if(!result){
            DataFetcher.RequestMintegralData(sDate,this._T_CONF.Keys.MintegralKey,this._T_CONF.Keys.MintegralSecret,(tData)=>{
                this._oDbHelper.SaveDateTypeData(sDate,"Mintegral",tData);
            });
        }
    });
} 

DataMgr.prototype.DoCheckAndSaveDateData=function(sDate){
    for(let sNetworkName of tNetworks){
        let sFileName = "./saved_data/"+ sDate + "/" +sNetworkName+ ".json";
        if(!fs.existsSync(sFileName)){
            return;
        }
    }
    this.GetDateAllNetworkData(sDate,(tData)=>{
        let sDateDataFileName = "./saved_data/"+ sDate + "/All_Data.json";
        let sFileData = JSON.stringify(tData);
        if(!fs.existsSync(sDateDataFileName) && sFileData != "{}"){
            fs.writeFile(sDateDataFileName,sFileData,(err)=>{
                if(!err){
                    console.log("save:"+sDateDataFileName);
                }
            });
        }
    });
}

DataMgr.prototype.DoCheckAndSaveHalfDateData=function(sDate){
    for(let sNetworkName of tNetworks){
        if(sNetworkName != "Mopub"){
            let sFileName = "./saved_data/"+ sDate + "/" +sNetworkName+ ".json";
            if(!fs.existsSync(sFileName)){
                return;
            }
        }
    }
    this.GetDateHalfNetworkData(sDate,(tData)=>{
        let sDateDataFileName = "./saved_data/"+ sDate + "/Half_Data.json";
        let sFileData = JSON.stringify(tData);
        if(!fs.existsSync(sDateDataFileName) && sFileData != "{}"){
            fs.writeFile(sDateDataFileName,sFileData,(err)=>{
                if(!err){
                    console.log("save:"+sDateDataFileName);
                }
            });
        }
    });
}

DataMgr.prototype.SaveDataToFile = function(sFileName,tData,sDate){
    if(!tData){
        return
    }
    let sFileData = JSON.stringify(tData);
    if(!fs.existsSync(sFileName) && sFileData != "{}"){
        fs.writeFile(sFileName,sFileData,(err)=>{
            if(!err){
                this.DoCheckAndSaveHalfDateData(sDate);
                this.DoCheckAndSaveDateData(sDate);
            }
        });
    }
}

DataMgr.prototype.refetchSevenDay = function(){
    let self = this;
    let oFetchBeginTime = moment();
    for(let i=0;i<7;++i){
        let sDate = oFetchBeginTime.subtract(1,"day").format("YYYY-MM-DD");
        setTimeout(() => {
            self.DoCheckAndFetchUnity(sDate);
            self.DoCheckAndFetchVungle(sDate);
            self.DoCheckAndFetchApplovin(sDate);
            self.DoCheckAndFetchMopub(sDate);
            self.DoCheckAndFetchAdmob(sDate);
            self.DoCheckAndFetchFacebook(sDate);
            self.DoCheckAndFetchMintegral(sDate);
        },3500*i);
    }
}

module.exports = {
    Instance: new DataMgr()
}