const errorHandler = require('../../utils/errorHandler')
const { check } = require('express-validator/check')
const validateBody = require('../../middlewares/validateBody')
const log = require('../../utils/log')(module)
const isAuth = require('../../middlewares/isAuth')
const isAdmin = require('../../middlewares/isAdmin')
const path = require('path')
const fs = require('fs')

module.exports = app => {
  app.put('/artists/:id', [
    check('name')
      .isString()
      .exists(),
    check('link')
      .exists()
      .isString(),
    check('image')
      .exists()
      .isString(),
    check('visible')
      .optional()
      .isBoolean(),
    validateBody()
  ])
  app.put('/artists/:id', [isAuth('artists-modify'), isAdmin('artists-modify')])
  app.put('/artists/:id', async (req, res) => {
    const { Artist } = app.locals.models
    try {
      let artist = await Artist.findByPk(req.params.id)
      const files = fs.readdirSync(path.join(__dirname, '../../../../temp'))
      let file = files.find(f => f.indexOf(req.body.image) !== -1)
      if (file) {
        fs.unlinkSync(path.join(__dirname, '../../../..', artist.image))
        const oldfile = path.join(__dirname, '../../../../temp', file)
        const newfile = path.join(__dirname, '../../../../images', file)
        fs.copyFileSync(oldfile, newfile)
        fs.unlinkSync(oldfile)
        await artist.update({ ...req.body, image: '/images/' + file })
      } else {
        await artist.update(req.body)
      }

      log.info(`Artist ${artist.name} modified`)
      return res
        .status(200)
        .json(artist)
        .end()
    } catch (err) {
      errorHandler(err, res)
    }
  })
}