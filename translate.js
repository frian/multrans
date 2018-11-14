#! /usr/bin/env node

/*jshint esversion: 6 */

const conf = {
    "defaultFromLang": 'fr',    // en|fr|de|...
    "defaultToLangs" : 'it,en',    // de|en|fr,de|fr,de,it
};


const path = require('path');
const args = require('commander');
const googleTranslateApi = require('@k3rn31p4nic/google-translate-api');

const version = require('./package.json').version;


args
    .usage('[options] string_to_translate')
    .description('translate to one or more languages')
    .option('-f, --from <lang>', 'language of input string', conf.defaultFromLang)
    .option('-t, --to <lang>', 'languages to translate to', conf.defaultToLangs)
    .option('-v, --verbose')
    .version(version)
    .parse(process.argv);


if (! args.args.length) {
  args.help();
}

const fromLang = args.from || conf.defaultFromLang;

const toLangs = args.to.split(',') || conf.defaultToLangs.split(',');


// -- check if we have a same language in --from and --to
if (toLangs.includes(fromLang)) {
    console.log("  ERROR : same language in --from and --to");
    process.exit(0);
}

const verbose = args.verbose;

// -- flag for printResult
let multiTrans = false;

if (toLangs.length > 1) {
    multiTrans = true;
}


const toTranslate = args.args[0];


// -- flag ; we want ro check this only once
let didYouMeanCheck = true;


//
// -- run ---------------------------------------------------------------------
//
if (verbose) {
    console.log('');
    console.log("translating : " + toTranslate + " from '" + fromLang + "' to '" + toLangs + "'");
    console.log('');
}


let checkTranslation = '';
let reverseTranslation = '';

translate(toTranslate, fromLang, toLangs[0])
    .then((result) => {
        checkTranslation = result.text;
    })
    .then(() => {
        return translate(checkTranslation, toLangs[0], fromLang).then((result) => {

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
            translations.push(translate(toTranslate, fromLang, toLang));
        });

        Promise.all(translations).then(printResult).then(printDone);
    })
    .catch((error) => {
        console.error(error);
    });


//
// -- functions ----------------------------------------------------------
//
function printResult(results) {
    if (multiTrans === false) {
        console.log("  " + results[0].text);
        return;
    }
    results.forEach(function(result) {
        console.log("  " + result.lang + " : " + result.text);
    });
}

function printDone() {
    if (verbose) {
        console.log('');
        console.log("done");
    }
}

function translate(string, fromLang, toLang) {

    return new Promise(function(resolve, reject) {

        googleTranslateApi(
            string, {
                from: fromLang,
                to: toLang,
                raw: true}
            ).then(res => {
                if (res.from.text.didYouMean && didYouMeanCheck === true) {
                    didYouMeanCheck = false;
                    console.log("  Did you mean  : " + res.from.text.value);
                    console.log('');
                }
                resolve({text: res.text, lang: toLang});
            }
        ).catch(err => {
            reject(err);
        });
    });
}
