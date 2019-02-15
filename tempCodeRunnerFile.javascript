/* eslint-disable */

const mongoose = require("mongoose")
const ejs = require("ejs")

const CatSchema = new mongoose.Schema({
  naam: { first: String, last: String },
  boyesh: { type: Number, required: true }
})

const model = mongoose.model("Cat", CatSchema)

console.log("======", model.schema.paths);
// console.log(Object.values(model.schema.paths).map(p => ({ name: p.path, boyesh: p.instance })));