const MIN_PROJECTS_PER_CALL = 5;
const MAX_PROJECTS_PER_USER = 2;
const CONTENT = document.getElementById('content');
const EMOJI = new EmojiConvertor();
let projectsCurrentCall = 0;
let usersCurrentCall = 0;
let callInProgress = true;
let reqNo = Math.floor(Math.random() * 3) + 1;
let projectsPerPage = 2;
let USERNAMES;

// Function to check if all users have been processed
const allUsersChecked = function allUsersChecked() {
    return usersCurrentCall === USERNAMES.length;
};

// Function to determine if more data is needed
const moreDataNeeded = function moreDataNeeded() {
    return (allUsersChecked() && projectsCurrentCall < MIN_PROJECTS_PER_CALL);
};

// Function to format GitHub usernames into links
const userFormatter = function userFormatter(username) {
    return `<a href='https://github.com/${username}?tab=stars' target='_blank'>${username}</a>`;
};

// Function to format numbers with 'k' for thousands
const nFormatter = function nFormatter(num) {
    if (num <= 999) {
        return `${num}`;
    } else if (num <= 99999) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return `${num}`;
};

// Function to collect and display data from API response
const dataCollector = function dataCollector(response, username) {
    usersCurrentCall += 1;
    const filterFunction = languageFilter(languageSelected);
    response.data.filter(filterFunction).slice(0, MAX_PROJECTS_PER_USER).forEach((entry) => {
        if (typeof entry !== 'undefined') {
            projectsCurrentCall += 1;
            if (!entry.description) entry.description = '';
            let innerContent = `<li><span class='link'><a href='${entry.html_url}' target='_blank'>${entry.full_name}<span> - ${String(entry.description)}</span><br/></a></span>`;
            innerContent += "<div class='additional'>";
            innerContent += `${nFormatter(entry.stargazers_count)} <i class='fa fa-star'></i>`;
            innerContent += `&emsp;${nFormatter(entry.forks)} <i class='fa fa-code-fork'></i>`;
            innerContent += (entry.language != null) ? `&emsp;${entry.language}` : '';
            innerContent += `&emsp;(from ${userFormatter(username)})`;
            innerContent += '</div></li>';
            innerContent = EMOJI.replace_unified(innerContent);
            CONTENT.innerHTML += EMOJI.replace_colons(innerContent);
            EMOJI.img_sets.apple.path = 'http://cdn.mubaris.com/emojis/';
        }
    });
    if (moreDataNeeded()) {
        getData();
    } else if (allUsersChecked()) {
        projectsCurrentCall = 0;
        callInProgress = false;
        document.getElementById('searching').innerHTML = '';
    }
};

// Function to fetch data from GitHub API
const getData = function getData() {
    document.getElementById('searching').innerHTML = '<br/>Fetching projects...';
    usersCurrentCall = 0;
    callInProgress = true;
    reqNo += 1;
    USERNAMES.forEach((username) => {
        const url = `https://api.github.com/users/${username}/starred?per_page=${projectsPerPage}&page=${reqNo}`;
        axios({
            url,
            method: 'get',
            headers: { 'Authorization': `token ${accessToken}` }, // Updated: Use Authorization header
            responseType: 'json',
        }).then((response) => {
            dataCollector(response, username);
        }).catch((err) => {
            console.error(err);
        });
    });
};

// Initialize the application
if (window.localStorage) {
    if (!localStorage.getItem('usernames')) {
        localStorage.setItem('usernames', JSON.stringify(DEFAULTUSERNAMES));
    }
    USERNAMES = JSON.parse(localStorage.getItem('usernames'));

    if (!localStorage.getItem('accessToken')) {
        swal({
            title: 'Submit GitHub Token',
            html: "Curiosity requires a GitHub Token to access the GitHub API. Your token will be saved in LocalStorage. Don't worry, it's safe. Get a new token <a target='_blank' href='https://github.com/settings/tokens/new?description=Curiosity'>here</a>.",
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            showLoaderOnConfirm: true, // Updated: Show loader during verification
            preConfirm(token) {
                return new Promise((resolve, reject) => {
                    if (token.trim() === '') {
                        reject(new Error('Enter a valid token'));
                    } else {
                        const url = `https://api.github.com/user`; // Updated: Use authenticated user endpoint
                        axios({
                            url,
                            method: 'get',
                            headers: { 'Authorization': `token ${token}` }, // Updated: Use Authorization header
                            responseType: 'json',
                        }).then(() => {
                            localStorage.setItem('accessToken', token);
                            resolve();
                        }).catch(() => reject(new Error('Error: Invalid token')));
                    }
                });
            },
            allowOutsideClick: false,
        }).then(() => {
            accessToken = localStorage.getItem('accessToken');
            getData();
            renderLanguageSelector();
            renderUsernames();
            swal({
                type: 'success',
                title: 'Thank You',
            });
        }).catch((error) => {
            swal({
                type: 'error',
                title: 'Token Verification Failed',
                text: error.message,
            });
        });
    }
} else {
    alert('Sorry! LocalStorage is not available');
}

let accessToken = localStorage.getItem('accessToken'); // Moved declaration above usage

if (accessToken) {
    getData();
    renderLanguageSelector();
    renderUsernames();
}

// Infinite scroll options
const OPTIONS = {
    distance: 1,
    callback(done) {
        if (!callInProgress) {
            getData();
        }
        done();
    },
};

// Initialize infinite scroll
infiniteScroll(OPTIONS);
