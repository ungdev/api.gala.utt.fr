const errorHandler = require('../../utils/errorHandler')
const { check } = require('express-validator/check')
const validateBody = require('../../middlewares/validateBody')
const log = require('../../utils/log')(module)
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')
const path = require('path')
const fs = require('fs')

module.exports = app => {
  app.post('/events', [
    check('name')
      .isString()
      .exists(),
    check('start')
      .exists()
      .isString(),
    check('end')
      .exists()
      .isString(),
    check('image')
      .exists()
      .isString(),
    check('place')
      .optional()
      .isString(),
    check('description')
      .optional()
      .isString(),
    check('artist')
      .optional()
      .isString(),
    check('visible')
      .optional()
      .isBoolean(),
    validateBody()
  ])
  app.post('/events', [isAuth('events-create'), isAdmin('events-create')])
  app.post('/events', async (req, res) => {
    const { Event } = app.locals.models
    try {
      const files = fs.readdirSync(path.join(__dirname, '../../../../temp'))
      let file = files.find(f => f.indexOf(req.body.image) !== -1)
      const oldfile = path.join(__dirname, '../../../../temp', file)
      const newfile = path.join(__dirname, '../../../../images', file)
      fs.copyFileSync(oldfile, newfile)
      fs.unlinkSync(oldfile)

      let event = await Event.create({ ...req.body, image: '/images/' + file })
      log.info(`Event ${event.name} created`)
      return res
        .status(200)
        .json(event)
        .end()
    } catch (err) {
      errorHandler(err, res)
    }
  })
}
