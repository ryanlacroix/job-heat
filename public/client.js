// Store the results here for building the map
cities = [];

var geocoder;
var map;

window.onload = function() {
	$('#submitSearch').click(sendSearch);
	$('.container-search').append("<h3 id='err'>Enter a job title</h3>");
}

// Submit the job query
function sendSearch () {
	if ($('#searchTitle').val().length === 0) {
		$('#err').css("visibility", "visible");
		$('#err').css("opacity", "1");
		$('#err').css("display", "block");
		$('#err').fadeOut(3000);
	} else {
		$('#loadingImg').css("visibility", "visible")
		var searchQuery = $('#searchTitle').val();
		$.ajax({
			method: "GET",
			url: '/jobreq/' + searchQuery,
			success: showResult
		});
	}
}

// Begin building the results page
function showResult (data) {
	var result = JSON.parse(data);
	// Store the cities for building the map
	cities = result.cities;
	$('.container-search').fadeOut(1000, function () {
		// Remove search functionality from the page to make way for results
		$(this).remove();
		setTimeout(function() {
			// Build the results page
			$('#main').append("<div id='titleBarRes'></div>")
			$('#titleBarRes').append("<h2 id='resTitle'>Results for " + result.jobTitle.replace('-', ' ') + ":</h2>");
			$('#titleBarRes').append("<button id='gotoSearch'>Back to search</button>");
			$('#gotoSearch').click(function(){
				$('#main').fadeOut(1000, function() {
					location.reload(true);
				});
			});
			$('#main').append("<div class='container-result'></div>");
			$('.container-result').hide();
			$('.container-result').fadeIn(1000);
			$('.container-result').append("<ol id='result-list'></ol>");
			// Add the cities to the results container
			for (var i = 0; (i < result.cities.length) && (i < 10); i++) {
				$('#result-list').append('<li>'+ (i+1) + '. ' + result.cities[i].name + ' ' + jobPopularity(result.cities[i].quantity) + '</li>');
			}
			// get the maps API and show results
			loadMapAPI();
		}, 50);
	});
}

// Determine popularity of a job in a given city
function jobPopularity(pop) {
	if (pop < 10) {
		return "(<span class='vlow'>very low</span> demand)";
	} else if (pop >= 10 && pop < 30) {
		return "(<span class='rlow'>relatively low</span> demand)";
	} else if (pop >= 30 && pop < 90) {
		return "(<span class='moderate'>moderate</span> demand)";
	}else if (pop >= 90 && pop < 150) {
		return "(<span class='high'>high</span> demand)";
	} else if (pop >= 150) {
		return "(<span class='vhigh'>very high</span> demand)";
	}
}

// Fetch the Map API from Google
function loadMapAPI(){
	var script = document.createElement("script");
	script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBDI7wd_B8E_iuyV0g1xhNkPu1npe1JkA8&libraries=visualization&callback=buildMap";
	script.type = "text/javascript";
	document.getElementsByTagName("head")[0].appendChild(script);
}

// Build the heat map on the page based on query results
function buildMap(mapData) {
	$("<div id='map'></div>").insertAfter($('#titleBarRes'));
	var canadaPos = {lat: 51, lng: -92};
	// Create the map and put it on the page
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 3,
		center: canadaPos
	});
	// Retrieve the locations of the resulting cities
	geocoder = new google.maps.Geocoder();
	getCityPositions(cities)
}


// Retrieve and display the locations of the top ten cities
var heatList = []
function getCityPositions(cityList, callback) {
	for (let city of cityList.slice(0, 10)) {
		geocoder.geocode( {'address': city.name + ', Canada'}, function(results, status){
			if (status == 'OK') {
				// Add this city, location and weight to the heatmap's list
				heatList.push({location: results[0].geometry.location, weight: city.quantity*20});
			} else {
				console.log("Something went wrong!" + status);
			}
			
			// All locations have been determined
			if (heatList.length >= cityList.slice(0, 10).length) {
				// Create the heatmap and overlay it onto the map
				var heatMap = new google.maps.visualization.HeatmapLayer({
					data: heatList,
					radius: 30
				});
				heatMap.setMap(map);
			}
		});			
	}
}