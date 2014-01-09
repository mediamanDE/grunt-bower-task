var _ = require('lodash');
var Emitter = require('events').EventEmitter;
var path = require('path');
var grunt = require('grunt');
var packageMatcher = require('./package_matcher');

var Assets = function(cwd, componentsDir) {
  this._assets = { __untyped__: {} };
  this._cwd = cwd;
  this._componentsDir = componentsDir;
};

Assets.prototype.addOverridden = function(override, pkg) {
  _(override).each(function(overriddenPaths, assetType) {
    var pkgPath = path.join(this._componentsDir, pkg);
    var basePath = path.join(this._cwd, pkgPath);

    this._assets[assetType] = this._assets[assetType] || {};
    this._assets[assetType][pkg] = _(grunt.file.expand({cwd: basePath}, overriddenPaths)).map(function(expandedPath) {
      return path.join(pkgPath, expandedPath);
    });
  }, this);
};

Assets.prototype.addUntyped = function(pkgFiles, pkg) {
  if (!_.isArray(pkgFiles)) {
    pkgFiles = [ pkgFiles ];
  }
  this._assets['__untyped__'][pkg] = pkgFiles;
};

Assets.prototype.toObject = function() {
  return _.clone(this._assets);
};


var BowerAssets = function(bower, cwd) {
  this.bower = bower;
  this.cwd = cwd;
  this.config = bower.config.json || 'bower.json';
  this.assets = new Assets(cwd, bower.config.directory);
};

BowerAssets.prototype = Object.create(Emitter.prototype);
BowerAssets.prototype.constructor = BowerAssets;

BowerAssets.prototype.get = function() {
  var bower = this.bower;
  var bowerConfig = grunt.file.readJSON(path.join(this.cwd, this.config));
  var exportsOverride = bowerConfig.exportsOverride;

  var paths = bower.commands.list({paths: true});

  paths.on('end', function(data) {
    this.emit('end');
  }.bind(this));

  paths.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  return this;
};

module.exports = BowerAssets;
