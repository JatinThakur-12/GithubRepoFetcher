const API_BASE_URL = 'https://api.github.com';
const dataContainer = $("#dataContainer")
const ownerAvatar = $("#ownerAvatar");
const ownerName = $("#ownerName");
const ownerBio = $("#ownerBio");
const ownerLocation = $("#ownerLocation");
const ownerTwitterUrl = $("#ownerTwitterUrl");
const ownerGithubUrl = $("#ownerGithubUrl");
const fetchError = $("#fetchError");
const repositoriesContainer = $('#repoContainer');

let paginateTemplateUrl = "";


fetchError.addClass("hidden");
dataContainer.addClass("hidden");

const githubUrlGrandParent = ownerGithubUrl.parent().parent();

const userContainer = $("#userContainer");
userContainer.addClass("hidden");
githubUrlGrandParent.addClass("hidden");

$("#pagination").addClass("hidden");

function getRepositories() {

    const username = $('#username').val();
    const perPage = $('#perPage').val()
    $.ajax({
        url: `${API_BASE_URL}/users/${username}`,
        method: "GET",
        beforeSend: function () {
            userContainer.addClass("hidden");
            dataContainer.addClass("hidden");
            githubUrlGrandParent.addClass("hidden");
            fetchError.addClass("hidden")

        },
        success: function (data, textStatus, xhr) {
            displayRepoOwnerDetails(data)
            userContainer.removeClass("hidden");
            githubUrlGrandParent.removeClass("hidden")
            dataContainer.removeClass("hidden");

        },
        error: function () {
            dataContainer.removeClass("hidden");
            console.log("Error in fetching repository owner details")
        }
    })
    $.ajax({
        url: `${API_BASE_URL}/users/${username}/repos`,
        method: 'GET',
        data: {
            per_page: perPage,
        },
        beforeSend: function () {
            $('#loader').removeClass("hidden")
            $("#pagination").addClass("hidden");
            repositoriesContainer.addClass("hidden")
            
            // $('#repositories').html('<p>Loading...</p>');
        },

        success: function (data, textStatus, xhr) {
            $('#loader').addClass("hidden")
            displayRepositories(data);
            repositoriesContainer.removeClass("hidden")
            displayPagination(xhr.getResponseHeader('Link'));
            $("#pagination").removeClass("hidden");
        },

        error: function () {
            $('#loader').addClass("hidden")
            dataContainer.removeClass("hidden");
            fetchError.removeClass("hidden")
            repositoriesContainer.empty();
        }
    });
}

// displays owner repo data
function displayRepoOwnerDetails(data) {

    // i didn't hide ownerAvatar because github give default avatar
    ownerAvatar.attr("src", data?.avatar_url);

    ownerName.text(data.name || data.login);
    data.bio ? ownerBio.text(data.bio) : ownerBio.addClass("hidden")
    data.location? ownerLocation.text(data.location) : ownerLocation.parent().addClass("hidden");
    if(data.twitter_username){
        ownerTwitterUrl.attr("href",`https://twitter.com/${data.twitter_username}`)
                        .text(`@${data.twitter_username}`);
    }else{
        ownerTwitterUrl.parent().addClass("hidden");
    }
    
    ownerGithubUrl.attr("href",data.html_url);
}

// it display cards with repository data
function displayRepositories(repositories) {
    repositoriesContainer.empty();

    if (repositories.length === 0) {
        repositoriesContainer.append('<p>No repositories found.</p>');
    } else {
        repositories.forEach(repo => {
            repositoriesContainer.append(`
                <div class="card card-bg">

                    <div class="card-body flex flex-col justify-content-between">
                        <a target="_blank" href="${repo.html_url}">
                            <h5 class="card-title">${repo.name}</h5>
                        </a>
                        <p class="card-text text-white">${repo.description || 'No description available.'}</p>
                        <div class="flex gap-3">
                            <span class="card-text badge text-bg-primary p-2 rounded w-fit"> ${repo.language || 'Topics not available.'}</span>
                        </div>
                    </div>

                </div>
            `);
        });
        repositoriesContainer.height("100%");
        
    }
}

// it recalculate pagination data
function displayPagination(linkHeader) {
    const paginationContainer = $('#pagination');
    paginationContainer.empty();

    if (linkHeader) {

        const {objResult} = parseLinkHeader(linkHeader);
        // const perPageValue = objResult.perPageValue;
        const { first, prev, next, last, perPageValue } = objResult || {};
        
        // const baseUrl = objResult?.prev?.url || objResult?.next?.url || '';
        const baseUrl = prev?.url || next?.url || '';


        const activeLink = (parseInt(prev?.pageNo)+1) || (parseInt(next?.pageNo)-1) || 1;
        console.log("Current Page: ",activeLink);

        if(first){
            paginationContainer.append(`<a href="#" onclick="changePage('${first.url}')"> &lt;&lt; </a>`)
        }else{
            paginationContainer.append(`<a href="#" style="pointer-events: none"> &lt;&lt; </a>`)
        }

        if(prev){
            paginationContainer.append(`<a href="#" onclick="changePage('${prev.url}')"> &lt; </a>`)
        }else{
            paginationContainer.append(`<a href="#" style="pointer-events: none" > &lt; </a>`)
        }

        for(let i= parseInt(first?.pageNo) || 1; i <= (parseInt(last?.pageNo) || (parseInt(prev?.pageNo)+1)); i++){
            paginationContainer.append(`<a href="#" class="${activeLink===i? "active": ''}" onclick="changePage('${createDynamicURL(baseUrl,perPageValue,i)}')"> ${i} </a>`)
        }

        if(next){
            paginationContainer.append(`<a href="#" onclick="changePage('${next.url}')"> &gt; </a>`)
        }else{
            paginationContainer.append(`<a href="#" style="pointer-events: none" > &gt; </a>`)
        }

        if(last){
            paginationContainer.append(`<a href="#" onclick="changePage('${last.url}')"> &gt;&gt; </a>`)
        }else{
            paginationContainer.append(`<a href="#" style="pointer-events: none" > &gt;&gt;</a>`)
        }
    }
}

// this function is used to create url for numbered pagination
function createDynamicURL(baseUrl, perPage, pageNumber) {
    if(baseUrl === ""){
        return ""
    }

    const url = new URL(baseUrl);

    // Modify or add query parameters
    url.searchParams.set('per_page', perPage);
    url.searchParams.set('page', pageNumber);

    return url.toString();
}

// It create an array so that i can use it for generating pagination anchors
function parseLinkHeader(linkHeader) {
    const links = linkHeader.split(', ');

    const objResult = {}

    // Use a regular expression to extract the 'per_page' value
    const perPageMatch = linkHeader.match(/per_page=(\d+)/);
    
    // Check if there is a match and extract the value
    const perPageValue = perPageMatch ? perPageMatch[1] : null;
    objResult["perPageValue"]=perPageValue; 

    links.forEach(link => {
        const [url, rel] = link.split('; ');
        const text = rel.match(/"(.*?)"/)[1];

        const pageNo= url.match(/&page=(\d+)/)[1];
        // console.log("Page No:",pageNo);

        const urlWithoutBrackets = url.slice(1, -1);

        objResult[text]={
            url: urlWithoutBrackets,
            text: text,
            pageNo
        };
    });
    // console.log("object Result",objResult);

    return {objResult};
}

function changePage(url) {
    // Making API call to get repositories for the selected page
    $.ajax({
        url: url,
        method: 'GET',
        beforeSend: function () {
            $('#loader').removeClass("hidden")

        },
        success: function (data, textStatus, xhr) {
            $('#loader').addClass("hidden")

            displayRepositories(data);

            displayPagination(xhr.getResponseHeader('Link'));
        },
        error: function () {
            $('#repositories').html('<p>Error loading repositories.</p>');
        }
    });
}