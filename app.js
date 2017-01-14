var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var citySearch = require('./citySearch');

var app = express();

app.use("*", function (req, res, next) {
	console.log(req.url);
	next();
})

app.use(express.static("./public"));
// Home route
app.get('/', function (req, res) {
	//res.writeHead('200', 'content-type': mime.lookup(filename)||'text/html');
	data = fs.readFileSync('./public/index.html'); // needs root dir
	res.end(data);
});

app.get('/jobreq/:jobTitle', function (req, res){
	var jobTitle = req.params.jobTitle;
	jobTitle = jobTitle.replace(' ', '-');
	url = 'http://ca.indeed.com/' + jobTitle + '-jobs';
	console.log(url);
	request(url, function (err, response, html) {
		if (err) {
			console.log("Could not connect to" + url);
		} else {
			var $ = cheerio.load(html);
			console.log('request succeeded');
			//console.log(html);
			
			var totalJobs;
			$('#searchCount').filter(function() {
				var rawJobs = $(this).text();
				totalJobs = rawJobs.substring(rawJobs.indexOf("f")+1, rawJobs.length);
				console.log('Total jobs: ' + totalJobs);
				//res.send(totalJobs);
				citySearch.getTopCities(jobTitle, totalJobs, function (cityList) {
					var sendObj = {
						'jobTitle': jobTitle, 
						'cities': cityList, 
						'totalJobs': totalJobs
					}
					console.log(sendObj);
					res.send(JSON.stringify(sendObj));
				});
			});
		}
	});
});

app.listen('2406');
console.log('listening for requests on 2406');
















// whiterabbit4fun