#! /usr/bin/env node

const conf = {
    "defaultFromLang": 'fr',    // en|fr|de|...
    "defaultToLangs" : 'it,en',    // de|en|fr,de|fr,de,it
    "version": 'v1.0.0'
};

const path = require('path');
const minimist = require('minimist');
const googleTranslateApi = require('@k3rn31p4nic/google-translate-api');


//
// -- handle options ----------------------------------------------------------
//
var args = minimist(process.argv.slice(2), {
    string: [ 'from', 'to' ],
    boolean: [ 'version', 'help' ],
    alias: { h: 'help', v: 'version', f: 'from', t: 'to' },
    default: { from: conf.defaultFromLang, to: conf.defaultToLangs },
})


// -- show version
if (args.version) {
    console.log(conf.version);
    process.exit(0);
}


// -- show help
if (args.help || !args._.length) {
    showHelp();
    process.exit(0);
}



const fromLang = args.from || conf.defaultFromLang;

const toLangs = args.to.split(',') || conf.defaultToLangs.split(',');

// -- check if we have a same language in --from and --to
if (toLangs.includes(fromLang)) {
    console.log("  ERROR : same language in --from and --to");
    process.exit(0);
}

let multiTrans = false;

if (toLangs.length > 1) {
    multiTrans = true;
}



const toTranslate = args._[0];


// -- flag ; we want ro check this only once
let didYouMeanCheck = true;


//
// -- run ---------------------------------------------------------------------
//
// console.log('');
// console.log("translating : " + toTranslate);
// console.log('');

let checkTranslation = '';
let reverseTranslation = '';

translate(toTranslate, fromLang, toLangs[0])
    .then((result) => {
        checkTranslation = result.text;
    })
    .then(() => {
        translate(checkTranslation, toLangs[0], fromLang).then((result) => {

            reverseTranslation = result.text;

            if (toTranslate.toLowerCase() !== reverseTranslation.toLowerCase()) {
                console.log('');
                console.log("    WARNING : reverse translation differs from input");
                console.log('');
                console.log("    input :               " + toTranslate);
                console.log("    reverse translation : " + reverseTranslation);
                console.log('');
            }
        })
        return Promise.resolve(1);
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
    // console.log('');
    // console.log("done");
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
            reject(err)
        });
    })
}


function showHelp() {
    console.log(`
    Usage: ` + path.basename(process.argv[1]) + ` [OPTIONS] string_to_translate

    Options:

      -f, --from        language of input string (default : ` + conf.defaultFromLang + `)
      -t, --to          languages to translate to (default : ` + conf.defaultToLangs + `)
      -h, --help        show help
      -v, --version     show version

    Examples:

      ` + path.basename(process.argv[1]) + ` string_to_translate

`);
}
