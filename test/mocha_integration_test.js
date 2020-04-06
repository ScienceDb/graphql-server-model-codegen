const { expect } = require('chai');
const path = require('path');
const delay = require('delay');
const itHelpers = require('./integration_test_misc/integration_test_helpers');

//HINT:
//DELETE FROM transcript_counts;
//DELETE FROM individuals;
//ALTER SEQUENCE individuals_id_seq RESTART WITH 1;
//ALTER SEQUENCE transcript_counts_id_seq RESTART WITH 1;

describe(
  'Clean GraphQL Server: one new basic function per test ("Individual" model)',
  function() {

    it('01. Individual table is empty', function() {
        let res = itHelpers.request_graph_ql_post('{ countIndividuals }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.countIndividuals).equal(0);
    });


    it('02. Individual add', function() {
        let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "First") { id } }');

        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.addIndividual.id).equal("1");
    });


    it('03. Individual update', function() {

        let res = itHelpers.request_graph_ql_post('mutation { updateIndividual(id: 1, name: "FirstToSecondUpdated") {id name} }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                updateIndividual: {
                    id: "1",
                    name: "FirstToSecondUpdated"
                }
            }
        })
    });

    it('04. Individual add one more and find both', function() {

        itHelpers.request_graph_ql_post('mutation { addIndividual(name: "Second") {id} }');
        let res = itHelpers.request_graph_ql_post('{ individuals {id} }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.individuals.length).equal(2);

    });


    it('05. Individual read one', function() {

        let res = itHelpers.request_graph_ql_post('{ readOneIndividual(id : 2) { id name } }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                readOneIndividual: {
                    id: "2",
                    name: "Second"
                }
            }
        })

    });

    it('06. Individual search with like', function() {

        let res = itHelpers.request_graph_ql_post('{individuals(search:{field:name, value:{value:"%Second%"}, operator:like}) {name}}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.individuals.length).equal(2);

    });

    it('07. Individual paginate', function() {

        let res = itHelpers.request_graph_ql_post('{individuals(pagination:{limit:1}) {id name}}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.individuals.length).equal(1);

    });

    it('08. Individual sort', function() {

        let res = itHelpers.request_graph_ql_post('{individuals(pagination: {limit:2}, order: [{field: name, order: DESC}]) {name}}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                individuals: [
                    {name: "Second"},
                    {name: "FirstToSecondUpdated"}
                ]
            }
        })

    });

    it('09. Individual delete all', function() {

        let res = itHelpers.request_graph_ql_post('{ individuals {id} }');
        let individuals = JSON.parse(res.body.toString('utf8')).data.individuals;

        for(let i = 0; i < individuals.length; i++){
            res = itHelpers.request_graph_ql_post(`mutation { deleteIndividual (id: ${individuals[i].id}) }`);
            expect(res.statusCode).to.equal(200);
        }

        itHelpers.count_all_records('countIndividuals').then(cnt => {
            expect(cnt).to.equal(0)
        });

    });

    // transcript_count model tests start here:
    it('10. TranscriptCount table is empty', function() {

        let res = itHelpers.request_graph_ql_post('{countTranscript_counts}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.countTranscript_counts).equal(0);

    });


    it('11. TranscriptCount add', function() {

        let res = itHelpers.request_graph_ql_post('mutation ' +
            '{ addTranscript_count(gene: "Gene A", ' +
                                  'variable: "RPKM", ' +
                                  'count: 123.32, ' +
                                  'tissue_or_condition: "Root") { id } }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.addTranscript_count.id).equal("1");

    });


    it('12. TranscriptCount update', function() {

        let res = itHelpers.request_graph_ql_post('mutation { updateTranscript_count(id: 1, gene: "Gene B") {id gene} }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                updateTranscript_count: {
                    id: "1",
                    gene: "Gene B"
                }
            }
        })

    });

    it('13. TranscriptCount add one more and find both', function() {

        itHelpers.request_graph_ql_post('mutation { addTranscript_count(gene: "Gene C", ' +
                                                                       'variable: "RPKM", ' +
                                                                       'count: 321.23, ' +
                                                                       'tissue_or_condition: "Stem") {id} }');
        let res = itHelpers.request_graph_ql_post('{ transcript_counts {id} }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.transcript_counts.length).equal(2);

    });


    it('14. TranscriptCount read one', function() {

        let res = itHelpers.request_graph_ql_post('{readOneTranscript_count(id : 2) { id gene variable count tissue_or_condition}}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                readOneTranscript_count: {
                    id: "2",
                    gene: "Gene C",
                    variable: "RPKM",
                    count: 321.23,
                    tissue_or_condition: "Stem"
                }
            }
        })

    });

    it('15. TranscriptCount search with like', function() {

        let res = itHelpers.request_graph_ql_post(`{transcript_counts(search: {field: gene,value:{value:"%ene%"},operator: like}) {gene}}`);
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.transcript_counts.length).equal(2);

    });

    it('16. TranscriptCount paginate', function() {

        let res = itHelpers.request_graph_ql_post('{transcript_counts(pagination:{limit:1}) {id gene}}');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.transcript_counts.length).equal(1);

    });

    it('17. TranscriptCount sort', function() {

        let res = itHelpers.request_graph_ql_post('{ transcript_counts(pagination: {limit:2}, order: [{field: gene, order: DESC}]) {gene} }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                transcript_counts: [
                    {gene: "Gene C"},
                    {gene: "Gene B"}
                ]
            }
        })
    });

    it('18. Extended search and regular expressions', function() {
        let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "Zazanaza") { id name } }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.addIndividual.name).equal("Zazanaza");

        res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "Zazaniza") { id name } }');
        resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.addIndividual.name).equal("Zazaniza");

        res = itHelpers.request_graph_ql_post(`{ individuals (search: {field: name, operator: regexp, value: {value: "Zazan[ai]za"}}) {name}}`);
        resBody = JSON.parse(res.body.toString('utf8'));
        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
            data: {
                individuals: [
                    {name: "Zazanaza"},
                    {name: "Zazaniza"}
                ]
            }
        });
    });




    // Test belongs-to relation between transcript_count and individual data
    // model:
    it('19. TranscriptCount assign new Individual', function() {

        // Create Plant to subjected to RNA-Seq analysis from which the transcript_counts result
        let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "IncredibleMaizePlantOne") { id name } }');
        let resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody.data.addIndividual.name).equal("IncredibleMaizePlantOne");
        let plantId = resBody.data.addIndividual.id;

        // Create TranscriptCount with above Plant assigned as Individual
        res = itHelpers.request_graph_ql_post('mutation { addTranscript_count(gene: "Gene D", ' +
                                                                             'variable: "RPKM", ' +
                                                                             'count: 321.23, ' +
                                                                             'tissue_or_condition: "Stem", ' +
                                                                             `addIndividual: ${plantId}) ` +
                                                                             '{id gene individual { id name } } }');
        let tcResBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(tcResBody).to.deep.equal({
            data: {
              addTranscript_count: {
                id: "3",
                gene: "Gene D",
                individual: {
                  id: "5",
                  name: "IncredibleMaizePlantOne"
                }
              }
            }
        })
    });

  it('20. TranscriptCount delete all', function() {

      let res = itHelpers.request_graph_ql_post('{ transcript_counts {id} }');
      let transcript_counts = JSON.parse(res.body.toString('utf8')).data.transcript_counts;

      for(let i = 0; i < transcript_counts.length; i++){
          res = itHelpers.request_graph_ql_post(`mutation { deleteTranscript_count (id: ${transcript_counts[i].id}) }`);
          expect(res.statusCode).to.equal(200);
      }

      itHelpers.count_all_records('countTranscript_counts').then(cnt => {
          expect(cnt).to.equal(0);
      });
  });

});


describe(
    'Web service model',
    function() {

        it('01. Webservice simulator is up', function() {

            let res = itHelpers.request_graph_ql_get('/aminoAcidSequence/63165');
            let resBody = JSON.parse(res.body.toString('utf8'));

            expect(res.statusCode).to.equal(200);
            expect(resBody).to.deep.equal({
                "accession": "P63165",
                "id": 63165,
                "sequence": "MSDQEAKPSTEDLGDKKEGEYIKLKVIGQDSSEIHFKVKMTTHLKKLKESYCQRQGVPMNSLRFLFEGQRIADNHTPKELGMEEEDVIEVYQEQTGGHSTV"
            });

        });

        it('02. Webservice read one', function() {

            let res = itHelpers.request_graph_ql_post('{ readOneAminoacidsequence(id : 69905) { id accession sequence} }');
            let resBody = JSON.parse(res.body.toString('utf8'));

            expect(res.statusCode).to.equal(200);
            expect(resBody).to.deep.equal({
                "data": {
                    "readOneAminoacidsequence": {
                        "accession": "P69905",
                        "id": "69905",
                        "sequence": "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR"
                    }
                }
            });
        });

        it('03. Webservice associate new TranscriptCount', function() {
            let res = itHelpers.request_graph_ql_post('mutation { addTranscript_count(gene: "new_gene", ' +
                                                                                     'addAminoacidsequence: 63165) { id aminoacidsequence{id }} }');
            let resBody = JSON.parse(res.body.toString('utf8'));
            expect(res.statusCode).to.equal(200);

            let tcId = resBody.data.addTranscript_count.id;
            res = itHelpers.request_graph_ql_post(`{ readOneTranscript_count(id : ${tcId}) ` +
                                                   '{ id aminoacidsequence{id accession} } }');
            resBody = JSON.parse(res.body.toString('utf8'));

            expect(res.statusCode).to.equal(200);
            expect(resBody).to.deep.equal({
                "data": {
                    "readOneTranscript_count": {
                        "aminoacidsequence": {
                            "accession": "P63165",
                            "id": "63165"
                        },
                        "id": `${tcId}`
                    }
                }
            });
        });
});




describe( 'Batch Upload', function() {

    it('01. SCV individual batch upload', async function () {

        let csvPath = path.join(__dirname, 'integration_test_misc', 'individual_valid.csv');

        // count records before upload
        let cnt1 = await itHelpers.count_all_records('countIndividuals');

        // batch_upload_csv start new background, there is no way to test the actual result
        // without explicit delay. The test may fail if delay is too small, just check the
        // resulting DB table to be sure that all records from file individual_valid.csv were added.
        let success = await itHelpers.batch_upload_csv(csvPath, 'mutation {bulkAddIndividualCsv{id}}');
        expect(success).equal(true);
        await delay(500);

        // count records before upload
        let cnt2 = await itHelpers.count_all_records('countIndividuals');
        expect(cnt2 - cnt1).to.equal(4);
    });
});

describe(
    'Generic async validation tests',
    function() {

        it('01. Validate on add', function () {

            let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "@#$%^&") { name } }');
            let resBody = JSON.parse(res.body.toString('utf8'));

            // expect(res.statusCode).to.equal(500);
            expect(resBody).to.have.property('errors');

        });

        it('02. Validate on update', function () {

            // Add correct record
            let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "ToBeUpdated") { id } }');
            let resBody = JSON.parse(res.body.toString('utf8'));

            expect(res.statusCode).to.equal(200);

            // Try to update to incorrect
            res = itHelpers.request_graph_ql_post(`mutation { updateIndividual(id: ${resBody.data.addIndividual.id}, name: "#$%^&*") {id name} }`);
            resBody = JSON.parse(res.body.toString('utf8'));

            // expect(res.statusCode).to.equal(500);
            expect(resBody).to.have.property('errors');
        });

        it('03. Validate on delete', function () {

            // Add a record with a special name that can't be deleted
            let res = itHelpers.request_graph_ql_post('mutation { addIndividual(name: "Undeletable") { id } }');
            let resBody = JSON.parse(res.body.toString('utf8'));
            expect(res.statusCode).to.equal(200);

            // Try to delete an item with a special name that can't be deleted (see individual_validate_joi.patch for details)
            res = itHelpers.request_graph_ql_post(`mutation { deleteIndividual (id: ${resBody.data.addIndividual.id}) }`);
            resBody = JSON.parse(res.body.toString('utf8'));

            // expect(res.statusCode).to.equal(500);
            expect(resBody).to.have.property('errors');

        });


        it('04. Validate CSV individual batch upload', async function () {
            let csvPath = path.join(__dirname, 'integration_test_misc', 'individual_invalid.csv');

            // count records before upload
            let cnt1 = await itHelpers.count_all_records('countIndividuals');

            // batch_upload_csv start new background, it returns a response without
            // an error independently if there are validation errors during batch add or not.
            // These errors will be sent to the user's e-mail.
            let success = await itHelpers.batch_upload_csv(csvPath, 'mutation {bulkAddIndividualCsv{ id}}');
            expect(success).equal(true);
            await delay(500);

            // count records before upload
            let cnt2 = await itHelpers.count_all_records('countIndividuals');
            expect(cnt2 - cnt1).to.equal(0);
        });

        it('05. CSV with explicit Null values', async function () {
            let csvPath = path.join(__dirname, 'integration_test_misc', 'transcript_count_nulls.csv');

            // count records before upload
            let cnt1 = await itHelpers.count_all_records('countTranscript_counts');

            // batch_upload_csv start new background, it returns a response without
            // an error independently if there are validation errors during batch add or not.
            // These errors will be sent to the user's e-mail.
            let success = await itHelpers.batch_upload_csv(csvPath, 'mutation { bulkAddTranscript_countCsv {id}}');
            expect(success).equal(true);
            await delay(500);

            // count records before upload
            let cnt2 = await itHelpers.count_all_records('countTranscript_counts');
            expect(cnt2 - cnt1).to.equal(1);
        });

    });

  describe(
        'Date types test',
        function() {
          it('01. Create and retrieve instance with date type', function() {

              // Create Plant to subjected to RNA-Seq analysis from which the transcript_counts result
              let res = itHelpers.request_graph_ql_post('mutation { addSequencingExperiment(name: "Experiment 1" start_date: "2007-12-03" end_date: "2010-12-03") {id name  start_date} }');
              let resBody = JSON.parse(res.body.toString('utf8'));
              expect(res.statusCode).to.equal(200);
              expect(resBody.data.addSequencingExperiment.start_date).equal("2007-12-03");
              let experimentId = resBody.data.addSequencingExperiment.id;

              // Create TranscriptCount with above Plant assigned as Individual
              res = itHelpers.request_graph_ql_post(`{ readOneSequencingExperiment(id: ${experimentId}){ start_date end_date  } }`);
              let tcResBody = JSON.parse(res.body.toString('utf8'));
              expect(res.statusCode).to.equal(200);
              expect(tcResBody).to.deep.equal({
                  data: {
                    readOneSequencingExperiment: {
                      start_date: "2007-12-03",
                      end_date: "2010-12-03"

                    }
                  }
              })
          });

  });
