/* =========================================================
   NELOY AI VOICE ASSISTANT
   URL.gs
   ---------------------------------------------------------
   Purpose:
   - Create website URLs
   - Create search URLs
   - Validate URLs
   - Generate clickable links
   - Work together with Script.gs
   ---------------------------------------------------------
   Google Apps Script:
   URL.gs and Script.gs can exist in the SAME project.
   Functions in this file can be called from Script.gs.
   ========================================================= */


/* =========================================================
   1. BASIC CONFIGURATION
   ========================================================= */

const URL_CONFIG = {
  defaultProtocol: "https://",

  sites: {
    google: "https://www.google.com",
    youtube: "https://www.youtube.com",
    maps: "https://www.google.com/maps",
    wikipedia: "https://www.wikipedia.org",
    github: "https://github.com",
    facebook: "https://www.facebook.com",
    instagram: "https://www.instagram.com",
    tiktok: "https://www.tiktok.com",
    x: "https://x.com",
    reddit: "https://www.reddit.com",
    linkedin: "https://www.linkedin.com",
    bing: "https://www.bing.com",
    yahoo: "https://search.yahoo.com",
    duckduckgo: "https://duckduckgo.com"
  }
};


/* =========================================================
   2. URL ENCODING
   ========================================================= */

function encodeURLText(text) {

  if (text === null || text === undefined) {
    return "";
  }

  return encodeURIComponent(String(text).trim());
}


/* =========================================================
   3. CHECK WHETHER SOMETHING IS A VALID URL
   ========================================================= */

function isValidURL(url) {

  if (!url) {
    return false;
  }

  try {

    var value = String(url).trim();

    if (!/^https?:\/\//i.test(value)) {
      value = URL_CONFIG.defaultProtocol + value;
    }

    var parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch (error) {

    return false;
  }
}


/* =========================================================
   4. NORMALIZE URL
   ========================================================= */

function normalizeURL(url) {

  if (!url) {
    return "";
  }

  var value = String(url).trim();

  if (!/^https?:\/\//i.test(value)) {
    value = URL_CONFIG.defaultProtocol + value;
  }

  return value;
}


/* =========================================================
   5. CREATE BASIC WEBSITE URL
   ========================================================= */

function createWebsiteURL(domain, path) {

  if (!domain) {
    return "";
  }

  var base = String(domain).trim();

  if (!/^https?:\/\//i.test(base)) {
    base = URL_CONFIG.defaultProtocol + base;
  }

  if (!path) {
    return base;
  }

  path = String(path).trim();

  if (path.charAt(0) !== "/") {
    path = "/" + path;
  }

  return base.replace(/\/+$/, "") + path;
}


/* =========================================================
   6. GOOGLE SEARCH URL
   ========================================================= */

function createGoogleSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.google;
  }

  return (
    URL_CONFIG.sites.google +
    "/search?q=" +
    encodeURLText(query)
  );
}


/* =========================================================
   7. BING SEARCH URL
   ========================================================= */

function createBingSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.bing;
  }

  return (
    URL_CONFIG.sites.bing +
    "/search?q=" +
    encodeURLText(query)
  );
}


/* =========================================================
   8. YAHOO SEARCH URL
   ========================================================= */

function createYahooSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.yahoo;
  }

  return (
    URL_CONFIG.sites.yahoo +
    "/search?p=" +
    encodeURLText(query)
  );
}


/* =========================================================
   9. DUCKDUCKGO SEARCH URL
   ========================================================= */

function createDuckDuckGoSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.duckduckgo;
  }

  return (
    URL_CONFIG.sites.duckduckgo +
    "/?q=" +
    encodeURLText(query)
  );
}


/* =========================================================
   10. YOUTUBE SEARCH URL
   ========================================================= */

function createYouTubeSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.youtube;
  }

  return (
    URL_CONFIG.sites.youtube +
    "/results?search_query=" +
    encodeURLText(query)
  );
}


/* =========================================================
   11. GOOGLE MAPS SEARCH URL
   ========================================================= */

function createGoogleMapsURL(place) {

  if (!place) {
    return URL_CONFIG.sites.maps;
  }

  return (
    URL_CONFIG.sites.maps +
    "/search/?api=1&query=" +
    encodeURLText(place)
  );
}


/* =========================================================
   12. WIKIPEDIA SEARCH URL
   ========================================================= */

function createWikipediaSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.wikipedia;
  }

  return (
    "https://en.wikipedia.org/w/index.php?search=" +
    encodeURLText(query)
  );
}


/* =========================================================
   13. GITHUB SEARCH URL
   ========================================================= */

function createGitHubSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.github;
  }

  return (
    URL_CONFIG.sites.github +
    "/search?q=" +
    encodeURLText(query)
  );
}


/* =========================================================
   14. FACEBOOK URL
   ========================================================= */

function createFacebookURL(path) {

  if (!path) {
    return URL_CONFIG.sites.facebook;
  }

  return createWebsiteURL(
    URL_CONFIG.sites.facebook,
    path
  );
}


/* =========================================================
   15. INSTAGRAM URL
   ========================================================= */

function createInstagramURL(username) {

  if (!username) {
    return URL_CONFIG.sites.instagram;
  }

  username = String(username)
    .trim()
    .replace(/^@/, "");

  return (
    URL_CONFIG.sites.instagram +
    "/" +
    encodeURIComponent(username) +
    "/"
  );
}


/* =========================================================
   16. TIKTOK URL
   ========================================================= */

function createTikTokURL(username) {

  if (!username) {
    return URL_CONFIG.sites.tiktok;
  }

  username = String(username)
    .trim()
    .replace(/^@/, "");

  return (
    URL_CONFIG.sites.tiktok +
    "/@" +
    encodeURIComponent(username)
  );
}


/* =========================================================
   17. X / TWITTER PROFILE URL
   ========================================================= */

function createXURL(username) {

  if (!username) {
    return URL_CONFIG.sites.x;
  }

  username = String(username)
    .trim()
    .replace(/^@/, "");

  return (
    URL_CONFIG.sites.x +
    "/" +
    encodeURIComponent(username)
  );
}


/* =========================================================
   18. REDDIT SEARCH URL
   ========================================================= */

function createRedditSearchURL(query) {

  if (!query) {
    return URL_CONFIG.sites.reddit;
  }

  return (
    URL_CONFIG.sites.reddit +
    "/search/?q=" +
    encodeURLText(query)
  );
}


/* =========================================================
   19. LINKEDIN URL
   ========================================================= */

function createLinkedInURL(path) {

  if (!path) {
    return URL_CONFIG.sites.linkedin;
  }

  return createWebsiteURL(
    URL_CONFIG.sites.linkedin,
    path
  );
}


/* =========================================================
   20. CREATE CLICKABLE HTML LINK
   ========================================================= */

function createClickableLink(url, text) {

  if (!url) {
    return "";
  }

  var safeURL = normalizeURL(url);

  if (!isValidURL(safeURL)) {
    return "";
  }

  var linkText = text || safeURL;

  return (
    '<a href="' +
    escapeHTML(safeURL) +
    '" target="_blank" rel="noopener noreferrer">' +
    escapeHTML(linkText) +
    "</a>"
  );
}


/* =========================================================
   21. ESCAPE HTML
   ========================================================= */

function escapeHTML(text) {

  if (text === null || text === undefined) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   22. CREATE URL RESPONSE
   ========================================================= */

function createURLResponse(url, title) {

  if (!url) {

    return {
      success: false,
      url: "",
      html: "",
      message: "I could not create the URL."
    };
  }

  var finalURL = normalizeURL(url);

  if (!isValidURL(finalURL)) {

    return {
      success: false,
      url: "",
      html: "",
      message: "The URL does not appear to be valid."
    };
  }

  return {

    success: true,

    url: finalURL,

    html: createClickableLink(
      finalURL,
      title || "Open website"
    ),

    message:
      "URL created successfully. " +
      "Click the link to open the website."
  };
}


/* =========================================================
   23. GENERIC SEARCH URL
   ========================================================= */

function createSearchURL(engine, query) {

  if (!query) {
    return "";
  }

  engine = String(engine || "google")
    .trim()
    .toLowerCase();

  switch (engine) {

    case "google":
      return createGoogleSearchURL(query);

    case "bing":
      return createBingSearchURL(query);

    case "yahoo":
      return createYahooSearchURL(query);

    case "duckduckgo":
    case "duck":
      return createDuckDuckGoSearchURL(query);

    case "youtube":
      return createYouTubeSearchURL(query);

    case "github":
      return createGitHubSearchURL(query);

    case "wikipedia":
      return createWikipediaSearchURL(query);

    case "reddit":
      return createRedditSearchURL(query);

    case "maps":
    case "google maps":
      return createGoogleMapsURL(query);

    default:
      return createGoogleSearchURL(query);
  }
}


/* =========================================================
   24. SMART WEBSITE URL
   =========================================================
   This function can receive a website name and return
   a known official base URL.
   ========================================================= */

function createKnownWebsiteURL(name) {

  if (!name) {
    return "";
  }

  var value = String(name)
    .trim()
    .toLowerCase();

  var aliases = {

    "google": URL_CONFIG.sites.google,
    "google.com": URL_CONFIG.sites.google,

    "youtube": URL_CONFIG.sites.youtube,
    "youtube.com": URL_CONFIG.sites.youtube,

    "facebook": URL_CONFIG.sites.facebook,
    "facebook.com": URL_CONFIG.sites.facebook,

    "instagram": URL_CONFIG.sites.instagram,
    "instagram.com": URL_CONFIG.sites.instagram,

    "tiktok": URL_CONFIG.sites.tiktok,
    "tiktok.com": URL_CONFIG.sites.tiktok,

    "x": URL_CONFIG.sites.x,
    "twitter": URL_CONFIG.sites.x,
    "twitter.com": URL_CONFIG.sites.x,

    "reddit": URL_CONFIG.sites.reddit,
    "reddit.com": URL_CONFIG.sites.reddit,

    "github": URL_CONFIG.sites.github,
    "github.com": URL_CONFIG.sites.github,

    "linkedin": URL_CONFIG.sites.linkedin,
    "linkedin.com": URL_CONFIG.sites.linkedin,

    "bing": URL_CONFIG.sites.bing,
    "bing.com": URL_CONFIG.sites.bing,

    "yahoo": URL_CONFIG.sites.yahoo,
    "yahoo.com": URL_CONFIG.sites.yahoo,

    "duckduckgo": URL_CONFIG.sites.duckduckgo,
    "duckduckgo.com": URL_CONFIG.sites.duckduckgo,

    "wikipedia": URL_CONFIG.sites.wikipedia,
    "wikipedia.org": URL_CONFIG.sites.wikipedia
  };

  return aliases[value] || "";
}


/* =========================================================
   25. SMART URL CREATOR
   =========================================================
   Examples:

   createSmartURL("google", "cats")
   -> Google search URL

   createSmartURL("youtube", "funny videos")
   -> YouTube search URL

   createSmartURL("maps", "Dhaka")
   -> Google Maps search URL

   createSmartURL("website", "example.com")
   -> Website URL
   ========================================================= */

function createSmartURL(type, value) {

  if (!type || !value) {
    return "";
  }

  type = String(type)
    .trim()
    .toLowerCase();

  value = String(value).trim();

  switch (type) {

    case "google":
    case "google search":
      return createGoogleSearchURL(value);

    case "youtube":
    case "youtube search":
      return createYouTubeSearchURL(value);

    case "bing":
    case "bing search":
      return createBingSearchURL(value);

    case "yahoo":
    case "yahoo search":
      return createYahooSearchURL(value);

    case "duckduckgo":
    case "duckduckgo search":
      return createDuckDuckGoSearchURL(value);

    case "maps":
    case "map":
    case "google maps":
      return createGoogleMapsURL(value);

    case "wikipedia":
    case "wiki":
      return createWikipediaSearchURL(value);

    case "github":
    case "github search":
      return createGitHubSearchURL(value);

    case "reddit":
    case "reddit search":
      return createRedditSearchURL(value);

    case "instagram":
      return createInstagramURL(value);

    case "tiktok":
      return createTikTokURL(value);

    case "x":
    case "twitter":
      return createXURL(value);

    case "website":
    case "site":
    case "url":
      return normalizeURL(value);

    default:

      // If the user gave an actual URL,
      // accept it after validation.
      if (isValidURL(value)) {
        return normalizeURL(value);
      }

      // Otherwise use Google Search as a safe generic fallback.
      return createGoogleSearchURL(value);
  }
}


/* =========================================================
   26. CREATE BOT-FRIENDLY URL MESSAGE
   ========================================================= */

function createBotURLMessage(type, value, title) {

  var url = createSmartURL(type, value);

  if (!url) {

    return {
      success: false,
      url: "",
      html: "",
      text: "Sorry, I could not create that URL."
    };
  }

  if (!isValidURL(url)) {

    return {
      success: false,
      url: "",
      html: "",
      text: "Sorry, the generated URL is not valid."
    };
  }

  var linkTitle = title || "Open link";

  var html = createClickableLink(
    url,
    linkTitle
  );

  return {

    success: true,

    url: url,

    html: html,

    text:
      "Here is the URL:\n" +
      url +
      "\n\n" +
      "Click the link to open it."
  };
}


/* =========================================================
   27. PARSE A SIMPLE USER URL REQUEST
   =========================================================
   Examples:

   "Google search Python"
   "YouTube search funny videos"
   "Google Maps Dhaka"
   ========================================================= */

function parseURLRequest(userText) {

  if (!userText) {
    return {
      success: false,
      message: "No URL request was provided."
    };
  }

  var text = String(userText).trim();

  var lower = text.toLowerCase();

  /* Google */
  if (
    lower.indexOf("google search") === 0 ||
    lower.indexOf("google দিয়ে search") === 0
  ) {

    var googleQuery =
      text.replace(/^google\s+search\s*/i, "").trim();

    return createBotURLMessage(
      "google",
      googleQuery,
      "Open Google Search"
    );
  }


  /* YouTube */
  if (
    lower.indexOf("youtube search") === 0 ||
    lower.indexOf("youtube দিয়ে search") === 0
  ) {

    var youtubeQuery =
      text.replace(/^youtube\s+search\s*/i, "").trim();

    return createBotURLMessage(
      "youtube",
      youtubeQuery,
      "Open YouTube Search"
    );
  }


  /* Google Maps */
  if (
    lower.indexOf("google maps") === 0 ||
    lower.indexOf("maps") === 0
  ) {

    var mapQuery =
      text
        .replace(/^google\s+maps\s*/i, "")
        .replace(/^maps\s*/i, "")
        .trim();

    return createBotURLMessage(
      "maps",
      mapQuery,
      "Open Google Maps"
    );
  }


  /* Direct URL */
  if (isValidURL(text)) {

    return createBotURLMessage(
      "website",
      text,
      "Open Website"
    );
  }


  return {
    success: false,
    message: "I could not understand which URL you want me to create."
  };
}


/* =========================================================
   28. TEST FUNCTIONS
   ========================================================= */

function testURLBuilder() {

  Logger.log(
    createGoogleSearchURL("Python programming")
  );

  Logger.log(
    createYouTubeSearchURL("funny videos")
  );

  Logger.log(
    createGoogleMapsURL("Dhaka Bangladesh")
  );

  Logger.log(
    createInstagramURL("example")
  );

  Logger.log(
    createTikTokURL("example")
  );

  Logger.log(
    createXURL("example")
  );

  Logger.log(
    createGitHubSearchURL("javascript")
  );

  Logger.log(
    createWikipediaSearchURL("Bangladesh")
  );

  Logger.log(
    createSmartURL(
      "google",
      "how to learn JavaScript"
    )
  );
}
