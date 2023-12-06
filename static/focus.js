const API = {
    organizationList: "/orgsList",
    analytics: "/api3/analytics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

async function run() {
    try {
        const orgOgrns = await sendRequest(API.organizationList);
        const ogrns = orgOgrns.join(",");
        const [ requisites, analytics, buh ] = await Promise.all([
            sendRequest(`${API.orgReqs}?ogrn=${ogrns}`),
            sendRequest(`${API.analytics}?ogrn=${ogrns}`),
            sendRequest(`${API.buhForms}?ogrn=${ogrns}`),
        ]);
        const orgsMap = reqsToMap(requisites);
        addInOrgsMap(orgsMap, analytics, "analytics");
        addInOrgsMap(orgsMap, buh, "buhForms");
        render(orgsMap, orgOgrns);
    } catch (e) {
        alert(`Failed: ${e.code} ${e.status}`);
    }
}

function sendRequest(url) {
    return fetch(url)
        .then(res => {
            if (res.status >= 300 && !res.ok) throw { code: res.status, status: res.statusText };
            return res.json();
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

    name.textContent = getLegalName(orgInfo);
    indebtedness.textContent = formatMoney(getAnalytics(orgInfo));
    money.textContent = getMoney(orgInfo);
    address.textContent = getAddress(orgInfo);

    container.appendChild(clone);
}

function getLegalName(orgInfo) {
    return (orgInfo.UL && orgInfo.UL.legalName && orgInfo.UL.legalName.short) || "";
}

function getAnalytics(orgInfo) {
    return orgInfo.analytics.s1002 || 0;
}

function getMoney(orgInfo) {
    if (orgInfo.buhForms && orgInfo.buhForms.length && orgInfo.buhForms[orgInfo.buhForms.length - 1] && orgInfo.buhForms[orgInfo.buhForms.length - 1].year === 2017) {
        return formatMoney(orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0].endValue) || "—";
    } else {
        return "—";
    }
}

function getAddress(orgInfo) {
    const addressFromServer = orgInfo.UL.legalAddress.parsedAddressRF;
    return createAddress(addressFromServer);
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

run();
