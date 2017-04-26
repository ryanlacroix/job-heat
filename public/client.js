// Store the results here for building the map
cities = [];

var geocoder;
var map;

window.onload = function() {
	$('#submitSearch').click(sendSearch);
}

function sendSearch () {
	var searchQuery = $('#searchTitle').val();
	$.ajax({
		method: "GET",
		url: '/jobreq/' + searchQuery,
		success: showResult
	});
}

function showResult (data) {
	// Clear the search page from the screen and show results
	var result = JSON.parse(data);
	// Store the cities for building the map
	cities = result.cities;
	$('.container-search').fadeOut(1000, function () {
		$(this).remove();
		setTimeout(function() {
			$('#main').append("<h1 id='resTitle'>Results for: " + result.jobTitle + "</h1>");
			$('#main').append("<div class='container-result'></div>");
			
			$('.container-result').hide();
			$('.container-result').fadeIn(1000);
			$('.container-result').append("<ol id='result-list'></ol>");
			for (var i = 0; i < result.cities.length; i++) {
				$('#result-list').append('<li>'+ (i+1) + '. ' + result.cities[i].name + ' ' + jobPopularity(result.cities[i].quantity) + '</li>');
			}
			// get the maps API and show results
			loadMapAPI();
		}, 50);
	});
}

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

function loadMapAPI(){
	var script = document.createElement("script");
	script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBDI7wd_B8E_iuyV0g1xhNkPu1npe1JkA8&libraries=visualization&callback=buildMap";
	script.type = "text/javascript";
	document.getElementsByTagName("head")[0].appendChild(script);
}

// Builds the heat map on the page based on query results
function buildMap(mapData) {
	$("<div id='map'></div>").insertAfter($('#resTitle'));
	
	var canadaPos = {lat: 51, lng: -92};
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 4,
		center: canadaPos
	});
	geocoder = new google.maps.Geocoder();
	getCityPositions(cities)
}


var heatList = []
function getCityPositions(cityList, callback) {
	for (let city of cityList) {
		geocoder.geocode( {'address': city.name}, function(results, status){
			if (status == 'OK') {
				heatList.push({location: results[0].geometry.location, weight: city.quantity*20});
				
				/*var marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location */
			} else {
				console.log("Something went wrong!" + status);
			}
			
			// All locations have been determined
			if (heatList.length >= cityList.length) {
				var heatMap = new google.maps.visualization.HeatmapLayer({
					data: heatList,
					radius: 30
				});
				heatMap.setMap(map);
			}
		});			
	}
}












