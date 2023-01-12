
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

// Authorization Token

function getAuthorizationToken (req, res, next) {
    var code = req.body.code || null;
    var state = req.body.state || null;

    if (state === null) {
        console.log('Error: State mismatch')
    }
    else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code',
            client_id: client_id,
            client_secret: client_secret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            json: true
        };
    }

    request.post(authOptions, (error, response, body) => {
        if (body.hasOwnProperty("error")) {
            res.locals.error =  body;
            next();
        }
        else {
            res.locals.accessData = body;
            next();
        }
    });
}

// User's Top Artists

function getTopArtists (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else if (!res.locals.accessData) {
        res.locals.error = 'Error retrieving access token';
        next();
    }

    else {

        // Spotify request to get the user's top artists

        const params = {
            url: 'https://api.spotify.com/v1/me/top/artists',
            headers: {
                'Authorization': 'Bearer ' + res.locals.accessData.access_token,
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
        var url = "https://en.wikipedia.org/w/api.php";

        var params = {
            prop: "pageprops",
            ppprop: "wikibase_item",
            action: "query",
            titles: "none",
            formatversion: "2",
            format: "json"
        };
    
        var size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) {
    
            params.titles = artist.name;    // Name of artist
    
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

// Birth place

function getWikiDataIdsOfBirthPlaces (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else {
        var url = "https://wikidata.org/w/api.php";

        var params = {
            action: "wbgetclaims",
            entity: "none",
            property: "P19",
            format: "json"
        }
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) {
            console.log(artist);
            
            params.entity = artist.artist_wikibase_item;    // Name of artist
    
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

function getNameOfBirthPlaceCity (req, res, next) {

    if (res.locals.error) {
        next();
    }
    
    else {
        var url = "https://wikidata.org/w/api.php";

        var params = {
            action: "wbgetentities",
            ids: "none",
            format: "json"
        }
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) { 
    
            params.ids = artist.birthplace_wikibase_item;
    
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

function getNameOfBirthPlaceCountry (req, res, next) {

    if (res.locals.error) {
        next();
    }
    
    else {
        var url = "https://wikidata.org/w/api.php";

        var params = {
            action: "wbgetentities",
            ids: "none",
            format: "json"
        }
    
        const size = res.locals.topArtists.size;
        var i = 0;
        for (const [artist] of res.locals.topArtists.entries()) { 
    
            params.ids = artist.country_wikibase_item;
    
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

function getCoordinatesOfBirthPlaces (req, res, next) {
    
    if (res.locals.error) {
        next();
    }

    else {
        // ?q={city name},{state code},{country code}&limit={limit}&appid={API key}
        var url = "http://api.openweathermap.org/geo/1.0/direct";

        var params = {
            q: "none",
            appid: "001b09f62790ee8c13aecfb881d3516c"
        }

        for (const [artist] of res.locals.topArtists.entries()) {
            
            params.q = artist.birthplace + "," + artist.country;

            url = url + "?origin=*";
            Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
        
            request.get(url, (error, response, body) => {
                console.log('location', body);
            });
        }
    }
}

// Code Endpoint

const codeMiddleWare = [
    getAuthorizationToken, getTopArtists, getWikiDataIdsOfArtists, 
    getWikiDataIdsOfBirthPlaces, getNameOfBirthPlaceCity, getNameOfBirthPlaceCountry,
    getCoordinatesOfBirthPlaces
];
app.post('/code', codeMiddleWare, (req, res) => {

    if (res.locals.error) {
        res.json(res.locals.error);
        res.locals.error = null;
    }
    
    else {
        var artists = {}
        for (const [artist] of res.locals.topArtists.entries()) {
            artists[artist.name] = artist.birthplace;
        }
    
        res.json(JSON.stringify(artists));
    }
});

const port = process.env.PORT || 4200;

app.listen(port, (err) => {
    if (err) {
        console.log('error: ', err);
    }

    console.log('listening on', port);
});
