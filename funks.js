var fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const inflection = require('inflection');
const jsb = require('js-beautify').js_beautify;
const {promisify} = require('util');
const ejsRenderFile = promisify( ejs.renderFile );

parseFile = function(jFile){
  let data=fs.readFileSync(jFile, 'utf8');
  let words=JSON.parse(data);
  return words;
}


// Generate the Javascript code (GraphQL-schema/resolvers/Sequelize-model) using EJS templates
generateJs = async function(templateName, options) {
  let renderedStr = await ejsRenderFile(__dirname + '/views/' +
    templateName +
    '.ejs', options, {})
  let prettyStr = jsb(renderedStr)
  return prettyStr;
}

attributesToString = function(attributes){
  let str_attributes="";
  if(attributes==='undefined') return str_attributes;

  for(key in attributes)
  {
    str_attributes+= key + ': ' + attributes[key] + ', '
  }

  return str_attributes.slice(0,-2);
}


writeSchemaCommons = function(dir_write){

  let commons = `module.exports = \`

  enum Operator{
    like
    or
    and
    eq
    between
    in
  }

  input typeValue{
    type: String
    value: String!
  }

\`;`;

  fs.writeFile(dir_write + '/schemas/' +  'commons.js' , commons, function(err) {
    if (err)
      return console.log(err);
    });
}

writeIndexModelsCommons = function(dir_write){

  let index =  `
  const fs = require('fs');
  const path = require('path')
  sequelize = require('../connection');

  var models = {};

  //grabs all the models in your models folder, adds them to the models object
  fs.readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    models[model.name] = model;
  });
  //Important: creates associations based on associations defined in associate function in the model files
  Object.keys(models).forEach(function(modelName) {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  //update tables with association (temporary, just for testing purposes)
  //this part is suppose to be done in the migration file
  //sequelize.sync({force: true});
  module.exports = models;
  `;

  fs.writeFile(dir_write + '/models/' +  'index.js' , index, function(err) {
    if (err)
      return console.log(err);
    });
}

//association belongsTo only modify the source model
fillAttributesBelongsTo = function(source_model,association,attributes_schema)
{
  let name_attribute = association.as;
  if(attributes_schema.hasOwnProperty(source_model))
  {
    //push the attribute related to associations to the ones existing
    attributes_schema[source_model]["schema"][name_attribute] = association.target;
    Object.assign(attributes_schema[source_model]["mutations"], association.foreign_key);

  }else{
    //insert model for the first time and set attributes related to associations
    attributes_schema[source_model] = {
        "schema" : { [name_attribute] : association.target},
        "mutations" :  association.foreign_key,
        "resolvers" : {}
    };
  }
}

//association belongsToMany only modify the source model and only the schema (no mutations)
fillAttributesBelongsToMany = function(source_model,association,attributes_schema)
{
  let search_type = association.as+'Search(input : search'+ association.target + 'Input)';

  if(attributes_schema.hasOwnProperty(source_model))
  {
    attributes_schema[source_model]["schema"][association.as] = '['+ association.target +']';
    attributes_schema[source_model]["schema"][search_type] = '['+ association.target +']';
    attributes_schema[source_model]['resolvers'][association.as] = inflection.pluralize(association.target);
  }else{
    attributes_schema[source_model] = {
        "schema" : { [association.as] : '['+ association.target +']',
                      [search_type] : '['+ association.target +']'
                    },
        "mutations" : {},
        "resolvers" : { [association.as] : inflection.pluralize(association.target)}
    };
  }
}

//associations hasMany and hasOne modify both source and target models
fillAttributesHasManyOne = function(source_model,association,attributes_schema)
{
  let name_attribute = association.as;
  let type_attribute = association.target;
  type_attribute = (association.type === 'hasMany' ?  '['+ type_attribute +']': type_attribute);

  if(attributes_schema.hasOwnProperty(source_model))
  {
    //push the attribute related to associations
    attributes_schema[source_model]["schema"][association.as] = type_attribute;
  }else{
    //insert model for the first time and set attributes
    attributes_schema[source_model] = {
        "schema" : { [name_attribute] : type_attribute },
        "mutations" : {},
        "resolvers" : {}
    };
  }

  if(association.type === 'hasMany')
  {
    let search_type = association.as+'Search(input : search'+ association.target + 'Input)';
    attributes_schema[source_model]['schema'][search_type] = type_attribute;
    attributes_schema[source_model]['resolvers'][association.as] = inflection.pluralize(association.target);
  }

  if(attributes_schema.hasOwnProperty(association.target))
  {
    Object.assign(attributes_schema[association.target]["mutations"], association.foreign_key);
  }else{
    attributes_schema[association.target] = {
      "schema" : {},
      "mutations" : association.foreign_key,
      "resolvers" : {}
    }
  }

}

module.exports.concatenateExtraAttributes = function(opts, model_extra_attributes) {
  if(model_extra_attributes === undefined)
  {
    opts["foreign_attributesStr"]="";
    opts["assoc_attributes"]={};
    opts["non_root_resolvers"]={};
  }else{
    opts["foreign_attributesStr"] = attributesToString(model_extra_attributes.mutations);
    opts["assoc_attributes"] = model_extra_attributes.schema;
    opts["non_root_resolvers"]= model_extra_attributes.resolvers;
  }
}

module.exports.getAllAttributesForSchema = function(opts, attributes_schema)
{
  let associations = opts.associations;
  let source_model = opts.name;

  associations.forEach((association)=>{
    //depending on the type of association the foreign_key can go
    //in the source_model or target_model
    if(association.type === 'belongsTo')
    {
      fillAttributesBelongsTo(source_model,association,attributes_schema);
    }else if(association.type === 'hasOne'|| association.type === 'hasMany'){
      fillAttributesHasManyOne(source_model,association,attributes_schema);
    }else if(association.type === 'belongsToMany'){
      fillAttributesBelongsToMany(source_model,association,attributes_schema);
    }

  });
}


module.exports.addAssociations = function(associations, summary_associations, source_table)
{
    if(!(associations===undefined))
    {
      associations.forEach((association) => {
        if(association.type === 'belongsTo')
        {
          summary_associations['one-many'].push(
            {
              "source_table" : source_table,
              "target_table" : association.target_table,
              "foreign_key" : Object.keys(association.foreign_key)[0]
            }
          );
        }else if(association.type === 'hasMany' || association.type === 'hasOne' ){
          summary_associations['one-many'].push(
            {
              "source_table" : association.target_table,
              "target_table" : source_table,
              "foreign_key" : Object.keys(association.foreign_key)[0]
            }
          );
        }else if(association.type === 'belongsToMany'){
          let through = association.cross_table;
          //if the cross table hasn't been registered then add it to the summary
          if(!summary_associations['many-many'].hasOwnProperty(through))
          {
            let attributes = {};
            let references = {};

            for( key in association.source_key)
            {
              attributes[key] = association.source_key[key];
              references[key] = source_table;
            }

            for( key in association.target_key)
            {
              attributes[key] = association.target_key[key];
              references[key] = association.target_table;
            }

            summary_associations['many-many'][through] = {
              "attributes" : attributes,
              "references" : references
            };
          }

        }
      });
    }
}

module.exports.getOpts = function(jsonFile){
  let dataModel = parseFile(jsonFile);
  let opts = {
    name : dataModel.model,
    table : dataModel.table,
    nameLc: dataModel.model.toLowerCase(),
    namePl: inflection.pluralize(dataModel.model.toLowerCase()),
    attributes: dataModel.attributes,
    attributesStr: attributesToString(dataModel.attributes),
    associations: (dataModel.associations===undefined ? [] : dataModel.associations)
  }

  return opts;
}

/*
  TODO: support for belongsToMany association
*/
module.exports.generateAssociationsMigrations =  function( summary_associations, dir_write)
{
  //migrations with add column
  summary_associations['one-many'].forEach( async (assoc_migration) =>{
    let generatedMigration = await generateJs('create-association-migration',assoc_migration);
    let name_migration = module.exports.createNameMigration(dir_write, 'z-column-'+assoc_migration.foreign_key+'-to-'+assoc_migration.source_table);
    fs.writeFile( name_migration, generatedMigration, function(err){
      if (err)
      {
        return console.log(err);
      }
    });
  });

  //migrations with create table (belongsToMany - through)
  Object.entries(summary_associations['many-many']).forEach( async ([name_assoc, value])=> {
    value['cross_table'] = name_assoc;
    let generatedMigration = await generateJs('create-through-migration', value);
    let name_migration = module.exports.createNameMigration(dir_write, 'z-through-'+name_assoc);
    fs.writeFile( name_migration, generatedMigration, function(err){
      if (err)
      {
        return console.log(err);
      }
    });
  });

}

module.exports.generateSection = async function(section, opts, dir_write )
{
  let generatedSection = await generateJs('create-'+section ,opts);
  fs.writeFile(dir_write, generatedSection, function(err) {
    if (err)
    {
      return console.log(err);
    }
  });
}

module.exports.createNameMigration = function(dir_write, model_name)
{
  let date = new Date();
   date = date.toISOString().slice(0,19).replace(/[^0-9]/g, "");
  //return dir_write + '/migrations/' + date + '-create-'+model_name +'.js';
  return dir_write + '/migrations/' + date + '-'+model_name +'.js';
}

module.exports.writeCommons = function(dir_write){
  writeSchemaCommons(dir_write);
  writeIndexModelsCommons(dir_write);
}

module.exports.generateTests = async function(jsonSchema){
  let opts = module.exports.getOpts(jsonSchema);
  let attributes_schema = {};
  module.exports.getAllAttributesForSchema(opts,attributes_schema);
  module.exports.concatenateExtraAttributes(opts,attributes_schema[opts.name]);

  let generatedSchema = await generateJs('create-schemas' , opts);
  fs.writeFile(__dirname + '/test' +  '/created-schema.js' , generatedSchema, function(err) {
    if (err)
      return console.log(err);
    });

  let generatedModel = await generateJs('create-models' , opts);
  fs.writeFile(__dirname + '/test' +  '/created-model.js' , generatedModel, function(err) {
    if (err)
      return console.log(err);
    });

  let generatedResolvers = await generateJs('create-resolvers' , opts);
  fs.writeFile(__dirname + '/test' +  '/created-resolvers.js' , generatedResolvers, function(err) {
    if (err)
      return console.log(err);
    });
}
