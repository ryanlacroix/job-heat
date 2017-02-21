// This file contains functions relating to the retrieval of job data

var hapi = require("indeed-jobs-api").getInstance("1589380144958658");
var MAX_RESULTS = 2000;

function pageSearcher(b, cityList, jobTitle, totalJobs, callback) {
	hapi.JobSearch().Limit(25).FromResult(b).WhereKeywords([jobTitle]).WhereCountry("ca").SortBy("relevance").IncludePosition(true).UserIP("1.2.3.4").UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36").Search(function (results) {
		var actl = JSON.parse(results).results;
		getCityStats(actl, cityList, function (cityList) {
			cityList = cityList.sort(function (a, b) {
				return b.quantity - a.quantity;
			});
			currPage += 1;
			if ((currPage == (MAX_RESULTS / 25) && b != MAX_RESULTS + 1) || (b >= totalJobs - 25 && b < MAX_RESULTS)) {
				b = MAX_RESULTS + 1;
				// Return top 10 cities
				callback(cityList.slice(0, 10));
			}
		});
	}, function (error) { 
		console.log(error);
	});
}

function doSearch(jobTitle, totalJobs, callback) {
	var cityStats;
	var cityList = [];
	totalJobs = parseInt(totalJobs.replace(',',''));
	currPage = 0;
	for (var i = 0; i < MAX_RESULTS && i < totalJobs; i += 25) {
		pageSearcher(i, cityList, jobTitle, totalJobs, callback);
	}
}

function getCityStats(rawStats, cityList, callback) {
	for (var i = 0; i < rawStats.length; i++) {
		var locationInList = partOf(rawStats[i].city, cityList);
		if (locationInList != "false") {
			cityList[locationInList].quantity += 1;
		}
		else {
			if (rawStats[i].city != "") {
				var tempCity = {};
				tempCity.name = rawStats[i].city;
				tempCity.lat = rawStats[i].latitude;
				tempCity.lon = rawStats[i].longitude;
				tempCity.quantity = 1;
				cityList.push(tempCity);
			}
		}
	}
	callback(cityList);
}
// Check if list already contains city of same name
function partOf(currCityName, cityList) {
	for (var i = 0; i < cityList.length; i++) {
		if (currCityName === cityList[i].name) return i;
	}
	return "false";
	// Return a string to prevent error of interpreting
	// index 0 as false;
}
module.exports.getTopCities = doSearch;