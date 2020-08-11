require("colors");
const shell = require("shelljs");
shell.config.silent = true;
const inquirer = require("inquirer");
const fse = require("fs-extra");
const reactConfigList = require("./config");
const set = require("lodash.set");
const ora = require("ora");

const askQuestions = async () => {
  const selectedConfigList = [];

  const questions = reactConfigList.map(config => ({
    type: "list",
    name: config.name,
    message: config.question,
    choices: ["yes", "no"]
  }));

  const answers = await inquirer.prompt(questions);

  reactConfigList.forEach(config => {
    const matchingAnswer = answers[config.name];

    if (matchingAnswer && matchingAnswer === "yes") {
      selectedConfigList.push(config);
    }
  });

  return selectedConfigList;
};

const createNextApp = appName => {
  const spinner = ora("Running create-next-app... (May take more than 60 seconds)").start();

  return new Promise((resolve, reject) => {
    shell.exec(
      `npx create-next-app ${appName} -y`,
      () => {
        const cdRes = shell.cd(appName);

        if (cdRes.code !== 0) {
          console.log(`Error changing directory to: ${appName}`.red);
          reject();
        }

        spinner.succeed();
        resolve();
      }
    );
  });
};

const installPackages = async configList => {
  let dependencies = [];
  let devDependencies = [];

  configList.forEach(config => {
    dependencies = [...dependencies, ...config.dependencies];
    devDependencies = [...devDependencies, ...config.devDependencies];
  });

  await new Promise(resolve => {
    const spinner = ora("🚚 Installing additional dependencies...").start();

    shell.exec(`npm install --save ${dependencies.join(" ")}`, () => {
      spinner.succeed();
      resolve();
    });
  });

  await new Promise(resolve => {
    const spinner = ora("🚚 Installing additional dev dependencies...").start();

    shell.exec(`npm install --save-dev ${devDependencies.join(" ")}`, () => {
      spinner.succeed();
      resolve();
    });
  });
};

const updatePackageDotJson = configList => {
  const spinner = ora("✍️  Updating package.json scripts...");

  let packageEntries = configList.reduce(
    (acc, val) => [...acc, ...val.packageEntries],
    []
  );

  return new Promise(resolve => {
    const rawPackage = fse.readFileSync("package.json");
    const package = JSON.parse(rawPackage);

    packageEntries.forEach(script => {
      // Lodash `set` allows us to dynamically set nested keys within objects
      // i.e. scripts.foo = "bar" will add an entry to the foo field in scripts
      set(package, script.key, script.value);
    });

    fse.writeFile("package.json", JSON.stringify(package, null, 2), function(
      err
    ) {
      if (err) {
        spinner.fail();
        return console.log(err);
      }

      spinner.succeed();
      resolve();
    });
  });
};

const addTemplates = configList => {
  const spinner = ora("📝 Adding templates...");

  const templateList = configList.reduce(
    (acc, val) => [...acc, ...val.templates],
    []
  );

  return new Promise(resolve => {
    templateList.forEach(template => {
      // outputFile creates a directory when it doesn't exist
      fse.outputFile(template.path, template.file, err => {
        if (err) {
          return console.log(err);
        }
      });
    });

    spinner.succeed();
    resolve();
  });
};

const commitGit = () => {
  const spinner = ora("🔐 Committing files to Git...");

  return new Promise(resolve => {
    shell.exec(
      'git add . && git commit --no-verify -m "Secondary commit from Create UI App"',
      () => {
        spinner.succeed();
        resolve();
      }
    );
  });
};

exports.create = async (appName, appDirectory) => {
  const selectedConfigList = await askQuestions(appName, appDirectory);

  await createNextApp(appName);
  await installPackages(selectedConfigList);
  await updatePackageDotJson(selectedConfigList);
  await addTemplates(selectedConfigList);
  await commitGit();

  console.log(`\n🎉 Success! `.green);
  console.log(`✨ Created your new Next app with settings: ${selectedConfigList
      .map(_ => _.name)
      .join(", ")}.\ncd into ${appName} to get started.`.green
  );

  console.log(`\n\tyou can run several commands:\n`);
  console.log(`\tyarn dev`.cyan);
  console.log(`\t\tStarts the development server.`);

  console.log(`\n\tyarn build`.cyan);
  console.log(`\t\tBuilds the app for production.`);
  
  console.log(`\n\tyarn start`.cyan);
  console.log(`\t\tRuns the built app in production mode.`);

  console.log(`\n\tWe suggest that you begin by typing:`);

  console.log(`\t\tcd ${appName}\n\t\tyarn dev\n`.cyan);

  return true;
};