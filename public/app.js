const scanBtn = document.getElementById("scanBtn");
const urlInput = document.getElementById("urlInput");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const toolbar = document.getElementById("toolbar");
const resultCount = document.getElementById("resultCount");
const copyAllBtn = document.getElementById("copyAllBtn");

let lastResults = [];
let scanHistory =
    JSON.parse(
        localStorage.getItem("scanHistory")
    ) || [];

let favorites =
    JSON.parse(
        localStorage.getItem("favorites")
    ) || [];

let totalScans =
    Number(
        localStorage.getItem("totalScans")
    ) || 0;

// =====================================================
// SCAN BUTTON
// =====================================================

scanBtn.addEventListener("click", scanWebsite);

urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        scanWebsite();
    }
});

async function scanWebsite() {

    const url = urlInput.value.trim();

    if (!url) {
        alert("Please enter a URL.");
        return;
    }

    results.innerHTML = "";
    toolbar.classList.add("hidden");
    loading.classList.remove("hidden");

    try {

        const response = await fetch("/scan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url
            })
        });

        const data = await response.json();

        loading.classList.add("hidden");

        if (!response.ok) {
            throw new Error(
                data.error || "Scan failed"
            );
        }

        lastResults = data.results || [];
        

        totalScans++;

        localStorage.setItem(
            "totalScans",
            totalScans
        );

        scanHistory.push(url);

        localStorage.setItem(
            "scanHistory",
            JSON.stringify(scanHistory)
        );

        if (lastResults.length) {

            const first =
                lastResults[0].url;

            document.getElementById(
                "providerName"
            ).textContent =
                detectProvider(first);

            document.getElementById(
                "fileId"
            ).textContent =
                extractFileId(first);

            document.getElementById(
                "fileType"
            ).textContent =
                detectType(first);

        }

        updateDashboard();

displayResults(lastResults);

        displayResults(lastResults);

    } catch (err) {

        loading.classList.add("hidden");

        results.innerHTML = `
            <div class="error">
                ${err.message}
            </div>
        `;

        console.error(err);
    }
}

// =====================================================
// DISPLAY RESULTS
// =====================================================

function displayResults(items) {

    results.innerHTML = "";

    if (!items.length) {

        results.innerHTML = `
            <div class="welcome-card">
                <h3>No Results Found</h3>
                <p>
                    No documents or iframe links were detected.
                </p>
            </div>
        `;

        return;
    }

    toolbar.classList.remove("hidden");

    resultCount.textContent =
        `Results Found: ${items.length}`;

    items.forEach(item => {

        const card = document.createElement("div");

        const lower =
            item.url.toLowerCase();

        let typeLabel = "🔗 LINK";
        let extraClass = "";

        if (item.type === "IFRAME") {
            typeLabel = "🖼 IFRAME";
            extraClass = "iframe-card";
        }

        if (lower.endsWith(".pdf")) {
            typeLabel = "📄 PDF";
            extraClass = "pdf-card";
        }

        card.className =
            `result-card ${extraClass}`;

        card.innerHTML = `
            <div class="result-header">

                <div class="result-type">
                    ${typeLabel}
                </div>

            </div>

            <div class="result-link">
                ${escapeHtml(item.url)}
            </div>

            <div class="result-actions">

                <button
                    class="action-btn copy-btn"
                >
                    Copy
                </button>

                <button
                    class="action-btn open-btn"
                >
                    Open
                </button>

            </div>
        `;

        const copyBtn =
            card.querySelector(".copy-btn");

        const openBtn =
            card.querySelector(".open-btn");

        copyBtn.addEventListener(
            "click",
            async () => {

                await navigator.clipboard
                    .writeText(item.url);

                copyBtn.textContent =
                    "Copied!";

                setTimeout(() => {

                    copyBtn.textContent =
                        "Copy";

                }, 1200);

            }
        );

        openBtn.addEventListener(
            "click",
            () => {

                window.open(
                    item.url,
                    "_blank"
                );

            }
        );

        results.appendChild(card);

    });

}

// =====================================================
// COPY ALL
// =====================================================

copyAllBtn.addEventListener(
    "click",
    async () => {

        if (!lastResults.length) return;

        const text = lastResults
            .map(x => x.url)
            .join("\n");

        await navigator.clipboard
            .writeText(text);

        copyAllBtn.textContent =
            "Copied!";

        setTimeout(() => {

            copyAllBtn.textContent =
                "📋 Copy All";

        }, 1500);

    }
);

// =====================================================
// SECURITY
// =====================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
function detectProvider(url) {

    if (url.includes("drive.google.com")) {
        return "Google Drive";
    }

    if (url.includes("docs.google.com")) {
        return "Google Docs";
    }

    if (url.includes("dropbox.com")) {
        return "Dropbox";
    }

    if (url.includes("onedrive")) {
        return "OneDrive";
    }

    return "Unknown";
}

function extractFileId(url) {

    const match =
        url.match(
            /\/d\/([a-zA-Z0-9_-]+)/
        );

    return match
        ? match[1]
        : "-";
}

function detectType(url) {

    const lower =
        url.toLowerCase();

    if (lower.endsWith(".pdf"))
        return "PDF";

    if (lower.endsWith(".docx"))
        return "DOCX";

    if (lower.endsWith(".pptx"))
        return "PPTX";

    if (lower.endsWith(".xlsx"))
        return "XLSX";

    return "Unknown";
}
function updateDashboard() {

    document.getElementById(
        "totalScans"
    ).textContent =
        totalScans;

    document.getElementById(
        "favoriteCount"
    ).textContent =
        favorites.length;

    const historyList =
        document.getElementById(
            "historyList"
        );

    historyList.innerHTML =
        scanHistory.length
            ? scanHistory
                .slice(-10)
                .reverse()
                .map(
                    item =>
                    `<div class="history-item">${item}</div>`
                )
                .join("")
            : "No history yet.";

    const favoritesList =
        document.getElementById(
            "favoritesList"
        );

    favoritesList.innerHTML =
        favorites.length
            ? favorites
                .map(
                    item =>
                    `<div class="favorite-item">${item}</div>`
                )
                .join("")
            : "No favorites yet.";
}

updateDashboard();
