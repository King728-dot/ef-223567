const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function makeAbsolute(baseUrl, link) {
  try {
    return new URL(link, baseUrl).href;
  } catch {
    return link;
  }
}

app.post("/scan", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL is required"
      });
    }

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 FileGrabberWeb"
      }
    });

    const $ = cheerio.load(response.data);

    const results = [];

    // ==========================
    // FILE LINKS
    // ==========================

    $("a[href]").each((i, el) => {
      const href = $(el).attr("href");

      if (!href) return;

      const fullUrl = makeAbsolute(url, href);

      if (
        /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|txt|mp4|mp3)$/i.test(
          fullUrl
        )
      ) {
        let provider = "Unknown";
        let fileId = null;

        if (fullUrl.includes("drive.google.com")) {

        provider = "Google Drive";

        const match = fullUrl.match(
            /\/file\/d\/([^/]+)\//
        );

        if (match) {
            fileId = match[1];
        }
        }

        results.push({
        type: "IFRAME",
        url: fullUrl,
        provider,
        fileId
        });
      }
    });

    // ==========================
    // IFRAMES
    // ==========================

    $("iframe").each((i, el) => {
      const src = $(el).attr("src");

      if (!src) return;

      const fullUrl = makeAbsolute(url, src);

      results.push({
        type: "IFRAME",
        url: fullUrl
      });
    });

    // ==========================
    // REMOVE DUPLICATES
    // ==========================

    const unique = [];

    const seen = new Set();

    for (const item of results) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        unique.push(item);
      }
    }

    // ==========================
    // PDF FIRST SORTING
    // ==========================

    unique.sort((a, b) => {
      const aPdf =
        a.url.toLowerCase().endsWith(".pdf");

      const bPdf =
        b.url.toLowerCase().endsWith(".pdf");

      if (aPdf && !bPdf) return -1;
      if (!aPdf && bPdf) return 1;

      return 0;
    });

    res.json({
      count: unique.length,
      results: unique
    });

  } catch (err) {
    console.error(err.message);

    res.status(500).json({
      error: "Failed to scan URL"
    });
  }
});

app.listen(3000, () => {
  console.log(
    "FileGrabber Web running on http://localhost:3000"
  );
});