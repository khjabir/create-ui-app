const helloWorld = require("./templates/helloWorld");

module.exports = {
  name: "withHelloWorld",
  question: "Do you want your app to include Hello World?",
  dependencies: ["@nectar-it/nec-ui"],
  devDependencies: [],
  packageEntries: [
    { key: "dummyKey", value: "Package JSON edit test" },
  ],
  templates: [
    { path: "src/components/helloWorld.tsx", file: helloWorld },
  ]
};