// var unirest = require("unirest");

// var req = unirest("GET", "https://public-holiday.p.rapidapi.com/2019/US");

// req.headers({
// 	"x-rapidapi-key": "106866b528mshd91928d65597dc8p19215djsnf92885ea168d",
// 	"x-rapidapi-host": "public-holiday.p.rapidapi.com",
// 	"useQueryString": true
// });


// req.end(function (res) {
// 	if (res.error) throw new Error(res.error);

// 	console.log(res.body);
// });

var unirest = require('unirest');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const { json } = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var countryJSON;
var countryName;
var countryCode;

var holidayData;
var holidayDate;
var holidayJSON;
var holidayName;
var holidayLocalName;

var regionData;
var regionJSON;
var regionName;
var regionISOCode;

var cityData;
var cityJSON;
var cityLongitude;
var cityLatitude;
var cityName;

var weatherData;
var rentalData;

app.set("view engine", "ejs");
app.use(express.static('public'));

//Handle user's post
app.post('/getCountry',urlencodedParser, function(req,res){
    countryJSON = JSON.parse(req.body.country);
    countryCode = countryJSON.countryCode;
    countryName = countryJSON.countryName;
    // Get public holiday
    unirest.get("https://public-holiday.p.rapidapi.com/2022/" + countryCode)
        .header("X-RapidAPI-Key", "106866b528mshd91928d65597dc8p19215djsnf92885ea168d")
        .header("x-rapidapi-host", "public-holiday.p.rapidapi.com")
        .header("useQueryString", true)
        .end(function (result) {
            holidayData = result.body;
            //Get region
            unirest.get("https://wft-geo-db.p.rapidapi.com/v1/geo/countries/" + countryCode + "/regions")
                .header("X-RapidAPI-Key", "106866b528mshd91928d65597dc8p19215djsnf92885ea168d")
                .header("x-rapidapi-host", "wft-geo-db.p.rapidapi.com")
                .header("useQueryString", true)    
                .query({
                    "limit": "10"
                })
                .end(function (result) {
                    regionData = result.body.data;
                    res.render('region-success', {
                        holiday: holidayData, 
                        region:regionData, 
                        countryName: countryName});   
                    app.post('/getRegion', urlencodedParser, function(req, res){
                        regionJSON = JSON.parse(req.body.region);
                        regionISOCode = regionJSON.isoCode;
                        regionName = regionJSON.regionName;
                        //Get city
                        unirest.get("https://wft-geo-db.p.rapidapi.com/v1/geo/countries/"+ countryCode +"/regions/" + regionISOCode + "/cities")
                            .header("X-RapidAPI-Key", "106866b528mshd91928d65597dc8p19215djsnf92885ea168d")
                            .header("x-rapidapi-host", "wft-geo-db.p.rapidapi.com")
                            .header("useQueryString", true)
                            .query({
                                "limit": "10"
                            })
                            .end(function (result){
                                cityData = result.body.data;
                                res.render('city-success', {
                                    holiday: holidayData, 
                                    region:regionData, 
                                    regionName:regionName,
                                    countryName : countryName,
                                    city: cityData
                                })
                                app.post('/getCity', urlencodedParser, function(req, res){
                                    cityJSON = JSON.parse(req.body.city);
                                    cityLatitude = cityJSON.latitude;
                                    cityLongitude = cityJSON.longitude;
                                    cityName = cityJSON.name;
                                    res.render('holiday-success', {
                                        holiday: holidayData, 
                                        region:regionData, 
                                        regionName:regionName,
                                        countryName : countryName,
                                        city: cityData,
                                        cityName: cityName
                                    })
                                    app.post('/getHoliday',urlencodedParser,function(req,res){
                                        holidayJSON = JSON.parse(req.body.holiday);

                                        holidayDate = holidayJSON.holidayDate + "T00:00:00";
                                        holidayName = holidayJSON.holidayName;
                                        holidayLocalName = holidayJSON.holidayLocalName;
                                        //Get weather
                                        unirest.get( "https://dark-sky.p.rapidapi.com/" 
                                        + cityLatitude + "," + cityLongitude + "," + holidayDate)
                                        .header("x-rapidapi-key", "106866b528mshd91928d65597dc8p19215djsnf92885ea168d")
                                        .header("x-rapidapi-host", "dark-sky.p.rapidapi.com")
                                        .header("useQueryString", true)
                                        .end(function(result){
                                            weatherData = result.body.daily.data[0];
                                            //get rental information
                                            unirest.get("https://hotels-com-provider.p.rapidapi.com/v1/hotels/nearby")
                                            .header("x-rapidapi-key", "106866b528mshd91928d65597dc8p19215djsnf92885ea168d")
                                            .header("x-rapidapi-host", "hotels-com-provider.p.rapidapi.com")
                                            .header("useQueryString", true)
                                            .query ({
                                                "checkout_date": CheckoutDate(holidayJSON.holidayDate),
                                                "currency": "USD",
                                                "sort_order": "STAR_RATING_HIGHEST_FIRST",
                                                "adults_number": "1",
                                                "longitude": cityLongitude,
                                                "locale": GetLocale(countryCode),
                                                "latitude": cityLatitude,
                                                "checkin_date": holidayJSON.holidayDate                                    
                                            })
                                            .end(function(result){
                                                rentalData = result.body.searchResults.results;                                       
                                                res.render('info-success', {
                                                    rental: rentalData,
                                                    holiday: holidayData, 
                                                    region:regionData, 
                                                    regionName:regionName,
                                                    countryName : countryName,
                                                    city: cityData,
                                                    cityName: cityName,
                                                    weather:weatherData,
                                                    holidayName: holidayName,
                                                    holidayLocalName: holidayLocalName
                                                    
                                                })
                                            })
                                            
                                        })

                                    })
                                    
                                })

                            });
                    }) 
                });                   
        });        
        
       
})

app.get('/', function(req, res){
    res.render('index');        
})

app.listen(8081, function(){
    console.log('Server running at http://127.0.0.1:8081/');
})

function GetLocale(countryCode){
    switch(countryCode){
        case "CN":
            return "zh_CN";
            break;
        case "JP":
            return "ja_JP";
            break;
        case "KR":
            return "ko_KR";
            break;
        default:
            return "en_"+countryCode;
    }
}

//Get the tomorrow of Checkin Date
function CheckoutDate(checkin_date){
    var dateTime = new Date(checkin_date);
    dateTime= dateTime.setDate(dateTime.getDate() + 1);
    dateTime = new Date(dateTime);
    return dateTime.toLocaleDateString().replace(/\//g, '-');
}