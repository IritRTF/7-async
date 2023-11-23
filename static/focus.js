const API = {
    organizationList: "/orgsList",
    analytics: "/api3/analitics",  // изменено с "analytics" на "analitics"
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};
function run() {
    sendRequest(API.organizationList)
        .then(orgOgrns => {
            const ogrns = orgOgrns.join(",");
            return Promise.all([
                sendRequest(`${API.orgReqs}?ogrn=${ogrns}`),
                sendRequest(`${API.analytics}?ogrn=${ogrns}`),
                sendRequest(`${API.buhForms}?ogrn=${ogrns}`)
            ]);
        })
        .then(([requisites, analytics, buh]) => {
            const orgsMap = reqsToMap(requisites);
            addInOrgsMap(orgsMap, analytics, "analytics");
            addInOrgsMap(orgsMap, buh, "buhForms");
            render(orgsMap, orgOgrns);
        })
        .catch(error => {
            console.error(`Error in run: ${error.message}`);
        });
}

run();
//На всякий случай решение с промисом 1
//function sendRequest(url) {
    //return new Promise((resolve, reject) => {
        //const xhr = new XMLHttpRequest();
        //xhr.open("GET", url, true);

        //xhr.onreadystatechange = function () {
            //if (xhr.readyState === XMLHttpRequest.DONE) {
                //if (xhr.status === 200) {
                    //resolve(JSON.parse(xhr.response));
                //} else {
                    //reject(new Error(`Request failed with status ${xhr.status}`));
                //}
            //}
        //};

        //xhr.send();
    //});
//}
function sendRequest(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            throw new Error(`Request failed: ${error.message}`);
        });
}

function reqsToMap(requisites) {
    return requisites.reduce((acc, item) => {
        acc[item.ogrn] = item;
        return acc;
    }, {});
}

function addInOrgsMap(orgsMap, additionalInfo, key) {
    for (const item of additionalInfo) {
        orgsMap[item.ogrn][key] = item[key];
    }
}

function render(organizationsInfo, organizationsOrder) {
    const table = document.getElementById("organizations");
    table.classList.remove("hide");

    const template = document.getElementById("orgTemplate");
    const container = table.querySelector("tbody");

    organizationsOrder.forEach((item) => {
        renderOrganization(organizationsInfo[item], template, container);
    });
}

function renderOrganization(orgInfo, template, container) {
    const clone = document.importNode(template.content, true);
    const name = clone.querySelector(".name");
    const indebtedness = clone.querySelector(".indebtedness");
    const money = clone.querySelector(".money");
    const address = clone.querySelector(".address");

    name.textContent =
        (orgInfo.UL && orgInfo.UL.legalName && orgInfo.UL.legalName.short) ||
        "";
    indebtedness.textContent = formatMoney(orgInfo.analytics.s1002 || 0);

    if (
        orgInfo.buhForms &&
        orgInfo.buhForms.length &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1] &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1].year === 2017
    ) {
        money.textContent = formatMoney(
            (orgInfo.buhForms[orgInfo.buhForms.length - 1].form2 &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0] &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0]
                    .endValue) ||
                0
        );
    } else {
        money.textContent = "—";
    }

    const addressFromServer = orgInfo.UL.legalAddress.parsedAddressRF;
    address.textContent = createAddress(addressFromServer);

    container.appendChild(clone);
}

function formatMoney(money) {
    let formatted = money.toFixed(2);
    formatted = formatted.replace(".", ",");

    const rounded = money.toFixed(0);
    const numLen = rounded.length;
    for (let i = numLen - 3; i > 0; i -= 3) {
        formatted = `${formatted.slice(0, i)} ${formatted.slice(i)}`;
    }

    return `${formatted} ₽`;
}

function createAddress(address) {
    const addressToRender = [];
    if (address.regionName) {
        addressToRender.push(createAddressItem("regionName"));
    }
    if (address.city) {
        addressToRender.push(createAddressItem("city"));
    }
    if (address.street) {
        addressToRender.push(createAddressItem("street"));
    }
    if (address.house) {
        addressToRender.push(createAddressItem("house"));
    }

    return addressToRender.join(", ");

    function createAddressItem(key) {
        return `${address[key].topoShortName}. ${address[key].topoValue}`;
    }
}
