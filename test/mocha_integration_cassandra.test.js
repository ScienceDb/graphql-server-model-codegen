const { expect } = require('chai');
const itHelpers = require('./integration_test_misc/integration_test_helpers');

describe('Cassandra Local', function() {
  after(async function() {
    let res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first:20}) {edges {node {incident_id}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    let edges = resBody.data.incidentsConnection.edges;
    for (let edge of edges) {
      let id = edge.node.incident_id;
      res = itHelpers.request_graph_ql_post(`mutation { deleteIncident(incident_id: "${id}")}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          deleteIncident: "Item successfully deleted"
        }
      });
    }
    res = itHelpers.request_graph_ql_post(`{countIncidents}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countIncidents: 0
      }
    });
    res = itHelpers.request_graph_ql_post(`{instantsConnection(pagination:{first:20}) {edges {node {instant_id}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
     edges = resBody.data.instantsConnection.edges;
    for (let edge of edges) {
      let id = edge.node.instant_id;
      res = itHelpers.request_graph_ql_post(`mutation { deleteInstant(instant_id: "${id}")}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          deleteInstant: "Item successfully deleted"
        }
      });
    }
    res = itHelpers.request_graph_ql_post(`{countInstants}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countInstants: 0
      }
    });
  })
  it('01. Incident table is empty', function() {
    let res = itHelpers.request_graph_ql_post(`{countIncidents}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countIncidents: 0
      }
    });
  })

  it('02. Add an incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_1", incident_description: "An event" ) {incident_id incident_description}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_1",
              incident_description: "An event"
          }
      }
    });
  })

  it('03. Read an incident', function() {
    let res = itHelpers.request_graph_ql_post('{readOneIncident(incident_id: "incident_1") {incident_id incident_description}}');
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          readOneIncident: {
              incident_id: "incident_1",
              incident_description: "An event"
          }
      }
    });
  })

  it('04. Update an incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { updateIncident(incident_id: "incident_1", incident_description: "Another event" ) {incident_id incident_description}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateIncident: {
              incident_id: "incident_1",
              incident_description: "Another event"
          }
      }
  });
  })

  // The following produces a warning that is omitted in the return of the model function: 'Aggregation query used without partition key'
  // The server response can return an array of warnings in info.warnings - in this case it has one element
  // The warning itself should be taken seriously in large databases, but here there is only one element.

  it('05. Count and search incidents', function() {
    let res = itHelpers.request_graph_ql_post(`{countIncidents}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countIncidents: 1
      }
    });
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first:20}) {edges {cursor node{incident_id incident_description}} pageInfo{endCursor hasNextPage}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    let cursor = resBody.data.incidentsConnection.edges[0].cursor;
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          incidentsConnection: {
              edges: [
                  {
                    cursor: `${cursor}`,
                    node: {
                      incident_id: "incident_1",
                      incident_description: "Another event"
                    }
                  }
              ],
              pageInfo: {
                  endCursor: null,
                  hasNextPage: false
              }
          }
      }
  });

  });

  it('06. Delete an incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { deleteIncident(incident_id: "incident_1")}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          deleteIncident: "Item successfully deleted"
      }
    });
  })

  it('07. Create 5 incidents, test pagination and delete the incidents in a loop', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_2", incident_description: "First incident", incident_number: 1 ) {incident_id incident_description}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_2",
              incident_description: "First incident"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_3", incident_description: "Second incident", incident_number: 2 ) {incident_id incident_description}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_3",
              incident_description: "Second incident"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_4", incident_description: "Third incident", incident_number: 3 ) {incident_id incident_description}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_4",
              incident_description: "Third incident"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_5", incident_description: "Fourth incident", incident_number: 4 ) {incident_id incident_description}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_5",
              incident_description: "Fourth incident"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_6", incident_description: "Fifth incident", incident_number: 5 ) {incident_id incident_description}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_6",
              incident_description: "Fifth incident"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first:20}) {edges {cursor node{incident_id incident_description incident_number}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    let edges = resBody.data.incidentsConnection.edges;
    let idArray = edges.map(edge => edge.node.incident_id);
    let cursorArray = edges.map(edge => edge.cursor);
    let numberArray = edges.map(edge => edge.node.incident_number);
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first: 2}) {edges{cursor node{incident_id}} pageInfo{endCursor hasNextPage}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        incidentsConnection: {
          edges: [
            {
              cursor: cursorArray[0],
              node: {
                incident_id: idArray[0]
              }
            },
            {
              cursor: cursorArray[1],
              node: {
                incident_id: idArray[1]
              }
            }
          ],
          pageInfo: {
            endCursor: cursorArray[1],
            hasNextPage: true
          }
        }
      }
    })
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first: 2, after: "${cursorArray[1]}"}) {edges{cursor node{incident_id}} pageInfo{endCursor hasNextPage}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        incidentsConnection: {
          edges: [
            {
              cursor: cursorArray[2],
              node: {
                incident_id: idArray[2]
              }
            },
            {
              cursor: cursorArray[3],
              node: {
                incident_id: idArray[3]
              }
            }
          ],
          pageInfo: {
            endCursor: cursorArray[3],
            hasNextPage: true
          }
        }
      }
    })
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(pagination:{first: 2, after: "${cursorArray[3]}"}) {edges{cursor node{incident_id}} pageInfo{endCursor hasNextPage}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        incidentsConnection: {
          edges: [
            {
              cursor: cursorArray[4],
              node: {
                incident_id: idArray[4]
              }
            }
          ],
          pageInfo: {
            endCursor: null,
            hasNextPage: false
          }
        }
      }
    })
    res = itHelpers.request_graph_ql_post(`{incidentsConnection(search:{field: incident_number, value:"3", operator: gt}, pagination:{first: 1}) {edges{node{incident_id incident_number}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    let idx = numberArray.indexOf(5);
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        incidentsConnection: {
          edges: [
            {
              node: {
                incident_id: idArray[idx],
                incident_number: 5
              }
            }
          ]
        }
      }
    });
    for (let edge of edges) {
      let id = edge.node.incident_id;
      res = itHelpers.request_graph_ql_post(`mutation { deleteIncident(incident_id: "${id}")}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          deleteIncident: "Item successfully deleted"
        }
      });
    }
    res = itHelpers.request_graph_ql_post(`{countIncidents}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countIncidents: 0
      }
    });
  });

  it('08. Instant table is empty', function() {
    let res = itHelpers.request_graph_ql_post(`{countInstants}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countInstants: 0
      }
    });
  })

  it('09. Add an instant', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { addInstant(instant_id: "instant_1", year: 2020, month: 6, day: 18, hour: 10, minute: 52 ) {instant_id year month day hour minute}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addInstant: {
              instant_id: "instant_1",
              year: 2020,
              month: 6,
              day: 18,
              hour: 10,
              minute: 52
          }
      }
    });
  })

  it('10. Read an instant', function() {
    let res = itHelpers.request_graph_ql_post('{readOneInstant(instant_id: "instant_1") {instant_id year month day hour minute}}');
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          readOneInstant: {
              instant_id: "instant_1",
              year: 2020,
              month: 6,
              day: 18,
              hour: 10,
              minute: 52
          }
      }
    });
  })

  it('11. Update an instant', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { updateInstant(instant_id: "instant_1", minute: 57 ) {instant_id year month day hour minute}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateInstant: {
              instant_id: "instant_1",
              year: 2020,
              month: 6,
              day: 18,
              hour: 10,
              minute: 57
          }
      }
    });
  })

  it('12. Count and search instants', function() {
    let res = itHelpers.request_graph_ql_post(`{countInstants}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          countInstants: 1
      }
    });
    res = itHelpers.request_graph_ql_post(`{instantsConnection(pagination:{first:20}) {edges{cursor node{instant_id year month day hour minute}} pageInfo{endCursor hasNextPage}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    let cursor = resBody.data.instantsConnection.edges[0].cursor;
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          instantsConnection: {
              edges: [
                  {
                    cursor: `${cursor}`,
                    node: {
                      instant_id: "instant_1",
                      year: 2020,
                      month: 6,
                      day: 18,
                      hour: 10,
                      minute: 57
                    }
                  }
              ],
              pageInfo: {
                  endCursor: null,
                  hasNextPage: false
              }
          }
      }
    });

  });

  it('13. Generate an incident and associate it to the instant', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_7", incident_description: "Associations test incident", addInstants: "instant_1") {incident_id incident_description}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addIncident: {
              incident_id: "incident_7",
              incident_description: "Associations test incident"
          }
      }
    });
  })

  it('14. Read the instant and its connection to the incident', function() {
    let res = itHelpers.request_graph_ql_post(`{instantsConnection(pagination:{first:20}, search:{field: instant_id, operator: eq, value: "instant_1"}) {edges {node {instant_id incident_assoc_id incident {incident_id}}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          instantsConnection: {
              edges: [
                  {
                      node: {
                          instant_id: "instant_1",
                          incident_assoc_id: "incident_7",
                          incident: {
                              incident_id: "incident_7"
                          }
                      }
                  }
              ]
          }
      }
  });
  })

  it('15. Generate a new instant and associate it to the incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation { addInstant(instant_id: "instant_2", year: 2020, month: 6, day: 22, hour: 18, minute: 47, addIncident: "incident_7") {instant_id year month day hour minute incident_assoc_id}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addInstant: {
              instant_id: "instant_2",
              year: 2020,
              month: 6,
              day: 22,
              hour: 18,
              minute: 47,
              incident_assoc_id: "incident_7"
          }
      }
    });
  })

  it('16. Read the incident and its connection to the instants', function() {
    let res = itHelpers.request_graph_ql_post(`{readOneIncident(incident_id: "incident_7") {incident_id instantsConnection(pagination:{first:5}) {edges {node{ instant_id}}} }}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          readOneIncident: {
              incident_id: "incident_7",
              instantsConnection: {
                  edges: [
                      {
                          node: {
                              instant_id: "instant_2"
                          }
                      },
                      {
                          node: {
                              instant_id: "instant_1"
                          }
                      }
                  ]
              }
          }
      }
    });
  })

  it('17. Delete the associations', function() {
    let res = itHelpers.request_graph_ql_post(`{instantsConnection(pagination:{first:20}, search:{field: incident_assoc_id, operator: eq, value:"incident_7"}) {edges {node{ instant_id}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    let edges = resBody.data.instantsConnection.edges;
    expect(edges.length).to.equal(2);
    for (let edge of edges) {
      let id = edge.node.instant_id;
      res = itHelpers.request_graph_ql_post(`mutation{updateInstant(instant_id: "${id}", removeIncident: "incident_7") {instant_id incident_assoc_id}}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          updateInstant: {
            instant_id: `${id}`,
            incident_assoc_id: null
          }
        }
      });
    }
  })

  it('18. Get the table template', function() {
    let res = itHelpers.request_graph_ql_post(`{csvTableTemplateIncident}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          csvTableTemplateIncident: [
              "incident_id,incident_description,incident_number,capital_id",
              "String,String,Int,String"
          ]
      }
    });
  });

  it('19. Associate cassandra to sql model', function() {
    // create sql-capital
    let res = itHelpers.request_graph_ql_post(`mutation { addCapital(capital_id: "cass_assoc_capital_1", name: "London") {capital_id}}`);
    expect(res.statusCode).to.equal(200);

    // create and associate a cassandra incident
    res = itHelpers.request_graph_ql_post(`mutation { addIncident(incident_id: "incident_8", incident_description: "Associations to sql test incident", addTown:"cass_assoc_capital_1") {incident_id incident_description}}`);
    expect(res.statusCode).to.equal(200);

    // check if the association is set correctly
    res = itHelpers.request_graph_ql_post(`{readOneIncident(incident_id: "incident_8") {incident_id town{capital_id name}}}`)
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      "data": {
        "readOneIncident": {
          "incident_id": "incident_8",
          "town": {
            "capital_id": "cass_assoc_capital_1",
            "name": "London"
          }
        }
      }
    });

    // cleanup
    res = itHelpers.request_graph_ql_post(`mutation{ updateIncident(incident_id:"incident_8",removeTown:"cass_assoc_capital_1"){incident_id}}`)
    expect(res.statusCode).to.equal(200);
    res = itHelpers.request_graph_ql_post(`mutation{deleteCapital(capital_id:"cass_assoc_capital_1")}`);
    res = itHelpers.request_graph_ql_post(`mutation{deleteIncident(incident_id:"incident_8")}`);
  });
});

describe('Cassandra DDM', function() {

  after(async function() {
    let res = itHelpers.request_graph_ql_post(`{dist_incidentsConnection(pagination:{first:20}) {edges {node {incident_id}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    let edges = resBody.data.dist_incidentsConnection.edges;
    for (let edge of edges) {
      let id = edge.node.incident_id;
      res = itHelpers.request_graph_ql_post(`mutation { deleteDist_incident(incident_id: "${id}")}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          deleteDist_incident: "Item successfully deleted"
        }
      });
    }
    res = itHelpers.request_graph_ql_post(`{countDist_incidents}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        countDist_incidents: 0
      }
    });
    res = itHelpers.request_graph_ql_post(`{dist_instantsConnection(pagination:{first:20}) {edges {node {instant_id}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
     edges = resBody.data.dist_instantsConnection.edges;
    for (let edge of edges) {
      let id = edge.node.instant_id;
      res = itHelpers.request_graph_ql_post(`mutation { deleteDist_instant(instant_id: "${id}")}`);
      resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        data: {
          deleteDist_instant: "Item successfully deleted"
        }
      });
    }
    res = itHelpers.request_graph_ql_post(`{countDist_instants}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        countDist_instants: 0
      }
    });
  });

  it('01. Create an incident and 2 instants', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {addDist_incident(incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136", incident_description: "First incident on server 1") {incident_id incident_description}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        addDist_incident: {
          incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136",
          incident_description: "First incident on server 1"
        }
      }
    })
    res = itHelpers.request_graph_ql_post(`mutation {addDist_instant(instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791", year: 2020, month: 6, day: 29, hour: 15, minute: 27) {instant_id year month day hour minute}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        addDist_instant: {
          instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791",
          year: 2020,
          month: 6,
          day: 29,
          hour: 15,
          minute: 27
        }
      }
    })
    res = itHelpers.request_graph_ql_post(`mutation {addDist_instant(instant_id: "instance1-592a5d9f-ee5f-4392-9e2e-6965e8250c89", year: 2020, month: 6, day: 29, hour: 15, minute: 32) {instant_id year month day hour minute}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
        addDist_instant: {
          instant_id: "instance1-592a5d9f-ee5f-4392-9e2e-6965e8250c89",
          year: 2020,
          month: 6,
          day: 29,
          hour: 15,
          minute: 32
        }
      }
    })
  })

  it('02. Update the incident to associate with an instant', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {updateDist_incident(incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136", addDist_instants: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791") {incident_id countFilteredDist_instants dist_instantsConnection(pagination:{first:2}) {edges {node {instant_id}}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateDist_incident: {
              incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136",
              countFilteredDist_instants: 1,
              dist_instantsConnection: {
                  edges: [
                      {
                          node: {
                              instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791"
                          }
                      }
                  ]
              }
          }
      }
    });
  })

  it('03. Update the other instant to associate with the incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {updateDist_instant(instant_id: "instance1-592a5d9f-ee5f-4392-9e2e-6965e8250c89", addDist_incident: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136") {instant_id year month day hour minute dist_incident {incident_id}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateDist_instant: {
              instant_id: "instance1-592a5d9f-ee5f-4392-9e2e-6965e8250c89",
              year: 2020,
              month: 6,
              day: 29,
              hour: 15,
              minute: 32,
              dist_incident: {
                  incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136"
              }
          }
      }
    });
  })

  it('04. Update the incident to remove the second instant', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {updateDist_incident(incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136", removeDist_instants: "instance1-592a5d9f-ee5f-4392-9e2e-6965e8250c89") {incident_id countFilteredDist_instants dist_instantsConnection(pagination: {first:2}) {edges {node {instant_id}}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateDist_incident: {
              incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136",
              countFilteredDist_instants: 1,
              dist_instantsConnection: {
                  edges: [
                      {
                          node: {
                              instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791"
                          }
                      }
                  ]
              }
          }
      }
    });
  })

  it('05. Update the first instant to remove the incident', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {updateDist_instant(instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791", removeDist_incident: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136") {instant_id year month day hour minute dist_incident {incident_id}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateDist_instant: {
              instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791",
              year: 2020,
              month: 6,
              day: 29,
              hour: 15,
              minute: 27,
              dist_incident: null
          }
      }
    });
  })

  it('06. Add another incident and read all', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {addDist_incident(incident_id: "instance1-76aa1cb4-8c1b-42f1-bd10-c9c6ea29fb35", incident_description: "First incident on server 2") {incident_id incident_description}}`)
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addDist_incident: {
              incident_id: "instance1-76aa1cb4-8c1b-42f1-bd10-c9c6ea29fb35",
              incident_description: "First incident on server 2"
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`{dist_incidentsConnection(pagination: {first: 2}) {edges {node {incident_id incident_description dist_instantsConnection(pagination:{first:2}) {edges {node {instant_id}}}}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      data: {
          dist_incidentsConnection: {
              edges: [
                  {
                      node: {
                          incident_id: "instance1-76aa1cb4-8c1b-42f1-bd10-c9c6ea29fb35",
                          incident_description: "First incident on server 2",
                          dist_instantsConnection: {
                              edges: []
                          }
                      }
                  },
                  {
                      node: {
                        incident_description: "First incident on server 1",
                        incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136",                        
                          dist_instantsConnection: {
                              edges: []
                          }
                      }
                  }
              ]
          }
      }
    });
  })

  it('07. Search and pagination', function() {
    let res = itHelpers.request_graph_ql_post(`mutation {addDist_incident(incident_id: "instance1-2a389803-68e7-4090-9ef5-c24df84693c9", incident_description: "Second incident on server 1") {incident_id incident_description countFilteredDist_instants dist_instantsConnection(pagination: {first:2}) {edges {node {instant_id}}}}}`);
    let resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addDist_incident: {
              incident_id: "instance1-2a389803-68e7-4090-9ef5-c24df84693c9",
              incident_description: "Second incident on server 1",
              countFilteredDist_instants: 0,
              dist_instantsConnection: {
                  edges: []
              }
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation {addDist_incident(incident_id: "instance1-45d70035-6e95-4e03-9d78-ae69bd0158a6", incident_description: "Second incident on server 2") {incident_id incident_description countFilteredDist_instants dist_instantsConnection(pagination: {first:2}) {edges {node {instant_id}}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addDist_incident: {
              incident_id: "instance1-45d70035-6e95-4e03-9d78-ae69bd0158a6",
              incident_description: "Second incident on server 2",
              countFilteredDist_instants: 0,
              dist_instantsConnection: {
                  edges: []
              }
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation {addDist_incident(incident_id: "instance1-711cda30-608a-4703-a309-20ba0fbc376b", incident_description: "Third incident on server 1", addDist_instants: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791") {incident_id incident_description countFilteredDist_instants dist_instantsConnection(pagination:{first:2}) {edges {node {instant_id}}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          addDist_incident: {
              incident_id: "instance1-711cda30-608a-4703-a309-20ba0fbc376b",
              incident_description: "Third incident on server 1",
              countFilteredDist_instants: 1,
              dist_instantsConnection: {
                  edges: [
                    {
                      node: {
                        instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791"
                      }
                    }
                  ]
              }
          }
      }
    });
    
    res = itHelpers.request_graph_ql_post(`{dist_incidentsConnection(pagination:{first: 4}) {edges {node {incident_id incident_description countFilteredDist_instants dist_instantsConnection(pagination:{first:5}) {edges {node {instant_id year month day hour minute}}}}}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          dist_incidentsConnection: {
              edges: [
                  {
                    node: {
                        incident_id: "instance1-76aa1cb4-8c1b-42f1-bd10-c9c6ea29fb35",
                        incident_description: "First incident on server 2",
                        countFilteredDist_instants: 0,
                        dist_instantsConnection: {
                            edges: []
                        }
                    }
                  },
                  {
                      node: {
                          incident_id: "instance1-711cda30-608a-4703-a309-20ba0fbc376b",
                          incident_description: "Third incident on server 1",
                          countFilteredDist_instants: 1,
                          dist_instantsConnection: {
                              edges: [
                                  {
                                      node: {
                                          instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791",
                                          year: 2020,
                                          month: 6,
                                          day: 29,
                                          hour: 15,
                                          minute: 27
                                      }
                                  }
                              ]
                          }
                      }
                  },
                  {
                      node: {
                          incident_id: "instance1-2a389803-68e7-4090-9ef5-c24df84693c9",
                          incident_description: "Second incident on server 1",
                          countFilteredDist_instants: 0,
                          dist_instantsConnection: {
                              edges: []
                          }
                      }
                  },
                  {
                      node: {
                          incident_id: "instance1-682bfd7b-3d77-4e1c-a964-cf8b10ef2136",
                          incident_description: "First incident on server 1",
                          countFilteredDist_instants: 0,
                          dist_instantsConnection: {
                              edges: []
                          }
                      }
                  }
              ]
          }
      }
    });
    res = itHelpers.request_graph_ql_post(`mutation{updateDist_instant(instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791", removeDist_incident: "instance1-711cda30-608a-4703-a309-20ba0fbc376b") {instant_id dist_incident {incident_id}}}`);
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(res.statusCode).to.equal(200);
    expect(resBody).to.deep.equal({
      data: {
          updateDist_instant: {
              instant_id: "instance1-1b85fddc-67a5-46f3-81a0-20aea167d791",
              dist_incident: null
          }
      }
    });
  });
});

describe('cassandra Foreign-key arrays', function() {
  //set up the environment
  before(async function(){
    //measurements for sql and zendro-server tests
    let res = itHelpers.request_graph_ql_post('mutation{addCity(city_id:"cassandra_city_1" name:"cologne"){city_id} }');
    expect(res.statusCode).to.equal(200);
    res = itHelpers.request_graph_ql_post('mutation{addCity(city_id:"cassandra_city_2" name:"duesseldorf"){city_id } }');
    expect(res.statusCode).to.equal(200);
  });

  //clean up records
  after(async function() {
    itHelpers.request_graph_ql_post('mutation{deleteCity(city_id:"cassandra_city_1")}');
    itHelpers.request_graph_ql_post('mutation{deleteCity(city_id:"cassandra_city_2")}');
    itHelpers.request_graph_ql_post('mutation{deleteRiver(river_id:"fkA_river_1")}');
  });

  it('01. Create record and add association - cassandra', function() {
    let res = itHelpers.request_graph_ql_post('mutation{addRiver(river_id:"fkA_river_1" name:"rhine" addCities:["cassandra_city_1","cassandra_city_2"]){river_id city_ids}}');
    expect(res.statusCode).to.equal(200);
    let resBody = JSON.parse(res.body.toString('utf8'));
    //check it has been created correctly
    expect(resBody.data).to.deep.equal({addRiver: { river_id: 'fkA_river_1', city_ids: [ 'cassandra_city_1', 'cassandra_city_2' ] }});
    //check inverse association
    res = itHelpers.request_graph_ql_post('{citiesConnection(pagination:{first: 2}){edges{node{city_id river_ids}}}} ')
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      "data": { "citiesConnection": { "edges": [ { "node": { "city_id": "cassandra_city_2", "river_ids": [ "fkA_river_1" ] } }, { "node": { "city_id": "cassandra_city_1", "river_ids": [ "fkA_river_1" ] } } ] } }
    });
  });

  it('02. Query associated records - cassandra', function() {
    let res = itHelpers.request_graph_ql_post('{readOneCity(city_id:"cassandra_city_1"){city_id riversFilter(pagination: {limit: 2}){river_id}}}');
    expect(res.statusCode).to.equal(200);
    let resBody = JSON.parse(res.body.toString('utf8'));
    //check associated records
    expect(resBody.data).to.deep.equal({readOneCity: {"city_id": "cassandra_city_1", "riversFilter": [{"river_id": "fkA_river_1"}]}});
  });

  it('03. Update record and remove one association - cassandra', function() {
    let res = itHelpers.request_graph_ql_post('mutation{updateCity(city_id:"cassandra_city_1" removeRivers:["fkA_river_1"]){city_id river_ids}}');
    expect(res.statusCode).to.equal(200);
    let resBody = JSON.parse(res.body.toString('utf8'));
    //check it has been updated correctly
    expect(resBody.data).to.deep.equal({updateCity: { city_id: 'cassandra_city_1', river_ids: [ ] }});
    //check inverse association
    res = itHelpers.request_graph_ql_post('{rivers(pagination:{limit: 2}){river_id city_ids}}')
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      "data": {"rivers": [{"river_id": "fkA_river_1","city_ids": ["cassandra_city_2"]}]}});
  });

  it('04. Update record and add one association - cassandra', function() {
    let res = itHelpers.request_graph_ql_post('mutation{updateRiver(river_id:"fkA_river_1" addCities:["cassandra_city_1"]){river_id city_ids}}');
    // let res = itHelpers.request_graph_ql_post('mutation{updateCity(city_id:"cassandra_city_1" addRivers:["fkA_river_1"]){city_id river_ids}}');
    expect(res.statusCode).to.equal(200);
    let resBody = JSON.parse(res.body.toString('utf8'));
    //check it has been updated correctly
    expect(resBody.data).to.deep.equal({updateRiver: { river_id: 'fkA_river_1', city_ids: [ "cassandra_city_2","cassandra_city_1" ] }});
    //check inverse association
    res = itHelpers.request_graph_ql_post('{citiesConnection(pagination:{first: 2}){edges{node{city_id river_ids}}}} ')
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      "data": {"citiesConnection": {"edges": [{"node": {"city_id": "cassandra_city_2","river_ids": ["fkA_river_1"]}},{"node": {"city_id": "cassandra_city_1","river_ids": ["fkA_river_1"]}}]}}});
  });

  it('05. Update record and remove all association - cassandra', function() {
    let res = itHelpers.request_graph_ql_post('mutation{updateRiver(river_id:"fkA_river_1" removeCities:["cassandra_city_1","cassandra_city_2"]){river_id city_ids}}');
    expect(res.statusCode).to.equal(200);
    let resBody = JSON.parse(res.body.toString('utf8'));
    //check it has been updated correctly
    expect(resBody.data).to.deep.equal({updateRiver: { river_id: 'fkA_river_1', city_ids: [ ] }});
    //check inverse association
    res = itHelpers.request_graph_ql_post('{citiesConnection(pagination:{first: 2}){edges{node{city_id river_ids}}}} ')
    resBody = JSON.parse(res.body.toString('utf8'));
    expect(resBody).to.deep.equal({
      "data": {"citiesConnection": {"edges": [{"node": {"city_id": "cassandra_city_2","river_ids": null}},{"node": {"city_id": "cassandra_city_1","river_ids": null}}]}}
    });
  });

});

describe(
  'Cassandra Array type attributes: create, update and read record for Arr table',
  function() {

    after(async function() {

      let res = itHelpers.request_graph_ql_post(`mutation { deleteCity (city_id: "cassandra_arrs_city_1") }`);
      expect(res.statusCode).to.equal(200);

      // check count
      let cnt = await itHelpers.count_all_records('countCities');
      expect(cnt).to.equal(0);
    })


    it('01. Arr create', async function() {
        let res = itHelpers.request_graph_ql_post(`mutation { addCity(city_id: "cassandra_arrs_city_1", strArr:["str1", "str2", "str3"], intArr:[1, 2, 3], floatArr:[1.1, 3.34, 453.232], boolArr:[true, false]) { city_id strArr intArr floatArr boolArr} }`);

        expect(res.statusCode).to.equal(200);
        let resBody = JSON.parse(res.body.toString('utf8'));
        //check it has been updated correctly
        expect(resBody.data).to.deep.equal({
        "addCity": {"city_id": "cassandra_arrs_city_1","strArr": ["str1","str2","str3"],"intArr": [1,2,3],"floatArr": [1.100000023841858,3.3399999141693115,453.23199462890625],"boolArr": [true,false]}});
    });


    it('02. Arr update', function() {
        res = itHelpers.request_graph_ql_post(`mutation { updateCity(city_id: "cassandra_arrs_city_1", dateTimeArr: ["2007-12-03T10:15:30Z", "2007-12-13T10:15:30Z"]) {city_id dateTimeArr} }`);
        resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
          "data": {
            "updateCity": {
              "city_id": "cassandra_arrs_city_1",
              "dateTimeArr": [
                "2007-12-03T10:15:30.000Z",
                "2007-12-13T10:15:30.000Z"
              ]
            }
          }
        })
    });


    it('03. Arr read', function() {  
        res = itHelpers.request_graph_ql_post('{ readOneCity(city_id : "cassandra_arrs_city_1") { city_id strArr intArr floatArr boolArr dateTimeArr } }');
        resBody = JSON.parse(res.body.toString('utf8'));

        expect(res.statusCode).to.equal(200);
        expect(resBody).to.deep.equal({
          "data": {
            "readOneCity": {
              "city_id": "cassandra_arrs_city_1",
              "strArr": ["str1","str2","str3"],
              "intArr": [1,2,3],
               "floatArr": [1.100000023841858,3.3399999141693115,453.23199462890625],
              "boolArr": [true,false],
              "dateTimeArr": ["2007-12-03T10:15:30.000Z","2007-12-13T10:15:30.000Z"]
            }
          }
        })
    });

    it('04. Arr complex search with CONTAINS', function() {
      let res = itHelpers.request_graph_ql_post('{citiesConnection(pagination:{first:2}search:{operator:and, search:[{operator:cont, field:intArr, value:"2"}{operator:cont, field:strArr, value:"str3"}]} ){edges{node{city_id intArr strArr}}}}');
      let resBody = JSON.parse(res.body.toString('utf8'));
      expect(res.statusCode).to.equal(200);
      expect(resBody).to.deep.equal({
        "data": {
          "citiesConnection": {
            "edges": [{"node": { 
              "city_id": "cassandra_arrs_city_1",
               "intArr": [1,2,3],
               "strArr": ["str1","str2","str3"]
              }}
            ]
          }
        }
      });
    });
  });