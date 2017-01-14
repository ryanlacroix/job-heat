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
	$('h1').animate({'padding-top': "-50px"},  500, 'swing', function() {
		$('#main').append("<div class='container-result'></div>");
		//if (result.total)
		$('.container-result').append("<ol id='result-list'></ol>");
		for (var i = 0; i < result.cities.length; i++) {
			$('#result-list').append('<li>'+ (i+1) + '. ' + result.cities[i].name + ' ' + jobPopularity(result.cities[i].quantity) + '</li>');
		}
	}); // dragging whole page?
	$('.container-search').fadeOut(1000, function () {
		$(this).remove();
		
	});
	console.log(result);
	
	console.log(result.jobTitle)
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