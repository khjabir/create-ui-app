#!/usr/bin/env node
const inquirer = require("inquirer");
const next = require("./next");

const askAppQuestions = () => {
  const questions = [
    {
      type: "input",
      name: "appName",
      message:
        "Enter name of your app (in kebab case: `your-app-name`)?"
    },
    {
      type: "list",
      name: "appType",
      message: "Choose your framework?",
      choices: ["next", "react", "angular", "vue"]
    }
  ];
  return inquirer.prompt(questions);
};

const appDict = {
  next
};

const run = async () => {
  const answer = await askAppQuestions();
  const { appName, appType } = answer;

  if (!appName || appName.length <= 0) {
    console.log(`Please enter a valid name for your new app.`.red);
    return process.exit(0);
  }

  const app = appDict[appType];

  if (!app) {
    console.log(
      `App type: ${appType} is currently not yet supported by this CLI tool.`.red
    );
    return process.exit(0);
  }

  const appDirectory = `${process.cwd()}/${appName}`;

  const res = await app.create(appName, appDirectory);

  if (!res) {
    console.log("There was an error generating your app.".red);
    return process.exit(0);
  }

  return process.exit(0);
};

run();