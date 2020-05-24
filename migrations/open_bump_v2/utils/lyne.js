const fetch = require('node-fetch')

module.exports = async (content) => {
  content = `${content}`
  try {
    let result = await fetch('https://lyne.xyz/documents', {
      method: 'POST',
      body: content
    })
    result = await result.json()
    return `http://lyne.xyz/${result.key}.js`
  } catch (err) {
    console.log('Error while fetching lyne link:')
    console.log(err)
    return null
  }
}
