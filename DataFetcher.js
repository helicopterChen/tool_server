/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-03-29 09:27:19
 * @LastEditTime: 2019-04-28 14:42:00
 */
let moment = require('moment');
let request = require('request');
let crypto = require('crypto');
const STR_FORMAT = require('string-format');

function cryptMd5(sData) {
    var md5 = crypto.createHash('md5');
    return md5.update(sData).digest('hex');
}

(function(window) {
    function DoRequest(tOptions){
        return new Promise(function (resolve, reject) {
            if(tOptions.method=="GET"){
                request.get(tOptions, function(err, response, body){
                    if(err){
                        reject();
                    }else{
                        resolve(response);
                    }
                });
            }
            else if(tOptions.method=="POST"){
                request.post(tOptions, function(err, response, body){
                    if(err){
                        reject();
                    }else{
                        resolve(response);
                    }
                });
            }
        });
    }

    function ProcessUnityData(sBody){
        let tRow = sBody.split('\n');
        let tMap = [];
        let tHeads = tRow[0].split(',');
        for(let nIdx in tHeads){
            tHeads[nIdx]=tHeads[nIdx].replace(/\s/g,'_');
        }
        for(let i=1;i<tRow.length;++i){
            let tRowData = tRow[i].split(',');
            let tData = {};
            let tConvertedData = {}
            for(let j=0;j<tRowData.length;++j){
                let sVal = tRowData[j].replace(/^\"|\"$/g,'');
                if(tHeads[j]!="Date"){
                    tData[tHeads[j]]=parseFloat(sVal) || sVal;
                }else{
                    tData[tHeads[j]]= sVal.split(' ')[0];
                }
            }
            tConvertedData["APP_ID"] = tData["Source_game_id"];
            tConvertedData["APP_NAME"] = tData["Source_game_name"];
            tConvertedData["AD_UNIT"] = tData["Source_zone"];
            tConvertedData["COUNTRY"] = tData["Country_code"];
            tConvertedData["PLATFORM"] = tData["Platform"];
            tConvertedData["REVENUE"] = tData["revenue"];
            tConvertedData["REQUEST"] = tData["adrequests"];
            tConvertedData["VIEWS"] = tData["started"];
            tConvertedData["COMPLETES"] = tData["views"];
            tConvertedData["AVALABLE"] = tData["available"];
            tConvertedData["DATE"] = tData["Date"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            if(tRowData.AD_UNIT==""){
                sAdUnit="Total"
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID][sCountry]){
                tDayData[sAppID][sCountry] = {}
            }
            if(!tDayData[sAppID][sCountry][sAdUnit]){
                tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,COMPLETES:0,VIEWS:0,REVENUE:0}
            }
            let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
            tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE); 
            tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);    
        }
        return tDayData
    }

    function ProcessVungleData(sBody){
        let tBody = JSON.parse(sBody);
        if(!tBody){
            return;
        }
        let tMap = [];
        for(let tData of tBody){
            let tConvertedData = {}
            tConvertedData["APP_ID"] = tData["application id"];
            tConvertedData["APP_NAME"] = tData["application name"];
            tConvertedData["COUNTRY"] = tData["country"];
            tConvertedData["AD_UNIT"] = "video"
            if(tData["incentivized"]==true){
                tConvertedData["AD_UNIT"] = "reward_video"
            }
            tConvertedData["PLATFORM"] = tData["platform"];
            tConvertedData["REVENUE"] = tData["revenue"];
            tConvertedData["REQUEST"] = tData["views"];
            tConvertedData["AVALABLE"] = tData["views"];
            tConvertedData["VIEWS"] = tData["views"];
            tConvertedData["COMPLETES"] = tData["completes"];
            tConvertedData["CLICKED"] = tData["clicks"];
            tConvertedData["ECPM"] = tData["ecpm"];
            tConvertedData["DATE"] = tData["date"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            if(tRowData.AD_UNIT==""){
                sAdUnit="Total"
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID][sCountry]){
                tDayData[sAppID][sCountry] = {}
            }
            if(!tDayData[sAppID][sCountry][sAdUnit]){
                tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,CLICKED:0,COMPLETES:0}
            }
            let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
            tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);
            tAdUnitData.CLICKED+=parseInt(tRowData.CLICKED);
            tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE);    
        }
        return tDayData
    }

    function ProcessApplovinData(sBody){
        let tBody = JSON.parse(sBody)
        if(!tBody || !tBody.results){
            return;
        }
        let tMap = [];
        for(let tData of tBody.results){
            let tConvertedData = {}
            tConvertedData["APP_ID"] = tData["package_name"];
            tConvertedData["APP_NAME"] = tData["application"];
            tConvertedData["AD_UNIT"] = tData["ad_type"];
            tConvertedData["COUNTRY"] = tData["country"].toUpperCase();
            tConvertedData["PLATFORM"] = tData["platform"];
            tConvertedData["REVENUE"] = tData["revenue"];
            tConvertedData["REQUEST"] = 0;
            tConvertedData["VIEWS"] = tData["impressions"];
            tConvertedData["COMPLETES"] = 0;
            tConvertedData["CLICKED"] = tData["clicks"];
            tConvertedData["ECPM"] = tData["ecpm"];
            tConvertedData["DATE"] = tData["day"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID][sCountry]){
                tDayData[sAppID][sCountry] = {}
            }
            if(!tDayData[sAppID][sCountry][sAdUnit]){
                tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,CLICKED:0,COMPLETES:0}
            }
            let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
            tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE);  
            tAdUnitData.CLICKED+=parseInt(tRowData.CLICKED);  
            tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);  
        }
        return tDayData;
    }
    
    function ProcessMopubData(sBody){
        let tRow = sBody.split('\n');
        let tMap = [];
        let tHeads = tRow[0].split(',');
        for(let i=1;i<tRow.length;++i){
            let tRowData = tRow[i].split(',');
            let tData = {};
            for(let j=0;j<tRowData.length;++j){
                tData[tHeads[j]]=tRowData[j];
            }
            if( ( (tData["Order"]=="MPX")||(tData["Order"]=="MarketPlace") )&&tData["App ID"]){
                let tConvertedData = {}
                tConvertedData["APP_ID"] = tData["App ID"];
                tConvertedData["APP_NAME"] = tData["App"];
                tConvertedData["AD_UNIT"] = tData["AdUnit Format"];
                tConvertedData["COUNTRY"] = tData["Country"];
                tConvertedData["PLATFORM"] = "";
                if(tData["OS"]=="iPhone OS"){
                    tConvertedData["PLATFORM"] = "IOS";
                }else{
                    tConvertedData["PLATFORM"] = "Android";
                }
                tConvertedData["REVENUE"] = parseFloat(parseFloat(tData["Revenue"]).toFixed(4));
                tConvertedData["REQUEST"] = tData["Attempts"];
                tConvertedData["VIEWS"] = tData["Impressions"];
                tConvertedData["COMPLETES"] = tData["Impressions"];
                tConvertedData["CLICKED"] = tData["Clicks"];
                tConvertedData["ECPM"] = 0;
                if(tData["Impressions"] >0 ){
                    tConvertedData["ECPM"] = (tData["Revenue"]/tData["Impressions"])*1000;
                }
                tConvertedData["DATE"] = tData["Day"];
                tMap.push(tConvertedData);
            }
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID][sCountry]){
                tDayData[sAppID][sCountry] = {}
            }
            if(!tDayData[sAppID][sCountry][sAdUnit]){
                tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0,CLICKED:0}
            }
            let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
            tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdUnitData.CLICKED+=parseInt(tRowData.CLICKED);
            tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);
            tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE);    
        }
        return tDayData
    }

    function ProcessAdmobData(sBody){
        if(sBody==""){
            return null;
        }
        let tRow = sBody.split('\n');
        let tMap = [];
        let tHeads = [
            "Date","AppId","GameName","Platform","AdUnitName","AdUnit","Country","AdRequests","Clicks","Views","Revenue","Avaliable"
        ];
        for(let i=0;i<tRow.length;++i){
            let tRowData = tRow[i].split(',');
            let tData = {};
            let tConvertedData = {}
            for(let j=0;j<tRowData.length;++j){
                let sVal = tRowData[j].replace(/^\"|\"$/g,'');
                if(tHeads[j]=="Date"){
                    tData[tHeads[j]]= sVal.split(' ')[0];
                }else if(tHeads[j]=="AppId"){
                    tData[tHeads[j]] = sVal.substring(2)
                }else{
                    tData[tHeads[j]]=parseFloat(sVal) || sVal;
                }
            }
            tConvertedData["APP_ID"] = tData["AppId"];
            tConvertedData["APP_NAME"] = tData["GameName"];
            tConvertedData["AD_UNIT"] = tData["AdUnit"];
            tConvertedData["COUNTRY"] = tData["Country"];
            tConvertedData["PLATFORM"] = tData["Platform"];
            tConvertedData["REVENUE"] = tData["Revenue"];
            tConvertedData["REQUEST"] = tData["AdRequests"];
            tConvertedData["CLICKED"] = tData["Clicks"];
            tConvertedData["VIEWS"] = tData["Views"];
            tConvertedData["COMPLETES"] = tData["Views"];
            tConvertedData["AVALABLE"] = tData["Avaliable"];
            tConvertedData["DATE"] = tData["Date"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            if(sAppID){
                let sCountry = tRowData.COUNTRY
                let sAdUnit = tRowData.AD_UNIT
                if(!tDayData[sAppID]){
                    tDayData[sAppID] = {}
                }
                if(!tDayData[sAppID]){
                    tDayData[sAppID] = {}
                }
                if(!tDayData[sAppID][sCountry]){
                    tDayData[sAppID][sCountry] = {}
                }
                if(!tDayData[sAppID][sCountry][sAdUnit]){
                    tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0,CLICKED:0}
                }
                let tAdDayData = tDayData[sAppID][sCountry][sAdUnit];
                tAdDayData.REQUEST+=parseInt(tRowData.REQUEST);
                tAdDayData.AVALABLE+=parseInt(tRowData.AVALABLE);
                tAdDayData.VIEWS+=parseInt(tRowData.VIEWS);
                tAdDayData.CLICKED+=parseInt(tRowData.CLICKED);
                tAdDayData.COMPLETES+=parseInt(tRowData.COMPLETES);
                tAdDayData.REVENUE+=parseFloat(tRowData.REVENUE);    
            }
        }
        return tDayData
    }

    function ProcessFacebookData(tBody){
        if(!tBody||!tBody.data||!tBody.data[0]||!tBody.data[0].results){
            return {};
        }
        let tDataMap = {android:{},ios:{},unknown:{}}
        let tResults = tBody.data[0].results;
        for(let tResult of tResults){
            let sPlatform = tResult.breakdowns[0].value;
            let sCountry = tResult.breakdowns[1].value;
            let nPlacementId = tResult.breakdowns[2].value;
            if(tDataMap[sPlatform][nPlacementId]==null){
                tDataMap[sPlatform][nPlacementId] = {};
            }
            if(!tDataMap[sPlatform][nPlacementId][sCountry]){
                tDataMap[sPlatform][nPlacementId][sCountry]={};
            }
            tDataMap[sPlatform][nPlacementId][sCountry][tResult.metric] = tResult.value;
        }
        for(let sPlacementId in tDataMap.unknown){
            let tPlacement = tDataMap.unknown[sPlacementId];
            let tPlatformPlacement = tDataMap.android[sPlacementId];
            if(!tPlatformPlacement){
                tPlatformPlacement = tDataMap.ios[sPlacementId];
            }
            if(tPlatformPlacement){
                for(let country in tPlacement){
                    if(!tPlatformPlacement[country]){
                        tPlatformPlacement[country] = tPlacement[country];
                    }else{
                        let tPlatformCountryData = tPlatformPlacement[country];
                        for(let metric in tPlacement[country]){
                            if(!tPlatformCountryData[metric]){
                                tPlatformCountryData[metric]=parseFloat(tPlacement[country][metric]);
                            }else{
                                tPlatformCountryData[metric]=parseFloat(tPlatformCountryData[metric])+parseFloat(tPlacement[country][metric]);
                            }
                        }
                    }
                }
            }
        }

        let tMap = [];
        tDataMap.unknown=undefined;
        for(let sPlatform in tDataMap){
            let tPlatformData = tDataMap[sPlatform];
            for(let sPlacementId in tPlatformData){
                let tPlacementData = tPlatformData[sPlacementId];
                for( let sCountry in tPlacementData){
                    let tConvertedData = {}
                    let tMetricData = tPlacementData[sCountry];
                    tConvertedData["AD_UNIT"] = sPlacementId;
                    tConvertedData["COUNTRY"] = sCountry.toUpperCase();
                    tConvertedData["PLATFORM"] = sPlatform;
                    tConvertedData["REVENUE"] =  tMetricData["fb_ad_network_revenue"] || 0;
                    tConvertedData["REQUEST"] = tMetricData["fb_ad_network_request"] || 0;
                    tConvertedData["VIEWS"] = tMetricData["fb_ad_network_imp"] || 0;
                    tConvertedData["AVALABLE"] = tMetricData["fb_ad_network_filled_request"] || 0;
                    tConvertedData["CLICKED"] = tMetricData["fb_ad_network_click"] || 0;
                    tConvertedData["COMPLETES"] = 0;
                    tConvertedData["DATE"] = "";
                    tMap.push(tConvertedData);
                }
            }
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            let sPlatForm = tRowData.PLATFORM;
            if(!tDayData[sPlatForm]){
                tDayData[sPlatForm] = {};
            }
            if(!tDayData[sPlatForm][sCountry]){
                tDayData[sPlatForm][sCountry] = {}
            }
            if(!tDayData[sPlatForm][sCountry][sAdUnit]){
                tDayData[sPlatForm][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0,CLICKED:0}
            }
            let tAdDayData = tDayData[sPlatForm][sCountry][sAdUnit];
            tAdDayData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdDayData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdDayData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdDayData.CLICKED+=parseInt(tRowData.CLICKED);
            tAdDayData.COMPLETES+=parseInt(tRowData.COMPLETES);
            tAdDayData.REVENUE+=parseFloat(tRowData.REVENUE);    
        }
        return tDayData
    }
    
    function ProcessMintegralData(sBody){
        let tBody = JSON.parse(sBody);
        if(!tBody){
            return;
        }
        let tDataList = tBody.data;
        if(!tDataList){
            return;
        }
        let tMap = [];
        for(let tData of tDataList.lists){
            let tConvertedData = {}
            tConvertedData["APP_ID"] = tData["app_id"];
            tConvertedData["APP_NAME"] = tData["app_name"];
            tConvertedData["COUNTRY"] = tData["country"];
            tConvertedData["AD_UNIT"] = tData["unit_id"]
            tConvertedData["PLATFORM"] = tData["platform"];
            tConvertedData["REVENUE"] = tData["est_revenue"];
            tConvertedData["REQUEST"] = tData["request"];
            tConvertedData["AVALABLE"] = tData["filled"];
            tConvertedData["VIEWS"] = tData["impression"];
            tConvertedData["COMPLETES"] = tData["completes"];
            tConvertedData["CLICKED"] = tData["click"];
            tConvertedData["ECPM"] = tData["ecpm"];
            tConvertedData["DATE"] = tData["date"];
            tMap.push(tConvertedData);
        }
        let tDayData = {}
        for(let tRowData of tMap){
            let sAppID = tRowData.APP_ID
            let sCountry = tRowData.COUNTRY
            let sAdUnit = tRowData.AD_UNIT
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID]){
                tDayData[sAppID] = {}
            }
            if(!tDayData[sAppID][sCountry]){
                tDayData[sAppID][sCountry] = {}
            }
            if(!tDayData[sAppID][sCountry][sAdUnit]){
                tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,CLICKED:0,COMPLETES:0}
            }
            let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
            tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
            tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
            tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);
            tAdUnitData.CLICKED+=parseInt(tRowData.CLICKED);
            tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
            tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE);    
        }
        return tDayData
    }

    async function RequestUnityData(sDate,sKey,pCallback){
        let sURL="https://gameads-admin.applifier.com/stats/monetization-api?apikey={}&splitBy=country,zone&fields=adrequests,available,views,started,revenue,platform&start={}T00:00:00.000Z&end={}T00:00:00.000Z&scale=day"
        let sNextDayTime = moment(sDate).add(1,"days").format("YYYY-MM-DD");
        let URL_STR = STR_FORMAT(sURL,sKey,sDate,sNextDayTime);
        let tUnityOptions = 
        {
            url:URL_STR, 
            method: 'GET', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept':'application/json'
            }
        };
        let rep = await DoRequest(tUnityOptions);
        let tUnityData = ProcessUnityData(rep.body)
        pCallback(tUnityData);
    }

    async function RequestVungleData(sDate,sKey,pCallback){
        let sURL = "https://report.api.vungle.com/ext/pub/reports/performance?dimensions=date,application,country,incentivized,platform&aggregates=views,completes,clicks,revenue,ecpm&start={}&end={}";
        let URL_STR = STR_FORMAT(sURL,sDate,sDate);
        let tVungleOptions = 
        {
            url:URL_STR, 
            method: 'GET', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept':'application/json',
                'Authorization': 'Bearer '+sKey,
                'Vungle-Version':'1',
                'Accept':'application/json'
            }
        };
        let rep = await DoRequest(tVungleOptions);
        let tVungleData = ProcessVungleData(rep.body)
        pCallback(tVungleData);     
    }

    async function RequestApplovinData(sDate,sKey,pCallback){
        let sURL = "https://r.applovin.com/report?api_key={}&start={}&end={}&columns=day,platform,country,application,package_name,size,ad_type,impressions,ctr,clicks,ecpm,revenue,device_type&format=json"
        let URL_STR = STR_FORMAT(sURL,sKey,sDate,sDate);
        let tApplovinOptions = 
        {
            url:URL_STR, 
            method: 'GET', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept':'application/json',
            }
        };
        let rep = await DoRequest(tApplovinOptions);
        let tApplovinData = ProcessApplovinData(rep.body)
        pCallback(tApplovinData);
    }

    async function RequestMopubData(sDate,sReportKey,sApiKey,pCallback){
        let sURL = "https://app.mopub.com/reports/custom/api/download_report?report_key={}&api_key={}&date={}"
        let URL_STR = STR_FORMAT(sURL,sReportKey,sApiKey,sDate);
        let tOptions = 
        {
            url:URL_STR,
            method: 'GET'
        };
        let rep = await DoRequest(tOptions);
        let tMopubData = ProcessMopubData(rep.body)
        pCallback(tMopubData);
    }
    
    async function RequestAdmobData(sDate,pCallback){
        let sURL = "http://localhost:9000/query_admob"
        let tOptions={
            url:sURL,
            method: 'GET',
            headers:{
                'Content-Type': 'application/json',
                'Accept':'application/json'     
            },
            body:JSON.stringify({
                Date:sDate
            }) 
        }
        let rep = await DoRequest(tOptions);
        let tAdmobData = ProcessAdmobData(rep.body);
        pCallback(tAdmobData);
    }
    
    async function RequestFacebookData(sDate,sToken,sID,pCallback){
        let nLimit = 20000;
        let doQueryAll=async()=>{
            let sURL = "https://graph.facebook.com/v3.2/{}/adnetworkanalytics/?metrics=['fb_ad_network_imp','fb_ad_network_filled_request','fb_ad_network_ctr','fb_ad_network_request','fb_ad_network_click','fb_ad_network_revenue']&since={}&until={}&breakdowns=['platform','country','placement']&access_token={}&limit={}"
            let URL_STR = STR_FORMAT(sURL,sID,sDate,sDate,sToken,nLimit);
            let FACEBOOK_RESULT_QUERY = STR_FORMAT("https://graph.facebook.com/v3.2/{}/adnetworkanalytics_results/?query_ids=['",sID);    
            let tOptions = 
            {
                url:URL_STR,
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Accept':'application/json'     
                }
            }
            let rep = await DoRequest(tOptions);
            let tData = JSON.parse(rep.body);
            if(tData){
                let tQueryResultOptions={
                    url: FACEBOOK_RESULT_QUERY+tData.query_id+"']&access_token="+sToken, 
                    method: 'GET', 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept:'application/json'
                }
                let doQuery = null;
                doQuery =()=>{
                    setTimeout( async()=>{ 
                        let result = await DoRequest(tQueryResultOptions)
                        let tBody = JSON.parse(result.body);
                        if(tBody.data[0].status != "complete"){
                            if(tBody.data[0].status == "invalid" || tBody.data[0].status == "requested" ){
                                nLimit-=100;
                                doQueryAll();
                                return
                            }
                            doQuery();
                            return;
                        }
                        let tFacebookData = ProcessFacebookData(tBody);
                        pCallback(tFacebookData);
                    }, 5000);
                }
                doQuery();
            }
        }
        doQueryAll();
    }

    async function RequestMintegralData(sDate,sKey,sSecret,pCallback){
        let sURL = "http://oauth2.mobvista.com/m/report/offline_api_report?"
        let nTime = moment().format("X")
        let sQueryDate = moment(sDate,"YYYY-MM-DD").format("YYYYMMDD");
        let sParams = `skey=${sKey}&time=${nTime}&start=${sQueryDate}&end=${sQueryDate}&v=1.0&group_by=`+encodeURIComponent("date,app_id,unit_id,country,platform");
        let sSortedParms = sParams.split("&").sort().join("&");
        let sSign = cryptMd5(cryptMd5(sSortedParms)+sSecret);
        sURL+=sParams+"&sign="+sSign;
        let tMintegralOptions = 
        {
            url:sURL, 
            method: 'GET', 
            headers: { 
                'Content-Type': 'x-www-form-urlencoded;charset=utf-8',
                'Accept':'application/json',
            }
        };
        let rep = await DoRequest(tMintegralOptions);
        let tMintegralData = ProcessMintegralData(rep.body)
        pCallback(tMintegralData);
    }

if (typeof exports !== "undefined") {
    exports.RequestUnityData = RequestUnityData;
    exports.RequestVungleData  = RequestVungleData;
    exports.RequestApplovinData = RequestApplovinData;
    exports.RequestMopubData = RequestMopubData;
    exports.RequestAdmobData=RequestAdmobData;
    exports.RequestFacebookData=RequestFacebookData;
    exports.RequestMintegralData=RequestMintegralData;
}
else {
    window.RequestUnityData = RequestUnityData;
    window.RequestVungleData = RequestVungleData;
    window.RequestApplovinData=RequestApplovinData;
    window.RequestMopubData=RequestMopubData;
    window.RequestAdmobData=RequestAdmobData;
    window.RequestFacebookData=RequestFacebookData;
    window.RequestMintegralData=RequestMintegralData;

    if (typeof define === "function" && define.amd) {
        define(function() {
            return {
                RequestUnityData: RequestUnityData,
                RequestVungleData: RequestVungleData,
                RequestApplovinData:RequestApplovinData,
                RequestMopubData:RequestMopubData,
                RequestAdmobData:RequestAdmobData,
                RequestFacebookData:RequestFacebookData,
                RequestMintegralData:RequestMintegralData
            }
        })
    }
}
})(typeof window === "undefined" ? this : window);