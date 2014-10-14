'use strict';

var patterns = require('./patterns');


function moreSpecificFirst(obj1, obj2) {
  return obj2.pattern.specificity - obj1.pattern.specificity;
}

module.exports = function makeGuard(ast) {
  var groups = [];

  // flatten agents
  ast.groups
    .forEach(function (group) {
      var rules = group.rules
        .map(function (rule) {
          return {
            pattern: patterns.path(rule.path),
            allow: rule.rule.toLowerCase() === 'allow'
          };
        })
        .sort(moreSpecificFirst);

      group.agents
        .forEach(function (agent) {
          groups.push({
            pattern: patterns.userAgent(agent),
            rules: rules
          });
        });
    });

  groups.sort(moreSpecificFirst);

  function findGroup(userAgent) {
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      if (group.pattern.test(userAgent)) {
        return group;
      }
    }
    return null;
  }

  function matchRule(rules, path) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.pattern.test(path)) {
        return rule.allow;
      }
    }
    // no rule matched? assume allowed
    return true;
  }

  function isAllowed(userAgent, path) {
    var group = findGroup(userAgent);
    if (group) {
      return matchRule(group.rules, path);
    }
    // no group matched? assume allowed
    return true;
  }

  return {
    isAllowed: isAllowed
  };
};