
// Define variables

const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const request = require('request');
const redirect_uri = 'http://localhost:3000/';
const client_id = '3d474cad631f40028c1f3909186b0686';
const client_secret = 'b49248f3d4df4064a0f1ba0d8d943354';

// Use

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Default

app.get('/', (req, res) => {

});

// User's Top Artists

function getTopArtists (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else if (!req.body.accessToken) {
        res.locals.error = 'Error retrieving access token';
        next();
    }

    else {

        // Spotify request to get the user's top artists

        const params = {
            url: 'https://api.spotify.com/v1/me/top/artists',
            headers: {
                'Authorization': 'Bearer ' + req.body.accessToken,
                'Content-Type': 'application/json'
            },
        }

        request.get(params, (error, response, body) => {
            if (JSON.parse(body).hasOwnProperty("error")) { // Error
                res.locals.error = JSON.parse(body);
                next();
            }
            else {
                res.locals.topArtists = new Set();
                JSON.parse(body).items.forEach(element => {
                    res.locals.topArtists.add({
                        name: element.name
                    });
                });
        
                next();
            }
        });
    }
}

// Artist

function getWikiDataIdsOfArtists (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else {
    
        var size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) {

            var url = "https://en.wikipedia.org/w/api.php";

            var params = {
                prop: "pageprops",
                ppprop: "wikibase_item",
                action: "query",
                titles: artist.name,    // Name of artist
                formatversion: "2",
                format: "json"
            };
    
            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                if (!JSON.parse(body).query.pages[0].pageprops) {   // Remove artist if no WikiData ID
                    res.locals.topArtists.delete(artist);
                } 
                else {
                    console.log(artist.name, JSON.parse(body).query.pages[0].pageprops.wikibase_item);
                    artist.artist_wikibase_item = JSON.parse(body).query.pages[0].pageprops.wikibase_item;  // Save artist WikiData ID 
                }
                i++;
                if (i == size) {  // After the last artist, continue to next middleware function
                    next();
                }
            });
        }
    }
}

// Birth place Wiki Data claim

function getWikiDataIdsOfBirthPlaces (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else {
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) {
            console.log(artist);

            var url = "https://wikidata.org/w/api.php";

            var params = {
                action: "wbgetclaims",
                entity: artist.artist_wikibase_item,
                property: "P19",
                format: "json"
            }
    
            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                if (!JSON.parse(body).claims || Object.keys(JSON.parse(body).claims).length == 0) {  // Remove artist if no WikiData claim entry data
                    res.locals.topArtists.delete(artist);
                }
                else {
                    artist.birthplace_wikibase_item = JSON.parse(body).claims.P19[0].mainsnak.datavalue.value.id;
                    console.log(artist.name, artist.birthplace_wikibase_item);
                }
                i++;
                if (i == size) {  // After the last artist, continue to next middleware function
                    next();
                }
            });
        }
    }
}

// Birth place city

function getNameOfBirthPlaceCity (req, res, next) {

    if (res.locals.error) {
        next();
    }
    
    else {
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) { 

            var url = "https://wikidata.org/w/api.php";

            var params = {
                action: "wbgetentities",
                ids: artist.birthplace_wikibase_item,
                format: "json"
            }
    
            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                if (!JSON.parse(body).entities) {
                    res.locals.topArtists.delete(artist);
                }
                else {
                    artist.birthplace = JSON.parse(body).entities[artist.birthplace_wikibase_item].labels.en.value;
                    artist.country_wikibase_item = JSON.parse(body).entities[artist.birthplace_wikibase_item].claims.P17[0].mainsnak.datavalue.value.id;
                    console.log(artist.name, ", ", artist.birthplace);
                }
                i++;
                if (i == size) {    // After the last artist, continue to next middleware function
                    next();
                }
            });
        }
    }
}

// Birth place country

function getNameOfBirthPlaceCountry (req, res, next) {

    if (res.locals.error) {
        next();
    }
    
    else {
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) { 

            var url = "https://wikidata.org/w/api.php";

            var params = {
                action: "wbgetentities",
                ids: artist.country_wikibase_item,
                format: "json"
            }
    
            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                if (!JSON.parse(body).entities) {
                    res.locals.topArtists.delete(artist);
                }
                else {
                    artist.country = JSON.parse(body).entities[artist.country_wikibase_item].claims.P297[0].mainsnak.datavalue.value;
                }
                i++;
                if (i == size) {    // After the last artist, continue to next middleware function
                    next();
                }
            });
        }
    }
}

// Latitude and longitude of birth place

function getCoordinatesOfBirthPlaces (req, res, next) {
    
    if (res.locals.error) {
        next();
    }

    else {

        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) {

            // ?q={city name},{state code},{country code}&limit={limit}&appid={API key}
            var url = "http://api.openweathermap.org/geo/1.0/direct";

            var params = {
                q: artist.birthplace + "," + artist.country,
                limit: "1",
                appid: "001b09f62790ee8c13aecfb881d3516c"
            }

            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                if (!JSON.parse(body)) {
                    res.locals.topArtists.delete(artist);
                }
                else {
                    artist.lat = JSON.parse(body)[0].lat;
                    artist.lon = JSON.parse(body)[0].lon;
                }
                i++;
                if (i == size) {    // After the last artist, continue to next middleware function
                    next();
                }
            });
        }
    }
}

// Code Endpoint

const codeMiddleWare = [
    getTopArtists, getWikiDataIdsOfArtists, 
    getWikiDataIdsOfBirthPlaces, getNameOfBirthPlaceCity, 
    getNameOfBirthPlaceCountry, getCoordinatesOfBirthPlaces
];
app.post('/code', codeMiddleWare, (req, res) => {

    if (res.locals.error) {
        res.json(res.locals.error);
        res.locals.error = null;
    }
    
    else {
        var artists = {}
        for (const [artist] of res.locals.topArtists.entries()) {
            artists[artist.name] = 
            {
                "birthplace": artist.birthplace,
                "country": artist.country,
                "lat": artist.lat,
                "lon": artist.lon
            };
        }
    
        res.json(JSON.stringify(artists));
        console.log('success!');
    }
});

const port = process.env.PORT || 4200;

app.listen(port, (err) => {
    if (err) {
        console.log('error: ', err);
    }

    console.log('listening on', port);
});
