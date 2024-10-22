const { exec } = require("child_process");

const p = exec("ts-node .src/index.js")

p.stdout.on("data", (data) => {
    console.log(`${data}`.split("\n").join("\n"))
})
p.stderr.on("data", (data) => {
    console.log(`${data}`.split("\n").join("\n"));
});