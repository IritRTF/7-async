const API = {
    organizationList: "/orgsList",
    analytics: "/api3/analytics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

async function run() {
    const orgOgrns = await sendRequest1(API.organizationList)
        .then((response) => response.json())
        .catch((error) => alert(`${error.code}\r\n ${error.status}`));

    const ogrns = orgOgrns.join(",");

    [requisites, analytics, buh] = await Promise.all([
        sendRequest1(`${API.orgReqs}?ogrn=${ogrns}`).then((response) =>
            response.json()
        ),
        sendRequest1(`${API.analytics}?ogrn=${ogrns}`).then((response) =>
            response.json()
        ),
        sendRequest1(`${API.buhForms}?ogrn=${ogrns}`).then((response) =>
            response.json()
        ),
    ]).catch((error) => alert(`${error.code}\r\n ${error.status}`));

    const orgsMap = reqsToMap(requisites);
    addInOrgsMap(orgsMap, analytics, "analytics");
    addInOrgsMap(orgsMap, buh, "buhForms");
    render(orgsMap, orgOgrns);
}

//делая замеры скорости, не обнаружил какого либо ускорения(что здесь 5 мл, что в прошлом варианте решение 5мл в среднем)
console.time("run");
run();
console.timeEnd("run");
async function sendRequest1(url) {
    const response = await fetch(url);
    if (!response.ok) {
        return Promise.reject({
            status: response.statusText,
            code: response.status,
        });
    }
    return response;
}

function sendRequest(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                callback(JSON.parse(xhr.response));
            }
        }
    };

    xhr.send();
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

document.querySelector("h1").innerHTML = "kapusta+kapusta";
