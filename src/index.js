const { Command, flags } = require("@oclif/command")
const util = require("util")
const fs = require("fs")
const path = require("path")
const ejs = require("ejs")
const relative = require("relative")
const pluralize = require("pluralize")

const writeFile = util.promisify(fs.writeFile)

function parseModel(model) {
  const paths = Object.values(model.schema.paths)
    .map(p => ({
      field: p.path,
      type: p.instance,
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
            acc.push({
              field: topField,
              type: "Object",
              isRequired: cur.isRequired,
              isNested: false,
              isDeepNested: false
            })
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
    const { args, flags } = this.parse(TheCommand)
    const { inpFile, opDir } = args
    /* eslint-disable import/no-dynamic-require, global-require */
    const template = require("./template.js")
    const model = require(inpFile)
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

    await writeFile(opFile, rendered)

    this.log(`CRUD handlers have been (over)written to ${opFile}`)
  }
}

TheCommand.description = `
Generates an opinionated set of REST route handlers (annotated with Apidoc syntax) for Node/Express to perform CRUD operations upon a Mongoose Model.
`

TheCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // add --help flag to show CLI version
  help: flags.help({ char: "h" }),
  // "input-file": flags.string({ char: "i", description: "path to the file exporting the mongoose model" }),
  // "output-dir": flags.string({ char: "o", description: "path to the dir where the genreated CRUD handlers file will be created (overwritten)" }),
}

TheCommand.args = [
  { name: "inpFile", required: true, description: "Full path to the file exporting the mongoose model" },
  {
    name: "opDir", required: false, description: "Full path to the dir where the genreated CRUD handlers file will be created (overwritten)", default: "."
  },
]

module.exports = TheCommand
