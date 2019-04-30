/*
 * @Description: 
 * @Author: cw
 * @LastEditors: cw
 * @Date: 2019-04-03 17:43:25
 * @LastEditTime: 2019-04-24 16:41:44
 */
let express = require('express');
let Session = require('express-session');
let request = require('request');
var bodyParser = require('body-parser');
let moment = require('moment');
let DataMgr = require('./DataMgr.js');
const {google} = require('googleapis'); 
var morgan = require('morgan');
let adsenseApi = google.adsense("v1.4");
let tGooleTokens = null;
var OAuth2 = google.auth.OAuth2;
var ClientId = "557432904618-eajklf64jdckvobgksimvstfnm33aefc.apps.googleusercontent.com";
var ClientSecret = "Hs8JnvWm99Nxco1UzFdPTF1l";
var RedirectUrl = "http://www.cwpro.xyz:9000/oauthCallback";

const STR_FORMAT = require('string-format');
let fs = require('fs');
var PORT = 9000;
var app = express();
let T_CONFIG = {}

app.use(morgan('short'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({type: 'text/plain'}))
app.use(bodyParser.text({ type: 'text/html' }))

app.use(Session({
    secret: 'secret-19890913007',
    resave: true,
    saveUninitialized: true
}));


app.use(express.static("./public"))
if(!fs.existsSync("./saved_data")){
    fs.mkdirSync("./saved_data");
}

/**
 * 创建OAuth客户端
 */
function getOAuthClient() {
    return new OAuth2(ClientId, ClientSecret, RedirectUrl);
}
/**
 * 生成向认证服务器申请认证的Url
 */
function getAuthurl() {
    var oauth2Client = getOAuthClient();
    // 生成一个url用来申请Googe+和Google日历的访问权限
    var scopes = [
        'https://www.googleapis.com/auth/adsense.readonly'
        // 'https://www.googleapis.com/auth/calendar'
    ];
    var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        // Optional property that passes state parameters to redirect URI
        state: { foo: 'bar' }
    });
    return url;
}

app.get("/oauthCallback", function(req, res) {
    // 获取url中code的值
    var code = req.query.code;
    var session = req.session;
    // 使用授权码code，向认证服务器申请令牌
    var oauth2Client = getOAuthClient();
    oauth2Client.getToken(code, function(err, tokens) {
        // tokens包含一个access_token和一个可选的refresh_token
        if (!err) {
            oauth2Client.setCredentials(tokens);
            tGooleTokens=tokens;
            session["tokens"] = tokens;
            res.writeHead(200,{'Content-Type':'text/html'})
            fs.readFile("./page/Login.html",(err,data)=>{
                res.end(data)
            });
            return
        } else {
            res.send(`<h3>Login failed!!</h3>`)
        }
    });
});

app.get("/refetch_sevendays", function(req, res) {
    var session = req.session;
    if(!session["tokens"]){
        let url = getAuthurl();
        res.send(`<h1>Google Play授权</h1><a href=${url}>点击授权</a>`);
        return
    }
    DataMgr.Instance.refetchSevenDay();
});

app.get("/debug",async(req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html'})
    fs.readFile("./page/Login.html",(err,data)=>{
        res.end(data)
    });
});

app.get("/main",async(req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html'})
    if(req.session.sign){
        fs.readFile("./page/ReportTool.html","utf-8",(err,data)=>{
            res.end(data)
          });
        return
    }
});

app.get("/auth",async(req,res)=>{
    var session = req.session;
    if(!session["tokens"]){
        let url = getAuthurl();
        res.send(`<h1>Google Play授权</h1><a href=${url}>点击授权</a>`);
        return
    }
    res.writeHead(200,{'Content-Type':'text/html'})
    if(req.session.sign){
        fs.readFile("./page/ReportTool.html","utf-8",(err,data)=>{
            res.end(data)
          });
        return
    }
    fs.readFile("./page/Login.html",(err,data)=>{
      res.end(data)
    });
});

app.post("/login_form",async(req,res)=>{
    if(req.session.sign){
        res.send({status:"success"});  
        return;
    }
    let tBody = req.body;
    let sAccount = tBody["record[Account]"];
    let sPassword = tBody["record[Password]"];
    let sPwd = T_CONFIG.Account[sAccount];
    if(sPwd == sPassword){
        req.session.sign=true;
        res.send({status:"success"});       
    }else{
        res.send({status:"success",err:"PWD_ERR"});  
    }
});

app.get("/", async(req, res)=> {
    fs.readFile("./page/Login.html",(err,data)=>{
        res.end(data)
      });    
});

app.get("/query_admob",(req,res)=>{
    let tBody = req.body;
    if(!tGooleTokens||!tBody){
        res.send("");
        return;
    }
    var oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tGooleTokens);
    adsenseApi.reports.generate({
            auth:oauth2Client,
            accountId:"pub-5725037281077458",
            startDate:tBody.Date,
            endDate:tBody.Date,
            dimension:[
                "DATE", "APP_ID", "APP_NAME", "APP_PLATFORM", "AD_UNIT_NAME", "AD_UNIT_ID", "COUNTRY_CODE"
            ],
            metric:[
                "AD_REQUESTS", "CLICKS", "INDIVIDUAL_AD_IMPRESSIONS", "EARNINGS", "MATCHED_AD_REQUESTS"
            ],
            useTimezoneReporting:true
        },
        function(err, response){
            if (!err) {
                let text = ""
                let rows = response.data.rows;
                if(rows){
                    for(let val of rows){
                        text+=val+"\n";
                    }
                }
                res.send(text);
            } else {
                res.send()
            }
        }
    )
});

app.get("/unity", async(req, res)=> {
    // let rep = await DoRequest(tUnityOptions);
    // if( !rep ){
    //     return
    // }
    // let tUnityData = ProcessUnityData(rep.body)
    // let sFileName = "./saved_data/"+moment().format("YYYY_MM_DD") + "_UnityAds.json";
    // fs.writeFile(sFileName,JSON.stringify(tUnityData),(err)=>{
    //     console.log(err);
    // })
    let now = moment();
    let nFinishCount = 0;
    for(let i = 0; i<3;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/UnityAds.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetUnityDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                        console.log("nFinishCount " + nFinishCount);
                    }
                })
            });
        }
    }
});

app.post("/query_form", async(req, res)=> {
    let tBody = JSON.parse(req.body.request);
    if(!tBody){
        return;
    }
    if(tBody.Type=="app_list"){
        res.send({status:"success",data:T_CONFIG.Apps});
        return;
    }
    DataMgr.Instance.GetNetworkDateData(tBody.Type,tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
});

app.post("/query_network_data", async(req, res)=> {
    let tBody = req.body;
    if(!tBody){
        return;
    }
    DataMgr.Instance.GetNetworkDateData(tBody.Type,tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
});

app.post("/query_data", async(req,res)=>{
    let tBody = req.body
    if(!tBody){
        return;
    }
    DataMgr.Instance.GetDateSavedAllData(tBody.Date,(tData)=>{
        res.send({status:"success",data:tData});
    });
})

app.get("/vungle", async(req, res)=> {
    // let rep = await DoRequest(tUnityOptions);
    // if( !rep ){
    //     return
    // }
    // let tUnityData = ProcessUnityData(rep.body)
    // let sFileName = "./saved_data/"+moment().format("YYYY_MM_DD") + "_UnityAds.json";
    // fs.writeFile(sFileName,JSON.stringify(tUnityData),(err)=>{
    //     console.log(err);
    // })
    let now = moment();
    let nFinishCount = 0;
    for(let i = 0; i<5;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/Vungle.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetVungleDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                    }
                })
            });
        }
    }
});

app.get("/applovin", async(req, res)=> {
    // let rep = await DoRequest(tUnityOptions);
    // if( !rep ){
    //     return
    // }
    // let tUnityData = ProcessUnityData(rep.body)
    // let sFileName = "./saved_data/"+moment().format("YYYY_MM_DD") + "_UnityAds.json";
    // fs.writeFile(sFileName,JSON.stringify(tUnityData),(err)=>{
    //     console.log(err);
    // })
    let now = moment();
    let nFinishCount = 0;
    for(let i = 0; i<7;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/Applovin.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetApplovinDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                        console.log("nFinishCount " + nFinishCount);
                    }
                })
            });
        }
    }
});

app.get("/mopub", async(req, res)=> {
    // let rep = await DoRequest(tUnityOptions);
    // if( !rep ){
    //     return
    // }
    // let tUnityData = ProcessUnityData(rep.body)
    // let sFileName = "./saved_data/"+moment().format("YYYY_MM_DD") + "_UnityAds.json";
    // fs.writeFile(sFileName,JSON.stringify(tUnityData),(err)=>{
    //     console.log(err);
    // })
    let now = moment();
    let nFinishCount = 0;
    for(let i = 1; i<8;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/Mopub.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetMopubDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                        console.log("nFinishCount " + nFinishCount);
                    }
                })
            });
        }
    }
});

app.get("/facebook", async(req, res)=> {
    // let rep = await DoRequest(tUnityOptions);
    // if( !rep ){
    //     return
    // }
    // let tUnityData = ProcessUnityData(rep.body)
    // let sFileName = "./saved_data/"+moment().format("YYYY_MM_DD") + "_UnityAds.json";
    // fs.writeFile(sFileName,JSON.stringify(tUnityData),(err)=>{
    //     console.log(err);
    // })
    let now = moment();
    let nFinishCount = 0;
    for(let i = 1; i<=3;i++){
        let sTime = now.subtract(1,"days").format("YYYY-MM-DD");
        if(!fs.existsSync("./saved_data/"+sTime)){
            fs.mkdirSync("./saved_data/"+sTime);
        }
        let sFileName = "./saved_data/"+ moment(sTime).format("YYYY-MM-DD") + "/Facebook.json";
        if(fs.existsSync(sFileName)){
            nFinishCount++;
            if(nFinishCount==30){
                console.log("nFinishCount " + nFinishCount);
            }
        }else{
            GetFacebookDateData(sTime,(tData)=>{
                fs.writeFile(sFileName,JSON.stringify(tData),(err)=>{
                    if(!err){
                        nFinishCount++;
                    }
                    if(nFinishCount==30){
                        console.log("nFinishCount " + nFinishCount);
                    }
                })
            });
        }
    }
});

async function GetUnityDateData(sDate,pCallback){
    let sURL="https://gameads-admin.applifier.com/stats/monetization-api?apikey={}&splitBy=country,zone&fields=adrequests,available,views,started,revenue,platform&start={}T00:00:00.000Z&end={}T00:00:00.000Z&scale=day"
    let sNextDayTime = moment(sDate).add(1,"days").format("YYYY-MM-DD");
    let URL_STR = STR_FORMAT(sURL,T_CONFIG.Keys.UnityAds,sDate,sNextDayTime);
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

async function GetVungleDateData(sDate,pCallback){
    let sURL = "https://report.api.vungle.com/ext/pub/reports/performance?dimensions=date,application,country,incentivized,platform&aggregates=views,completes,clicks,revenue,ecpm&start={}&end={}";
    let URL_STR = STR_FORMAT(sURL,sDate,sDate);
    let tVungleOptions = 
    {
        url:URL_STR, 
        method: 'GET', 
        headers: { 
            'Content-Type': 'application/json',
            'Accept':'application/json',
            'Authorization': 'Bearer '+T_CONFIG.Keys.Vungle,
            'Vungle-Version':'1',
            'Accept':'application/json'
        }
    };
    let rep = await DoRequest(tVungleOptions);
    let tVungleData = ProcessVungleData(rep.body)
    pCallback(tVungleData);
}

async function GetApplovinDateData(sDate,pCallback){
    let sURL = "https://r.applovin.com/report?api_key={}&start={}&end={}&columns=day,platform,country,application,package_name,size,ad_type,impressions,ctr,clicks,ecpm,revenue,device_type&format=json"
    let URL_STR = STR_FORMAT(sURL,T_CONFIG.Keys.Applovin,sDate,sDate);
    let tVungleOptions = 
    {
        url:URL_STR, 
        method: 'GET', 
        headers: { 
            'Content-Type': 'application/json',
            'Accept':'application/json',
            'Authorization': 'Bearer '+T_CONFIG.Keys.Vungle,
            'Vungle-Version':'1',
            'Accept':'application/json'
        }
    };
    let rep = await DoRequest(tVungleOptions);
    let tApplovinData = ProcessApplovinData(rep.body)
    pCallback(tApplovinData);
}

async function GetMopubDateData(sDate,pCallback){
    let sURL = "https://app.mopub.com/reports/custom/api/download_report?report_key={}&api_key={}&date={}"
    let URL_STR = STR_FORMAT(sURL,T_CONFIG.Keys.MopubReportKey,T_CONFIG.Keys.MopubApiKey,sDate);
    let tOptions = 
    {
        url:URL_STR,
        method: 'GET'
    };
    let rep = await DoRequest(tOptions);
    let tMopubData = ProcessMopubData(rep.body)
    pCallback(tMopubData);
}

async function GetFacebookDateData(sDate,pCallback){
    let sURL = "https://graph.facebook.com/v3.2/{}/adnetworkanalytics/?metrics=['fb_ad_network_imp','fb_ad_network_filled_request','fb_ad_network_cpm','fb_ad_network_request','fb_ad_network_click','fb_ad_network_revenue']&since={}&until={}&breakdowns=['platform','country','placement']&access_token={}"
    let URL_STR = STR_FORMAT(sURL,T_CONFIG.Keys.Facebook.Tricky3.ID,sDate,sDate,T_CONFIG.Keys.Facebook.Tricky3.Token);
    let FACEBOOK_RESULT_QUERY = STR_FORMAT("https://graph.facebook.com/v3.2/{}/adnetworkanalytics_results/?query_ids=['",T_CONFIG.Keys.Facebook.Tricky3.ID);
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
            url: FACEBOOK_RESULT_QUERY+tData.query_id+"']&access_token="+T_CONFIG.Keys.Facebook.Tricky3.Token, 
            method: 'GET', 
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept:'application/json'
        }
        setTimeout( async()=>{ 
            let result = await DoRequest(tQueryResultOptions)
            let tFacebookData = ProcessFacebookData(result.body);
            pCallback(tFacebookData);
        }, 5000);
    }
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
        // tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
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
        if( (tData["Order"]=="MPX"||[tData["Order"]=="MarketPlace"])&&tData["App ID"]){
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
            tConvertedData["REVENUE"] = tData["Revenue"];
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
            tDayData[sAppID][sCountry][sAdUnit]={REQUEST:0,AVALABLE:0,VIEWS:0,REVENUE:0,COMPLETES:0}
        }
        let tAdUnitData = tDayData[sAppID][sCountry][sAdUnit];
        tAdUnitData.REQUEST+=parseInt(tRowData.REQUEST);
        tAdUnitData.AVALABLE+=parseInt(tRowData.AVALABLE);
        tAdUnitData.VIEWS+=parseInt(tRowData.VIEWS);
        tAdUnitData.COMPLETES+=parseInt(tRowData.COMPLETES);
        tAdUnitData.REVENUE+=parseFloat(tRowData.REVENUE);    
    }
    return tDayData
}

function ProcessFacebookData(sBody){
    let tBody = JSON.parse(sBody);
    if(!tBody||!tBody.data||!tBody.data[0]||!tBody.data[0].results){
        return;
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
                tConvertedData["APP_ID"] = "";
                tConvertedData["APP_NAME"] = "";
                tConvertedData["AD_UNIT"] = sPlacementId;
                tConvertedData["COUNTRY"] = sCountry.toUpperCase();
                tConvertedData["PLATFORM"] = sPlatform;
                tConvertedData["REVENUE"] =  tMetricData["fb_ad_network_revenue"] || 0;
                tConvertedData["REQUEST"] = tMetricData["fb_ad_network_request"] || 0;
                tConvertedData["VIEWS"] = tMetricData["fb_ad_network_imp"] || 0;
                tConvertedData["COMPLETES"] = tMetricData["fb_ad_network_filled_request"] || 0;
                tConvertedData["CLICKED"] = tMetricData["fb_ad_network_click"] || 0;
                tConvertedData["ECPM"] = tMetricData["fb_ad_network_cpm"] || 0;
                tConvertedData["DATE"] = "";
                tMap.push(tConvertedData);
            }
        }
    }
    return tMap;
}

let DoRequest = function(tOptions){
    return new Promise(function (resolve, reject) {
        if(tOptions.method=="GET"){
            request.get(tOptions, function(err, response, body){
                if(err){
                    console.log(err);
                    reject();
                }else{
                    resolve(response);
                }
            });
        }
        else if(tOptions.method=="POST"){
            request.post(tOptions, function(err, response, body){
                if(err){
                    console.log(err);
                    reject();
                }else{
                    resolve(response);
                }
            });
        }
    });
}


fs.readFile("./config.json",'utf-8', function(err, data) {  
    T_CONFIG=JSON.parse(data);
    app.listen(PORT,()=>{
        DataMgr.Instance.Init(T_CONFIG);
        DataMgr.Instance.Start();
    });
});