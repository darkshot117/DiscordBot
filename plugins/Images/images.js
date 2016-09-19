var request = require("request");
var AuthDetails = require("../../auth.json");

exports.commands = [
	"image", //gives top image from google search
	"rimage", //gives random image from google search
	"ggif", //gives random gif from google search
	"imgur", //gives top image from google search on imgur.com
	"google" //gives top image from google search on imgur.com
];

exports.image = {
	usage: "<search query>",
	description: "gets the top matching image from google",
	process: function(bot, msg, args) {
		if(!AuthDetails || !AuthDetails.youtube_api_key || !AuthDetails.google_custom_search){
			msg.channel.sendMessage("Image search requires both a YouTube API key and a Google Custom Search key!");
			return;
		}

		var imageQueryCleaned = (args.replace(/\s/g, '+'));
		var searchURL = "https://www.googleapis.com/customsearch/v1?key=" + AuthDetails.youtube_api_key
				+ "&cx=" + AuthDetails.google_custom_search + "&searchType=image"
				+ "&safe=off&alt=json&q=" + imageQueryCleaned;

		request(searchURL, function(err, res, body) {
			var data, error;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(error)
				return;
			}
			if(!data){
				console.log(data);
				msg.channel.sendMessage("Error:\n" + JSON.stringify(data));
				return;
			}
			else if (!data.items || data.items.length == 0){
				console.log(data);
				msg.channel.sendMessage("No result for '" + args + "'");
				return;
			}
			var result = data.items[0];
			msg.channel.sendMessage(result.title + '\n' + result.link);
		});
	}
}

exports.rimage = {
	usage: "<search query>",
	description: "gets a random image matching tags from google",
	process: function(bot, msg, args) {
		if(!AuthDetails || !AuthDetails.youtube_api_key || !AuthDetails.google_custom_search){
			msg.channel.sendMessage("Image search requires both a YouTube API key and a Google Custom Search key!");
			return;
		}
		//gets us a random result in first 5 pages
		var page = 1 + Math.floor(Math.random() * 5) * 10; //we request 10 items
		var imageQueryCleaned = (args.replace(/\s/g, '+'));
		var searchURL = "https://www.googleapis.com/customsearch/v1?key=" + AuthDetails.youtube_api_key
				+ "&cx=" + AuthDetails.google_custom_search + "&searchType=image"
				+ "&safe=off&alt=json&num=10&start="+page +"&q=" + imageQueryCleaned;

		request(searchURL, function(err, res, body) {
			var data, error;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(error)
				return;
			}
			if(!data){
				console.log(data);
				msg.channel.sendMessage("Error:\n" + JSON.stringify(data));
				return;
			}
			else if (!data.items || data.items.length == 0){
				console.log(data);
				msg.channel.sendMessage("No result for '" + args + "'");
				return;
			}
			var randResult = data.items[Math.floor(Math.random() * data.items.length)];
			msg.channel.sendMessage(randResult.title + '\n' + randResult.link);
		});
	}
}

exports.ggif = {
	usage : "<search query>",
	description : "get random gif matching tags from google",
	process : function(bot, msg, args) {
		//gets us a random result in first 5 pages
		var page = 1 + Math.floor(Math.random() * 5) * 10; //we request 10 items
		var imageQueryCleaned = (args.replace(/\s/g, '+'));
		var searchURL = "https://www.googleapis.com/customsearch/v1?key=" + AuthDetails.youtube_api_key
				+ "&cx=" + AuthDetails.google_custom_search + "&searchType=image"
				+ "&safe=off&alt=json&num=10&start=" + page + "&fileType=gif&q=" + imageQueryCleaned;

		request(searchURL, function(err, res, body) {
			var data, error;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(error)
				return;
			}
			if(!data){
				console.log(data);
				msg.channel.sendMessage("Error:\n" + JSON.stringify(data));
				return;
			}
			else if (!data.items || data.items.length == 0){
				console.log(data);
				msg.channel.sendMessage("No result for '" + args + "'");
				return;
			}
			var randResult = data.items[Math.floor(Math.random() * data.items.length)];
			msg.channel.sendMessage(randResult.title + '\n' + randResult.link);
		});

	}
}

exports.imgur = {
	usage: "<search query>",
	description: "gets the top matching image from google on imgur.com",
	process: function(bot, msg, args) {
		if(!AuthDetails || !AuthDetails.youtube_api_key || !AuthDetails.google_custom_search){
			msg.channel.sendMessage("Image search requires both a YouTube API key and a Google Custom Search key!");
			return;
		}

		var imageQueryCleaned = "site:imgur.com " + (args.replace(/\s/g, '+'));
		var searchURL = "https://www.googleapis.com/customsearch/v1?key=" + AuthDetails.youtube_api_key
				+ "&cx=" + AuthDetails.google_custom_search + "&searchType=image"
				+ "&safe=off&alt=json&q=" + imageQueryCleaned;// + "&as_sitesearch=imgur.com";

		request(searchURL, function(err, res, body) {
			var data, error;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(error)
				return;
			}
			if(!data){
				console.log(data);
				msg.channel.sendMessage("Error:\n" + JSON.stringify(data));
				return;
			}
			else if (!data.items || data.items.length == 0){
				console.log(data);
				msg.channel.sendMessage("No result for '" + args + "'");
				return;
			}
			var result = data.items[0];
			msg.channel.sendMessage(result.title + '\n' + result.link);
		});
	}
}

exports.google = {
	usage: "<search query>",
	description: "gets the top matching result from google",
	process: function(bot, msg, args) {
		if(!AuthDetails || !AuthDetails.youtube_api_key || !AuthDetails.google_custom_search){
			msg.channel.sendMessage("Image search requires both a YouTube API key and a Google Custom Search key!");
			return;
		}

		var imageQueryCleaned = (args.replace(/\s/g, '+'));
		var searchURL = "https://www.googleapis.com/customsearch/v1?key=" + AuthDetails.youtube_api_key
				+ "&cx=" + AuthDetails.google_custom_search
				+ "&safe=off&alt=json&q=" + imageQueryCleaned;

		request(searchURL, function(err, res, body) {
			var data, error;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(error)
				return;
			}
			if(!data){
				console.log(data);
				msg.channel.sendMessage("Error:\n" + JSON.stringify(data));
				return;
			}
			else if (!data.items || data.items.length == 0){
				console.log(data);
				msg.channel.sendMessage("No result for '" + args + "'");
				return;
			}
			var result = data.items[0];
			msg.channel.sendMessage(result.title + '\n' + result.link);
		});
	}
}
