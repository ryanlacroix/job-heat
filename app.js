var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var citySearch = require('./citySearch');

var app = express();
var ROOT = './public';

app.use("*", function (req, res, next) {
	console.log(req.url);
	next();
})

app.use(express.static("./public"));
// Home route
app.get('/', function (req, res) {
	data = fs.readFileSync(ROOT + '/index.html');
	res.end(data);
});

// Request received for a job title
app.get('/jobreq/:jobTitle', function (req, res){
	var jobTitle = req.params.jobTitle;
	jobTitle = jobTitle.replace(' ', '-');
	url = 'http://ca.indeed.com/' + jobTitle + '-jobs';
	console.log(url);
	// Retrieve the listings from indeed
	request(url, function (err, response, html) {
		if (err) {
			console.log("Could not connect to" + url);
		} else {
			var $ = cheerio.load(html);
			console.log('request succeeded');
			var totalJobs;
			$('#searchCount').filter(function() {
				var rawJobs = $(this).text();
				totalJobs = rawJobs.substring(rawJobs.indexOf("f")+1, rawJobs.length);
				// Generate a list of top cities
				citySearch.getTopCities(jobTitle, totalJobs, function (cityList) {
					var sendObj = {
						'jobTitle': jobTitle, 
						'cities': cityList, 
						'totalJobs': totalJobs
					}
					res.send(JSON.stringify(sendObj));
				});
			});
		}
	});
});

app.listen(process.env.PORT || 2406);
console.log('listening for requests on 2406');