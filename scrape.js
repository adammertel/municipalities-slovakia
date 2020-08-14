const cheerio = require("cheerio");
var request = require("then-request");
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

const scrap = async () => {
  const settlements = [];
  const tableBody = await getBodyOfUrl(tableUrl);
  const $ = cheerio.load(tableBody);

  $("table").map((ti, table) => {
    const tableEl = cheerio.load(table);
    tableEl("tr").map((ri, row) => {
      const rowEl = cheerio.load(row);
      const settlement = {};

      rowEl("td").map((ci, td) => {
        const columnEl = cheerio.load(td);

        // get name and the link
        if (ci === 0) {
          settlement.name = columnEl
            .text()
            .replace("\n ", "")
            .replace("\n", "");
          settlement.link = columnEl("a").attr("href");
        }
      });
      if (settlement.name && settlement.link) {
        settlements.push(settlement);
      }
    });
  });

  for (var si in settlements) {
    if (si < 3) {
      const settlement = settlements[si];
      const settlementHtml = await getBodyOfUrl(rootUrl + settlement.link);
      const settlementEl = cheerio.load(settlementHtml);

      settlementEl(".infobox tr").map((ri, row) => {
        const rowEl = cheerio.load(row);
        const rowTitle = rowEl("tr").attr("title");
        if (rowTitle === "Počet obyvateľov") {
          settlement.population = parseInt(rowEl("tr td").text());
        }
      });

      console.log(settlement);
    }
  }
};

scrap();
