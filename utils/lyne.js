const fetch = require('node-fetch');

module.exports = async (content) => {
  content = `${content}`;
  try {
    let result = await fetch('http://lyne.xyz:7777/documents', {
      method: 'POST',
      body: content
    });
    result = await result.json();
    return `http://lyne.xyz/${result.key}.js`;
  } catch (err) {
    return null;
  }
}
