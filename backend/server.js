
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
        if (error) {
            res.locals.error = error;
            next();
        }

        if (body) {
            res.locals.accessData = body;
            next();
        }
    });
}

// User Data

function getUserData (req, res, next) {

    if (res.locals.error) {
        next();
    }

    else if (!res.locals.accessData) {
        res.locals.error = 'Error retrieving access token';
        next();
    }

    console.log('res:', res.locals.accessData);

    request.get()
}


// Code Endpoint

const codeMiddleWare = [getAuthorizationToken, getUserData];
app.post('/code', codeMiddleWare, (req, res) => {

    if (res.locals.error) {
        res.send(res.locals.error);
    }
});

const port = process.env.PORT || 4200;

app.listen(port, (err) => {
    if (err) {
        console.log('error: ', err);
    }

    console.log('listening on', port);
});
