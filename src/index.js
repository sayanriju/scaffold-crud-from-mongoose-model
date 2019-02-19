const { Command, flags } = require("@oclif/command")
const fs = require("fs")
const ejs = require("ejs")
const relative = require("relative")
const pluralize = require("pluralize")

function parseModel(model) {
  console.log(Object.values(model.schema.paths).find(p => p.instance === 'Array').caster.instance);
  const paths = Object.values(model.schema.paths)
    .map(p => ({
      field: p.path,
      type: p.instance,
      subType: p.instance === "Array" && p.caster !== undefined ? p.caster.instance : null,
      isRequired: p.isRequired,
      defaultValue: p.defaultValue,
      isNested: p.path.includes(".") === true,
      isDeepNested: p.path.split("").filter(c => c === ".").length > 1
    }))
    .reduce((acc, cur) => {
      if (!cur.field.startsWith("_")) {
        if (cur.isNested) {
          const topField = cur.field.split(".")[0]
          acc.push(Object.assign(cur, { topField }))
          if (acc.find(p => p.field === topField) === undefined) {
            acc.push(Object.assign(cur, {
              field: topField,
              type: "Object",
              isNested: false,
              isDeepNested: false
            }))
          }
        } else {
          acc.push(cur)
        }
      }
      return acc
    }, [])
  return {
    modelName: model.modelName,
    paths
  }
}

class TheCommand extends Command {
  async run() {
    // eslint-disable-next-line no-shadow
    const { args } = this.parse(TheCommand)
    const { inpFile, opDir } = args
    /* eslint-disable import/no-dynamic-require, global-require */
    const template = require("./template.js")

    await fs.promises.copyFile(inpFile, `${__dirname}/tmp-model.js`) // temporary file
    const model = require(`${__dirname}/tmp-model.js`)
    await fs.promises.unlink(`${__dirname}/tmp-model.js`) // del temporary file
    /* eslint-enable import/no-dynamic-require, global-require */

    const { modelName, paths } = parseModel(model)

    const mongooseModelName = modelName[0].toUpperCase() + modelName.substr(1)
    const mongooseDocNameSingular = modelName[0].toLowerCase() + modelName.substr(1)
    const mongooseDocNamePlural = pluralize(mongooseDocNameSingular)

    const opFile = `${opDir.replace(/\/$/, "")}/${mongooseDocNamePlural}.js` // the crud handlers file (full path)

    const data = {
      modelFilePath: relative(opFile, inpFile),
      mongooseModelName,
      mongooseDocNameSingular,
      mongooseDocNamePlural,
      paths
    }
    const rendered = await ejs.render(template, data, { async: true })

    await fs.promises.writeFile(opFile, rendered)

    this.log(`CRUD handlers have been (over)written to ${opFile}. Now fine-tune it according to your needs.`)
  }
}

TheCommand.description = `Generates an opinionated set of REST route handlers (annotated with Apidoc syntax) for Node/Express to perform CRUD operations upon a Mongoose Model.`

TheCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // add --help flag to show CLI version
  help: flags.help({ char: "h" }),
}

TheCommand.args = [
  { name: "inpFile", required: true, description: "Path to the FILE exporting the mongoose model" },
  {
    name: "opDir", required: true, description: "Path to the DIR where the genreated CRUD handlers file will be created (overwritten)"
  },
]

module.exports = TheCommand
