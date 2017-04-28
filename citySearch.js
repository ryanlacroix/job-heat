// This file contains functions relating to the retrieval of job data

var request = require('request');
var cheerio = require('cheerio');

var hapi = require("indeed-jobs-api").getInstance("1589380144958658");
var MAX_RESULTS = 2000;

// Search an individual page of results. The Indeed API only allows maximum 25 results
// at a time, so this is called repeatedly until all results are retrieved.
function pageSearcher(b, cityList, jobTitle, totalJobs, callback) {
	hapi.JobSearch().Limit(25).FromResult(b).WhereKeywords([jobTitle]).WhereCountry("ca").SortBy("relevance").IncludePosition(true).UserIP("1.2.3.4").UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36").Search(function (results) {
		var actl = JSON.parse(results).results;
		// Parse the results into a ranked list
		getCityStats(actl, cityList, function (cityList) {
			cityList = cityList.sort(function (a, b) {
				return b.quantity - a.quantity;
			});
			currPage += 1;
			if ((currPage == (MAX_RESULTS / 25) && b != MAX_RESULTS + 1) || (b >= totalJobs - 25 && b < MAX_RESULTS)) {
				// Reached the end of the search results
				b = MAX_RESULTS + 1;
				// Return top 10 cities
				finishedQueries(cityList.slice(0, 10), callback);
			}
		});
	}, function (error) { 
		console.log(error);
	});
}

// Entry point. Initiates the search across both job sites.
function doSearch(jobTitle, totalJobs, callback) {
	// Do the search using Indeed
	var cityStats;
	var cityList = [];
	totalJobs = parseInt(totalJobs.replace(',',''));
	currPage = 0;
	for (var i = 0; i < MAX_RESULTS && i < totalJobs; i += 25) {
		pageSearcher(i, cityList, jobTitle, totalJobs, callback);
	}
	// Do the same search on Monster
	var monsterJobTitle = jobTitle.replace('-', '%20');
	doSearchMonster(monsterJobTitle, callback);
}

// Add the city into the results appropriately.
function getCityStats(rawStats, cityList, callback) {
	for (var i = 0; i < rawStats.length; i++) {
		var locationInList = partOf(rawStats[i].city, cityList);
		if (locationInList != "false") {
			// City is already in the results list.
			cityList[locationInList].quantity += 1;
		}
		else {
			// City is not already in the results list
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

// Intermediate function, call after each query is completed.
// If all queries are finished, returns results to callback.
var accuList = []
function finishedQueries(cityList, callback) {
	if (accuList.length == 0) {
		accuList = cityList;
		console.log(accuList);
	}
	else {
		// If both search queries have now returned
		accuList = accuList.concat(cityList);
		
		// Merge the two lists
		var mergedCityList = [];
		for (var i = 0; i < accuList.length; i++) {
			var cityName = accuList[i].name;
			var locationInList = partOf(cityName, mergedCityList);
			if (locationInList != "false") {
				// This city is already in the list
				mergedCityList[locationInList].quantity += 1;
			} else {
				// City is not in the list, create an entry for it
				mergedCityList.push({
					name : cityName,
					quantity : accuList[i].quantity
				});
			}
		}
		mergedCityList = mergedCityList.sort(function (a, b) {
				return b.quantity - a.quantity;
		});
		// Create a deep copy of the list
		returnList = JSON.parse(JSON.stringify(mergedCityList));
		// Clear out the list for the next request
		accuList = [];
		callback(returnList);
	}
}

// Scrape the Monster site for job listings
function doSearchMonster(jobTitle, callback) {
	var monsterURL = "https://www.monster.ca/jobs/search/?q=" + jobTitle + "&where=canada&client=classic";
	var options = {
		url: monsterURL,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0'
		}
	};
	// Retrieve Monster site for scraping
	request(options, function(err, response, html) {
		if (err) {
			console.log("Could not connect, " + err);
		} else {
			var $ = cheerio.load(html);
			console.log("Connection to Monster successful!");
			// Get number of jobs available
			var numEntries = $('h2.page-title.visible-xs').text().replace(/^\s+|\s+$/g,'');
			numEntries = parseInt(numEntries.slice(0, numEntries.indexOf(' ')));
			var cityList = [];
			
			// Scrape cities from all result pages
			var i;
			var endPage = 1;
			var currReq = 1;
			var finishedSearch = false;
			for (i = 1; (i < numEntries/25) && (i < 10); i++) {
				var options = {
					url: (monsterURL + '&page=' + i),
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0'
					}
				};
				// Request each page of results to scrape from
				request(options, function(err, response, html) {
					$('div.job-specs p a').each(function (index, element) {
						var cityName = $(element).text();
						var cityName = cityName.slice(0,cityName.indexOf(',')).replace(/^\s+|\s+$/g,'');
						var locationInList = partOf(cityName, cityList);
						if (locationInList != "false") {
							// City is already in the list
							cityList[locationInList].quantity += 1;
						} else {
							// City is not in the list, create an entry for it
							cityList.push({
								name : cityName,
								quantity : 1
							});
						}
						if (currReq == endPage-1 && finishedSearch == false) {
							// Good to send the list back at this point
							finishedSearch = true;
							finishedQueries(cityList, callback);
						}
					});
					currReq++;
				});
			}
			// Keep track of end page, make callback once reached
			endPage = i;
			console.log("Endpage found at " + endPage);
		}
	});
}

module.exports.getTopCities = doSearch;