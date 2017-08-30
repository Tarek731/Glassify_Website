$(document).ready(function(){
	// hide city and state unless the user clicks no
	$("#localcity").hide();
	$("#localstate").hide();
	$("#jobs").hide();
	$("#radius").hide();

	// keep the job as entered
	var jobBackFromClick = "";
	// sets the user agent for the glassdoor API
	var userAgent = navigator.userAgent;
	// object for the job search
	var queryObject = {
		city: "",
		state: "",
		jobTitle: "",
		searchRadius: 100
	}

	// old public key 9fbbb4e292ade05e28d211f800
	// here is the start of the traitify code
	Traitify.setPublicKey("9301abdf54b6e2506c69f00e43");
	Traitify.setHost("https://api-sandbox.traitify.com");
	Traitify.setVersion("v1");
	var assessmentId = 'a34e0f60-4a12-45e5-8033-9a7380f4e589';
	Traitify.ajax("POST","/assessments",function(data){
		assessmentId = data.id;
		console.log(data);
		Traitify.ui.load(assessmentId, ".assessment");
		var queryURL = "https://api.traitify.com/v1/assessments/a34e0f60-4a12-45e5-8033-9a7380f4e589?data=blend,types,traits,career_matches";
	},
	 {'deck_id': 'career-deck'}
	);

	function displayTraitifyResults (){
		Traitify.get("/assessments/"+assessmentId+"?data=blend,types,traits,career_matches").then(function(data){
			console.log(data);

			// Write the outcome to the screen
			$(".assessment").html("<table><thead><tr><th>Personality Type</th><th>Career</th></tr></thead><tbody>");
			console.log("array length - " + data.personality_types.length)
			for (i=0; i < (data.personality_types.length - 1); i++){
				$(".assessment").append("<tr><td>" + data.personality_types[i].personality_type.name + "</td><td><button class='careerButton btn'>" + data.career_matches[i].career.title + "</button></td></tr>");
	            };
			$(".assessment").append("</tbody></table");
		});
		whereAmI();
	// end display Traitify Results	
	};


	function whereAmI(){
		// This is the geolocator which takes data from the user if the user allows it
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(function(position) {
				console.log(position, position.coords.latitude, position.coords.longitude);
				var address = getReverseGeocodingData(position.coords.latitude, position.coords.longitude);
				console.log(address)
			});
			// Runs the coordinate data through google api which produces a JSON object filled with location data
			navigator.geolocation.watchPosition(function(position) {
				console.log("i'm tracking you!");

				// If geolocating services are declined, show input form for user
				function name (error) {
					if (error.code == error.PERMISSION_DENIED)
						console.log("you denied me");
						$("#localcity").show();
						$("#localstate").show();
				};
			});
		// close geolocation
		}
	// close wherAmI		
	}


	// listener on to scroll down to the traitify
	$(".introbutton").click(function() {
	    console.log("got the intro click");
	    $('html, body').animate({
	        scrollTop: $(".traitifyAssessment").offset().top
	    }, 2000);
	});

	// listener on the "generate traitify careers"
	$(".continuebutton").on("click", function(){
		$(".continuebutton").hide();
		$('html, body').animate({
	        scrollTop: $(".assessment").offset().top
	    }, 2000);
	    console.log("got the submit click");
	    displayTraitifyResults();
		
	});

	// set a listener on a career choise click
	$(".assessment").on("click", "button", function(){
		// get the job that they clicked on
		jobBackFromClick = $(this).text();
		// remove spaces for the Glassdoor API
		queryObject.jobTitle = jobBackFromClick.replace(/\s+/g, '');
		console.log("chosen career - " + queryObject.jobTitle)
	    $('html, body').animate({
	        scrollTop: $(".results").offset().top
	    }, 2000);

		// get user input if chose to enter 
		var inputCity = $(".city").val().trim();
		var inputState = $(".state").val().trim();

		// if no input (using geoloc services) 
		if ( !inputCity.length == 0 && !inputState.length == 0 ) {
			queryObject.city = inputCity;
			queryObject.state = inputState;
		}

		var results = getJobsWithUserDetails(queryObject);
		console.log("results of 'getJobsWithUserDetails' - " + results);
		// displayResults(results);
	// };
	});



	// This function tests the results back from the Glassdoor API and displays the appropriate listing of job openings
	function displayResults (input){
		if(input.response.employers.length == 0){
			// We got NO listings back from the glass door API
			console.log("no jobs!!")
			$("#jobs").show();
			$("#radius").show();
			$(".glassdoorResults").html("Sorry, there are no " + jobBackFromClick + " jobs in your area");
			// build a button
			$(".newButtonArea").html("<button class='jobSearchButton btn'>Search Again</button>");

			// set a listener on search again
			$(".newButtonArea").on("click", "button", function(){
				var inputJob = $(".desired-job").val().trim();
				var inputRadius = $(".search-radius").val().trim();
				console.log("job and radius - " + inputJob + " - " + inputRadius);
				// preserve the name without the spaces removed
				jobBackFromClick = inputJob;
				// remove the spaces for the API string
				queryObject.jobTitle = inputJob.replace(/\s+/g, '');
				queryObject.searchRadius = inputRadius;
				getJobsWithUserDetails();
			});
		}
		else{
			// We got a job listing back from GlassDoor API
			var jobListing = input.response.employers[0].name;
			console.log("first listed employer - " + jobListing);
			// write the table head
			$(".glassdoorResults").html("<table><thead>");
			$(".glassdoorResults").append("<tr><th class='resultsBloc'>Company</th><th class='resultsBloc'>Job Title</th><th class='resultsBloc'>Location</th></tr></thead>");
			$(".glassdoorResults").append("<tbody>");
			if(input.response.employers[0].featuredReview === undefined){
				// there are job listings but no details (bug that got us in the presentation)
				for (i=0; i < (input.response.employers.length - 1); i++){
					$(".glassdoorResults").append("<tr><td class='resultsBloc'>" + input.response.employers[i].name + "</td></tr>");
				}
			}else{
				// the job listings have full detail
				for (i=0; i < (input.response.employers.length - 1); i++){
					$(".glassdoorResults").append("<tr><td class='resultsBloc'>" + input.response.employers[i].name + "</td><td class='resultsBloc'>" + input.response.employers[i].featuredReview.jobTitle + "</td><td class='resultsBloc'>" + input.response.employers[i].featuredReview.location + "</td></tr>");
				};
			}
			$(".glassdoorResults").append("</tbody></table>");
		}
	// end the test for valid data back from Glass Door API
	}

	// This function will query the glassdoor API and call the display funtion with the results
	function getJobsWithUserDetails (queryObj){
		console.log("Query Obj in getJobsWithUserDetails - ", queryObject);

		var myUserAgent = encodeURIComponent(userAgent);

		// build the query string
		var queryURL =  [
			"http://api.glassdoor.com/api/api.htm?v=1",
			"format=json",
			"t.p=150175",
			"t.k=f4RgxsRycNk",
			"action=employers",
			"q=IT",
			"userip=50.224.192.194",
			"useragent=" + myUserAgent,
			"city=" + queryObject.city,
			"state=" + queryObject.state,
			"q=" + queryObject.jobTitle,
			"radius=" + queryObject.searchRadius,
			"returnJobTitles"
		].join("&");
			// &returnCities&returnStates&returnJobTitles&returnEmployers&pn=1-10"

		// let's see our query string
		console.log('Query URL: ' + queryURL);

		// call the glass door API
		$.ajax({
			url: queryURL,
			method: "GET",
			cors: true,
			dataType: "jsonp"
		}).done(function(response) {
			console.log(response);
			displayResults(response);
        })

	// close function getJobsWithUserDetails
	}

// Got this code from http://stackoverflow.com/questions/6478914/reverse-geocoding-code
// This function will convert the longitude and latitude into a city and state
function getReverseGeocodingData(lat, lng) {
	var latlng = new google.maps.LatLng(lat, lng);
	// This is making the Geocode request
	var geocoder = new google.maps.Geocoder();

	geocoder.geocode({ 'latLng': latlng }, function (results, status) {
		if (status !== google.maps.GeocoderStatus.OK) {
			alert(status);
		}
		// This is checking to see if the Geoeode Status is OK before proceeding
		if (status == google.maps.GeocoderStatus.OK) {
			console.log(results);
			// Grab the city and state data and set it to the keyvalue pairs referenced within the queryObj variable

			queryObject.city = results[0].address_components[2].short_name;
			queryObject.state = results[0].address_components[4].short_name;
		}
	});
// end lifted code
}


// end doc ready	
})