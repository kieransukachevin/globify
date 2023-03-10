
import css from './styles/styles.css';
import globe from './assets/globe.jpg';
import axios from 'axios';
import { Buffer } from 'buffer';

export async function loginButtonClicked() {

    const client_id = '3d474cad631f40028c1f3909186b0686';
    const redirect_uri = 'http://localhost:3000/';
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email user-top-read';

    const url = new URL('https://accounts.spotify.com/authorize?');
    const params = new URLSearchParams(url.search);
    params.set('response_type', 'code');
    params.set('client_id', client_id);
    params.set('scope', scope);
    params.set('redirect_uri', redirect_uri);
    params.set('state', state);

    location.href = url + params.toString();
}

export async function loginSetup() {

    if ( !window.sessionStorage.getItem("authToken") ) {    // Check if access token has already been retrieved
        
        let codeState = getCodeParameter();

        if (codeState) {

            let authToken = await getAuthorizationToken (codeState.code, codeState.state);
    
            window.sessionStorage.setItem("authToken", authToken);
    
        }
        else {
            return null;
        }
    }

    let userData = await getUserData(window.sessionStorage.getItem("authToken"));
    
    return userData;
}

function getCodeParameter() {

    const url_string = window.location.href;
    const url = new URL(url_string);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (code && state) {

        return {"code": code, "state": state}
        
    }
    else {
        return null;
    }
}

async function getAuthorizationToken (code, state) {

    const redirect_uri = 'http://localhost:3000/';
    const client_id = '3d474cad631f40028c1f3909186b0686';
    const client_secret = 'b49248f3d4df4064a0f1ba0d8d943354';

    var authToken = null;

    if (state === null) {
        console.log('Error: State mismatch')
    }
    else {
        const headers = {
            "Authorization":
                'Basic ' +
                Buffer.from(client_id + ':' + client_secret).toString('base64'),
            "Content-Type":
                'application/x-www-form-urlencoded'
        }
            
        const { data } = await axios.post('https://accounts.spotify.com/api/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        },
        { headers },
        )
        
        authToken = data.access_token
    }

    return authToken;
}

function generateRandomString(size) {

    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length
    for (let i = 0; i < size; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function getUserData(authToken) {

    // Loading assets
    setLoadingArea(document.getElementById('main-area-1'));

    let data = null;    // Data to return

    await axios.post('http://localhost:4200/code', {
        accessToken: authToken
    })
    .then(function (response) {
        data = response.data;
    })
    .catch(function (error) {
        console.log('error:', error);
        data = error;
    });

    return data;
}

function setLoadingArea(area) {

    // Globe image (Loading)
    const img = new Image();
    img.src = globe;
    img.alt = 'globe';
    img.className = 'loader';

    // Header (Loading)
    const header = document.createElement("h2");
    header.innerHTML = 'Loading';

    // Add to the area
    area.replaceChildren(img, header);
}

function displayUserData(area, data) {

    let names = '';
    (data).forEach(element => {
        names += element.name + ', '
    });
    area.replaceChildren(
        document.createElement('p').innerHTML = names
    );
}
