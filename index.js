const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const app = express();

app.use(fileUpload());

//to use ejs template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//parse request body as urlencoded data
app.use(express.urlencoded({ extended: true }));

let pathways = {};
let studentArr = [];

//home short for home.ejs
app.get("/", (req, res) => {
  pathways = {};
  studentArr = [];
  res.render("home");
});

app.post("/", async (req, res) => {
  //works after file upload
  const dataStr = req.files.raw_csv_data.data.toString();
  const results = csvToArr(dataStr, ",");
  studentArr.push(...results.formedArr);
  res.render("capacity", {
    pathways: results.keys,
    studentNum: studentArr.length,
  });
});

app.post("/capacity", (req, res) => {
  const body = req.body;
  pathways = { ...body };
  if (studentArr.length > 0) {
    const allocatedArr = autoAllocation(studentArr, pathways);

    const csv = arrToCsv(allocatedArr);
    const fileName = "results.csv";
    res.header("Content-Type", "text/csv");
    res.attachment(fileName);
    res.send(csv);
  }
});

app.listen(3000, () => {
  console.log("LISTENING ON PORT 3000");
});

const csvToArr = (stringVal, splitter) => {
  const [keys, ...rest] = stringVal
    .split("\r\n")
    .map((item) => item.split(splitter));

  const numberArray = rest.map((item) => item.map(Number));

  const formedArr = numberArray
    .map((item) => {
      const object = {};
      keys.forEach((key, index) => (object[key] = item.at(index)));
      return { ...object, pathway_id: null, choiceNumber: null };
    })
    .slice(0, -1);

  return { keys, formedArr };
};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] == value);
};

const autoAllocation = (dataArr, pathways) => {
  console.log(dataArr);
  const pathwayNum = Object.keys(pathways).length;
  dataArr.map((entry) => {
    for (let i = 1; i < pathwayNum; i++) {
      const choiceName = getKeyByValue(entry, i);
      const allocatedNum = dataArr.filter(
        (entry) => entry.pathway_id === choiceName
      ).length;
      const capacity = Number(pathways[choiceName]);
      if (allocatedNum < capacity) {
        entry.pathway_id = choiceName;
        entry.choiceNumber = i;
        break;
      } else {
        continue;
      }
    }
  });

  console.log(dataArr);

  return dataArr;
};

const arrToCsv = (arr) => {
  const keys = Object.keys(arr[0]);
  const commaSeparatedString = [
    keys.join(","),
    arr.map((element) => keys.map((key) => element[key]).join(",")).join("\n"),
  ].join("\n");

  return commaSeparatedString;
};
