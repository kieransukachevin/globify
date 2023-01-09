
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
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.accessData = body;
        next();
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

    const params = {
        url: 'https://api.spotify.com/v1/me/top/artists',
        headers: {
            'Authorization': 'Bearer ' + res.locals.accessData.access_token,
            'Content-Type': 'application/json'
        },
    }

    request.get(params, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.topArtists = [];
        JSON.parse(body).items.forEach(element => {
            res.locals.topArtists.push({
                name: element.name
            });
        });

        next();
    });
}

// Artist

async function getWikiDataIdOfArtist (req, res, next) {
    console.log(res.locals.topArtists);

    var url = "https://en.wikipedia.org/w/api.php";

    var params = {
        prop: "pageprops",
        ppprop: "wikibase_item",
        action: "query",
        titles: "none",
        formatversion: "2",
        format: "json"
    };

    res.locals.topArtists.forEach(async artist => {

        params.titles = artist.name;    // Name of artist

        url = url + "?origin=*";
        Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
    
        await request.get(url, (error, response, body) => {
            if (JSON.parse(error)) {
                res.locals.error = error;
            }
            else {
                console.log(body);
    
                // artist.artist_wikibase_item = JSON.parse(body).query.pages[0].pageprops.wikibase_item;    
            }    
        });
    });

    next();
}

// Birth place

async function getWikiDataIdOfBirthPlace (req, res, next) {

    console.log('here!');

    var url = "https://wikidata.org/w/api.php";

    var params = {
        action: "wbgetclaims",
        entity: res.locals.topArtists[0].artist_wikibase_item,
        property: "P19",
        format: "json"
    }

    url = url + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

    await request.get(url, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }
        // console.log(
        //     JSON.parse(body).claims.P19[0].mainsnak.datavalue.value.id  // Birth place wikidata_id
        // );

        res.locals.topArtists[0].birthplace_wikibase_item = JSON.parse(body).claims.P19[0].mainsnak.datavalue.value.id;

        next();
    });
}

async function getNameOfBirthPlace (req, res, next) {
    
    var url = "https://wikidata.org/w/api.php";

    var params = {
        action: "wbgetentities",
        ids: res.locals.topArtists[0].birthplace_wikibase_item,
        format: "json"
    }

    url = url + "?origin=*";
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});

    await request.get(url, (error, response, body) => {
        if (JSON.parse(error)) {
            res.locals.error = error;
            next();
        }

        res.locals.topArtists[0].birthplace = JSON.parse(body).entities[res.locals.topArtists[0].birthplace_wikibase_item].labels.en.value;

        next();
    });
}


// Code Endpoint

const codeMiddleWare = [getAuthorizationToken, getTopArtists, getWikiDataIdOfArtist, getWikiDataIdOfBirthPlace, getNameOfBirthPlace];
app.post('/code', codeMiddleWare, (req, res) => {

    if (res.locals.error) {
        res.send(res.locals.error);
        res.locals.error = null;
    }

    res.send(res.locals.userData);
});

const port = process.env.PORT || 4200;

app.listen(port, (err) => {
    if (err) {
        console.log('error: ', err);
    }

    console.log('listening on', port);
});
