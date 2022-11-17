const API = {
    organizationList: "/orgsList",
    analytics: "/api3/analytics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

/*
    sendRequest(API.organizationList, (orgOgrns) => {
        const ogrns = orgOgrns.join(",");
        sendRequest(`${API.orgReqs}?ogrn=${ogrns}`, (requisites) => {
            const orgsMap = reqsToMap(requisites);
            sendRequest(`${API.analytics}?ogrn=${ogrns}`, (analytics) => {
                addInOrgsMap(orgsMap, analytics, "analytics");
                sendRequest(`${API.buhForms}?ogrn=${ogrns}`, (buh) => {
                    addInOrgsMap(orgsMap, buh, "buhForms");
                    render(orgsMap, orgOgrns);
                });
            });
        });
    });
 */


function run() {
    sendRequest(API.organizationList, (orgOgrns) => {
        const orgns = orgOgrns.join(",")
        return {orgns, orgOgrns}
    }).then(function (obj) {
            let orgns = obj.orgns;
            let func = obj.orgOgrns;
            return sendRequest(`${API.orgReqs}?ogrn=${orgns}`, (requisites) => {
                const orgsMap = reqsToMap(requisites)
                return {orgsMap, orgns, func}
            });
        })
        .then(function (obj) {
            let map = obj.orgsMap;
            let orgns = obj.orgns;
            let func = obj.func;
            return sendRequest(`${API.analytics}?ogrn=${orgns}`, (analytics) => {
                addInOrgsMap(map, analytics, "analytics")
                return {map, orgns, func}
            });
        })
        .then(function (obj) {
            let map = obj.map;
            let orgns = obj.orgns;
            let func = obj.func;
            return sendRequest(`${API.buhForms}?ogrn=${orgns}`, (buh) => {
                addInOrgsMap(map, buh, "buhForms");
                render(map, func);
            });
        })
}
run();

async function sendRequest(url, callback) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(callback(JSON.parse(xhr.response)));
                }
            }
        };
        xhr.send();
    })
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
