if (typeof module !== 'undefined') {
  var chai = require('chai'),
      chaiString = require('chai-string'),
      assert = chai.assert,
      model,
      makeModel = require('./models/model'),
      verbosity = '',
      teddy = require('../teddy');
  chai.use(chaiString);
}

describe('Misc', function() {
  before(function() {
    teddy.setTemplateRoot('test/templates');
    model = makeModel();
    if (process.env.NODE_ENV === 'test') {
      teddy.setVerbosity(0);
    }
    else if (process.env.NODE_ENV === 'cover') {
      teddy.setVerbosity(3);
    }
  });

  it('should render {variables} (misc/variable.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/variable.html', model), '<p>Some content</p>');
    done();
  });

  it('should render multiple {variables} (misc/multipleVariables.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/multipleVariables.html', model), '<p>Some content</p> <h5>More content</h5>');
    done();
  });

  it('should render nested {variables} (misc/nestedVars.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/nestedVars.html', model), '<p>Variable with a variable inside: And another: Some content</p>');
    done();
  });

  it('should properly escape HTML entities present in {variables} (misc/varEscaping.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/varEscaping.html', model), '<p>&lt;span&gt;raw html&lt;/span&gt;</p>');
    done();
  });

  it('should not escape HTML entities present in {variables} which are properly {flagged|s} (misc/varNoEscaping.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/varNoEscaping.html', model), '<p><span>raw html</span></p>');
    done();
  });

  it('should remove {! server side comments !} (misc/serverSideComments.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/serverSideComments.html', model), '<p>test test</p>');
    done();
  });

  // #27 and #43
  it('should remove {! {! nested !} server side comments !} (misc/serverSideCommentsNested.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/serverSideCommentsNested.html', model), '<p>Any comments? </p>');
    done();
  });

  it('should not break when referencing objects that don\'t exist (misc/objectDoesNotExist.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/objectDoesNotExist.html', model), ' <p>{doesntExist.someKey}</p> <p class=\'false\'></p>');
    done();
  });

  it('should render plain HTML with no teddy tags with no changes (misc/plainHTML.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/plainHTML.html', model), '<!DOCTYPE html><html lang=\'en\'><head><meta charset=\'utf-8\'><meta name=\'viewport\' content=\'width=device-width,initial-scale=1\'><meta name=\'format-detection\' content=\'telephone=no\'><title>Plain HTML</title><link rel=\'stylesheet\' href=\'/css/styles.css\'></head><body><main><p>This template contains no teddy tags. Just HTML.</p></main><script type=\'text/javascript\' src=\'/js/main.js\'></script></body></html>');
    done();
  });

  it('should render {variables} within style element (misc/styleVariables.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/styleVariables.html', model), '<style>p{height:10px;}</style>');
    done();
  });

  it('should access property of {variable} object with {variable} (misc/variableObjectProperty.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/variableObjectProperty.html', model), '<p>guy</p>');
    done();
  });

  it('should escape curly braces from regex pattern (misc/regexEscaping.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/regexEscaping.html', model), '<input type=\'text\' name=\'date\' placeholder=\'DD/MM/YYYY\' id=\'date\' pattern=\'^(3[0-1]|[1-2]\\d|[1-9]|0\\d)\\/(1[0-2]|[1-9]|0\\d)\\/[1-2]\\d{3}$\'>');
    done();
  });

  it('should trigger caching rollover given one template with 100 unique models (misc/variable.html)', function(done) {
    var i;
    teddy.cacheRenders(true);
    teddy.setDefaultCaches(10);
    for (i = 0; i < 100; i++) {
      teddy.render('misc/variable.html', {something: i});
    }
    assert.equalIgnoreSpaces(teddy.renderedTemplates['misc/variable.html'][0].renderedTemplate, '<p>90</p>');
    teddy.setDefaultCaches(1);
    teddy.cacheRenders(false);
    done();
  });

  it('should not cache a blacklisted template (misc/variable.html)', function(done) {
    teddy.cacheRenders(true);
    teddy.renderedTemplates = {};
    teddy.setCacheBlacklist(['misc/variable.html']);
    teddy.render('misc/variable.html', {something: 1});
    assert.equal(teddy.renderedTemplates['misc/variable.html'], undefined);
    teddy.setCacheBlacklist([]);
    teddy.cacheRenders(false);
    done();
  });

  it('should only cache whitelisted templates (misc/variable.html)', function(done) {
    teddy.cacheRenders(true);
    teddy.renderedTemplates = {};
    teddy.setCacheWhitelist({'misc/variable.html': 1});
    teddy.render('misc/plainHTML.html', {something: 1});
    teddy.render('misc/variable.html', {something: 1});
    assert.equal(teddy.renderedTemplates['misc/plainHTML.html'], undefined);
    assert.equalIgnoreSpaces(teddy.renderedTemplates['misc/variable.html'][0].renderedTemplate, '<p>1</p>');
    teddy.setCacheWhitelist({});
    teddy.cacheRenders(false);
    done();
  });

  it('should only cache the whitelisted template the specified number of times (misc/variable.html)', function(done) {
    var i;
    teddy.cacheRenders(true);
    teddy.renderedTemplates = {};
    teddy.setDefaultCaches(10);
    teddy.setCacheWhitelist({'misc/variable.html': 10});
    teddy.render('misc/plainHTML.html', {something: 1});
    for (i = 0; i < 100; i++) {
      teddy.render('misc/variable.html', {something: i});
    }
    assert.equal(teddy.renderedTemplates['misc/plainHTML.html'], undefined);
    assert.equalIgnoreSpaces(teddy.renderedTemplates['misc/variable.html'][0].renderedTemplate, '<p>90</p>');
    teddy.setCacheWhitelist({});
    teddy.cacheRenders(false);
    done();
  });

  it('should avoid rendering templates that are not strings', function(done) {
    assert.equalIgnoreSpaces(teddy.render(5, model), '');
    done();
  });

  it('should avoid compiling templates that are not strings', function(done) {
    assert.equalIgnoreSpaces(teddy.compile(5, model), '');
    done();
  });

  it('should render a template with missing or invalid model (misc/emptyModelMarkup.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/emptyModelMarkup.html', 1), '<div><p>Hello</p></div>');
    done();
  });

  it('should not render {variables} that don\'t exist in the model (misc/varNotInModel.html)', function(done) {
    assert.equalIgnoreSpaces(teddy.render('misc/varNotInModel.html', model), '{noExist}');
    done();
  });

  it('should set each verbosity level', function(done) {
    teddy.setVerbosity();
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity('none');
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity(0);
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity('verbose');
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity(2);
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity('DEBUG');
    verbosity += teddy.params.verbosity + ', ';
    teddy.setVerbosity(3);
    verbosity += teddy.params.verbosity;

    assert.equal(verbosity, '1, 0, 0, 2, 2, 3, 3');
    if (process.env.NODE_ENV === 'test') {
      teddy.setVerbosity(0);
    }
    else if (process.env.NODE_ENV === 'cover') {
      teddy.setVerbosity(3);
    }
    done();
  });

  it('should minify template with internal minifier (misc/plainHTML.html)', function(done) {
    teddy.minify(true);
    assert.equal(teddy.compile('misc/plainHTML.html', model), '<!DOCTYPE html><html lang=\'en\'> <head> <meta charset=\'utf-8\'> <meta name=\'viewport\' content=\'width=device-width,initial-scale=1\'> <meta name=\'format-detection\' content=\'telephone=no\'> <title>Plain HTML</title> <link rel=\'stylesheet\' href=\'/css/styles.css\'> </head> <body> <main> <p>This template contains no teddy tags. Just HTML.</p> </main> <script type=\'text/javascript\' src=\'/js/main.js\'></script> </body></html>');
    teddy.minify(false);
    done();
  });
});