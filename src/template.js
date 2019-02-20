module.exports = `
const <%= mongooseModelName %> = require("<%= modelFilePath %>")

module.exports = {

  /**
   * Fetch all the <%= mongooseModelName %>s
   * @api {get} /<%= mongooseDocNamePlural %> 1.0 Fetch all the <%= mongooseModelName %>s
   * @apiName fetch<%= mongooseModelName %>s
   * @apiGroup <%= mongooseModelName %>
   * @apiPermission Public
   *
   * @apiHeader {String} Authorization The JWT Token in format "Bearer xxxx.yyyy.zzzz"
   *
   * @apiSuccessExample {type} Success-Response: 200 OK
   * {
   *     error : false,
   *     <%= mongooseDocNamePlural %>: [{}]
   * }
   */
  async find(req, res) {
    try {
      const <%= mongooseDocNamePlural %> = await <%= mongooseModelName %>.find({}).exec()
      return res.json({ error: false, <%= mongooseDocNamePlural %> })
    } catch (err) {
      return res.status(500).json({ error: true, reason: err.message })
    }
  },

  /**
   * Find a <%= mongooseModelName %> by _id
   * @api {get} /<%= mongooseDocNameSingular %>/:id 2.0 Find a <%= mongooseModelName %> by _id
   * @apiName get<%= mongooseModelName %>
   * @apiGroup <%= mongooseModelName %>
   * @apiPermission Public
   *
   * @apiHeader {String} Authorization The JWT Token in format "Bearer xxxx.yyyy.zzzz"
   *
   * @apiParam {String} id \`URL Param\` The _id of the <%= mongooseModelName %> to find
   *
   * @apiSuccessExample {type} Success-Response: 200 OK
   * {
   *     error : false,
   *     <%= mongooseDocNameSingular %>: {}
   * }
   */
  async get(req, res) {
    try {
      const <%= mongooseDocNameSingular %> = await <%= mongooseModelName %>.findOne({ _id: req.params.id }).exec()
      return res.json({ error: false, <%= mongooseDocNameSingular %> })
    } catch (err) {
      return res.status(500).json({ error: true, reason: err.message })
    }
  },

  /**
   * Create a new <%= mongooseModelName %>
   * @api {post} /<%= mongooseDocNameSingular %> 3.0 Create a new <%= mongooseModelName %>
   * @apiName create<%= mongooseModelName %>
   * @apiGroup <%= mongooseModelName %>
   * @apiPermission Public
   *
   * @apiHeader {String} Authorization The JWT Token in format "Bearer xxxx.yyyy.zzzz"
   *<% paths.filter(p => p.isRequired === true).forEach(p => { %>
   * @apiParam  {<%= p.type !== 'Array' ? p.type : p.subType + '[]' %>} <%= p.field %> <%= mongooseModelName + ' ' + p.field %><% if (p.enumValues !== null) { %> \`enum=[<%- p.enumValues.map(ev => '"' + ev + '"').join(', ') %>]\`<% } %><% }) %><% paths.filter(p => p.isRequired !== true).forEach(p => { %>
   * @apiParam  {<%= p.type !== 'Array' ? p.type : p.subType + '[]' %>} [<%= p.field %><%= p.defaultValue !== undefined && typeof p.defaultValue !== 'function' && p.type !== 'Array' ? '=' + p.defaultValue : '' %>] <%= mongooseModelName + ' ' + p.field %><% if (p.enumValues !== null) { %> \`enum=[<%- p.enumValues.map(ev => '"' + ev + '"').join(', ') %>]\`<% } %><% }) %>
   *
   * @apiSuccessExample {type} Success-Response: 200 OK
   * {
   *     error : false,
   *     <%= mongooseDocNameSingular %>: {}
   * }
   */
  async post(req, res) {
    try {
      const {
        <%= paths.filter(p => p.isNested !== true).map(p => p.field).join(", ") %>
      } = req.body<% paths.filter(p => p.isRequired === true).forEach(p => { %>
      if (<%= p.field %> === undefined) return res.status(400).json({ error: true, reason: "Missing manadatory field '<%= p.field %>'" })<% }) %>
      const <%= mongooseDocNameSingular %> = await <%= mongooseModelName %>.create({
        <%= paths.filter(p => p.isNested !== true).map(p => p.field).join(", ") %>
      })
      return res.json({ error: false, <%= mongooseDocNameSingular %> })
    } catch (err) {
      return res.status(500).json({ error: true, reason: err.message })
    }
  },

  /**
   * Edit a <%= mongooseModelName %> by _id
   * @api {put} /<%= mongooseDocNameSingular %>/:id 4.0 Edit a <%= mongooseModelName %> by _id
   * @apiName edit<%= mongooseModelName %>
   * @apiGroup <%= mongooseModelName %>
   * @apiPermission Public
   *
   * @apiHeader {String} Authorization The JWT Token in format "Bearer xxxx.yyyy.zzzz"
   *
   * @apiParam {String} id \`URL Param\` The _id of the <%= mongooseModelName %> to edit
<% paths.filter(p => p.isRequired !== true).forEach(p => { %>
   * @apiParam  {<%= p.type !== 'Array' ? p.type : p.subType + '[]' %>} [<%= p.field %><%= p.defaultValue !== undefined && typeof p.defaultValue !== 'function' && p.type !== 'Array' ? '=' + p.defaultValue : '' %>] <%= mongooseModelName + ' ' + p.field %><% if (p.enumValues !== null) { %> \`enum=[<%- p.enumValues.map(ev => '"' + ev + '"').join(', ') %>]\`<% } %><% }) %>
   *
   * @apiSuccessExample {type} Success-Response: 200 OK
   * {
   *     error : false,
   *     <%= mongooseDocNameSingular %>: {}
   * }
   */
  async put(req, res) {
    try {
      const {
        <%= paths.filter(p => p.isNested !== true).map(p => p.field).join(", ") %>
      } = req.body
      const <%= mongooseDocNameSingular %> = await <%= mongooseModelName %>.findOne({ _id: req.params.id }).exec()
      if (<%= mongooseDocNameSingular %> === null) return res.status(400).json({ error: true, reason: "No such <%= mongooseModelName %>!" })
<% paths.filter(p => !p.isDeepNested && p.type !== "Object").forEach(p => { %>
      <% if (p.isNested) { %>if (<%= p.topField %> !== undefined && <%= p.field %> !== undefined) <%= mongooseDocNameSingular %>.<%= p.field %> = <%= p.field %><% } else { %>if (<%= p.field %> !== undefined) <%= mongooseDocNameSingular %>.<%= p.field %> = <%= p.field %><% } %><% }) %>

      await <%= mongooseDocNameSingular %>.save()
      return res.json({ error: false, <%= mongooseDocNameSingular %> })
    } catch (err) {
      return res.status(500).json({ error: true, reason: err.message })
    }
  },

  /**
   * Delete a <%= mongooseModelName %> by _id
   * @api {delete} /<%= mongooseDocNameSingular %>/:id 4.0 Delete a <%= mongooseModelName %> by _id
   * @apiName delete<%= mongooseModelName %>
   * @apiGroup <%= mongooseModelName %>
   * @apiPermission Public
   *
   * @apiHeader {String} Authorization The JWT Token in format "Bearer xxxx.yyyy.zzzz"
   *
   * @apiParam {String} id \`URL Param\` The _id of the <%= mongooseModelName %> to delete
   *
   * @apiSuccessExample {type} Success-Response:
   * {
   *     error : false,
   * }
   */
  async delete(req, res) {
    try {
      await <%= mongooseModelName %>.deleteOne({ _id: req.params.id })
      return res.json({ error: false })
    } catch (err) {
      return res.status(500).json({ error: true, reason: err.message })
    }
  }

}
`
