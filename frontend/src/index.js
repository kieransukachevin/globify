
import css from './styles/styles.css';
import * as login from './login';
import * as globe from './globe';
import axios from 'axios';

async function setup() {

    // var userData = await login.loginSetup();    // Retrieve data // TEST
    globe.setupGlobe(document.getElementById('main-area-1')); // Setup    // TEST

    console.log(userData);

    if (userData && !userData['error']) {

        // globe.setupGlobe(); // Setup 

    }
    else {

        setLoginButton(document.getElementById('main-area-1'));

    }
}

function setLoginButton(area) {

    // Header (Loading)
    const header = document.createElement("h1");
    header.innerHTML = "Login to Spotify";

    const button = document.createElement("button");
    button.id = "login-button";
    button.innerHTML = "Login";
    button.addEventListener('click', login.loginButtonClicked);

    // Add to the area
    area.replaceChildren(header, button);
}

window.onload = setup;
