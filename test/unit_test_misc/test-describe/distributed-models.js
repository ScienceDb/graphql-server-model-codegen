module.exports.book_adapter_readById = `
static readById(iri){
  let query = \`query readOneBook{ readOneBook(id: "\${iri}"){id        title
      genre
      publisher_id
} }\`;


  return axios.post(remoteCenzontleURL, {
      query: query
  }).then(res => {
      let data = res.data.data.readOneBook;
      return data;
  }).catch(error => {
      error['url'] = remoteCenzontleURL;
      handleError(error);
  });
}

`