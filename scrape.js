const cheerio = require("cheerio");
var axios = require("axios");

var rootUrl = "https://sk.wikipedia.org/";

var tableUrl =
  "https://sk.wikipedia.org/wiki/Zoznam_slovensk%C3%BDch_obc%C3%AD_a_vojensk%C3%BDch_obvodov";

const getBodyOfUrl = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const replace = (where, what, toWhat) => {
  let result = where;
  what.forEach((w) => {
    result = result.split(w).join(toWhat);
  });
  return result;
};

// parsing string containing a year value
const parseYear = (text) => {
  if (parseInt(text) == text) {
    return parseInt(text);
  } else {
    const numbers = text.match(/\d/g);
    if (numbers.length > 3) {
      const year = parseInt(
        numbers.slice(numbers.length - 4, numbers.length).join("")
      );
      if (year < 2000) {
        return year;
      }
    }
  }
  return false;
};

const scrap = async () => {
  const municipalities = [];
  const tableBody = await getBodyOfUrl(tableUrl);
  const $ = cheerio.load(tableBody);

  // getting the list of municipalities and their links from the table
  $("table").map((ti, table) => {
    const tableEl = cheerio.load(table);
    tableEl("tr").map((ri, row) => {
      const rowEl = cheerio.load(row);
      const municipality = {};

      rowEl("td").map((ci, td) => {
        const columnEl = cheerio.load(td);

        // get name and the link
        if (ci === 0) {
          municipality.name = columnEl.text().replace(/\s/g, "");
          municipality.link = columnEl("a").attr("href");
        }
      });
      if (municipality.name && municipality.link) {
        municipalities.push(municipality);
      }
    });
  });

  // iterate all municipalities
  for (var si in municipalities) {
    if (si < 5000) {
      const municipality = municipalities[si];
      const municipalityHtml = await getBodyOfUrl(rootUrl + municipality.link);
      const municipalityEl = cheerio.load(municipalityHtml);

      municipalityEl(".infobox tr").map((ri, row) => {
        const rowEl = cheerio.load(row);
        const rowTitle = rowEl("tr th").text().trim();
        //console.log(rowTitle);

        if (rowTitle === "Obyvateľstvo") {
          municipality.population = parseInt(
            rowEl("tr td").contents().first().text().trim().replace(/\s/g, "")
          );
        } else if (rowTitle === "Kraj") {
          municipality.region = rowEl("tr td").contents().first().text().trim();
        } else if (rowTitle === "Okres") {
          municipality.district = rowEl("tr td")
            .contents()
            .first()
            .text()
            .trim();
        } else if (rowTitle === "Región") {
          municipality.region_historical = rowEl("tr td")
            .contents()
            .first()
            .text()
            .trim();
        } else if (rowTitle === "Rozloha") {
          municipality.area = parseFloat(
            rowEl("tr td").contents().first().text().trim().replace(",", ".")
          );
        } else if (rowTitle === "Prvá pís. zmienka") {
          municipality.first_mentioned = parseYear(
            rowEl("tr td").contents().first().text().trim()
          );
        } else if (rowTitle === "Nadmorská výška") {
          municipality.elevation = parseInt(
            rowEl("tr td").contents().first().text().trim()
          );
        }
      });

      //console.log(municipality);
    }
  }
};

scrap();
