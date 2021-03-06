#! /usr/bin/env node
/*jshint esversion: 6 */

const fs = require('fs');
const multrans = require('./index');
const conf = require('./config');

// -- Commander parsed argv
const program = multrans.parseArgs(conf);

// -- show help when no param or command
if (! program.args.length) {
  program.help();
}

// -- consts from command line
const verbose = program.verbose;
const toTranslate = program.args[0];
const fromLang = program.from || conf.defaultFromLang;
const toLangs = program.to.split(',') || conf.defaultToLangs.split(',');

// -- check if we have a same language in --from and --to
if (toLangs.includes(fromLang)) {
    console.log("  ERROR : same language in --from and --to");
    process.exit(0);
}

// -- flag for printResult
let multiTrans = false;

if (toLangs.length > 1) {
    multiTrans = true;
}

// -- for translation check
let checkTranslation = '';
let reverseTranslation = '';

//
// -- run ---------------------------------------------------------------------
//
if (verbose) {
    console.log('');
    console.log("translating : " + toTranslate + " from '" + fromLang + "' to '" + toLangs + "'");
    console.log('');
}

multrans.translate(toTranslate, fromLang, toLangs[0])
    .then((result) => {
        checkTranslation = result.text;
    })
    .then(() => {
        return multrans.translate(checkTranslation, toLangs[0], fromLang).then((result) => {
            reverseTranslation = result.text;
            if (toTranslate.toLowerCase() !== reverseTranslation.toLowerCase()) {
                console.log('');
                console.log("    WARNING : reverse translation differs from input");
                console.log('');
                console.log("    input :               " + toTranslate);
                console.log("    reverse translation : " + reverseTranslation);
                console.log('');
            }
        });
    })
    .then(() => {
        const translations = [];
        toLangs.forEach(function(toLang) {
            translations.push(multrans.translate(toTranslate, fromLang, toLang, multiTrans));
        });
        Promise.all(translations).then(multrans.printResult).then(multrans.printDone(verbose));
    })
    .catch((error) => {
        console.error(error);
    });
