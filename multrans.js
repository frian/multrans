#! /usr/bin/env node

/*jshint esversion: 6 */

const fs = require('fs');
const googleTranslateApi = require('@k3rn31p4nic/google-translate-api');

const multrans = require('./multranslib.js');
const conf = require('./config');

const program = multrans.parseArgs(conf);

if (! program.args.length) {
  program.help();
}

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

// -- flag ; we want ro check this only once
let didYouMeanCheck = true;

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
