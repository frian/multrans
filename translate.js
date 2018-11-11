#! /usr/bin/env node

const path = require('path');
const minimist = require('minimist');
const googleTranslateApi = require('google-translate-api');

//
// -- handle options ----------------------------------------------------------
//
var args = minimist(process.argv.slice(2), {
  string: [ 'from', 'to' ],
  boolean: [ 'version', 'help' ],
  alias: { h: 'help', v: 'version', f: 'from', t: 'to' },
  default: { from: 'fr', to: 'en' },
})


// -- show help
if (args.help) {
    showHelp();
    process.exit(0);
}

// -- check if we have a string to translate
if (!args._.length) {
    console.log("  missing string to translate");
    process.exit(0);
}








const langs = args.to.split(',');

console.log(langs);

let didYouMeanCheck = true;

const toTranslate = args._;

function translate(string, fromLang, toLang) {

    // Return new promise
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








const printResult = (results) => {
    results.forEach(function(result) {
        console.log("  " + result.lang + " : " + result.text);
    });
}

const printDone = () => {
    console.log('');
    console.log("done");
}

function main() {

    console.log('');
    console.log("translating : " + toTranslate);
    console.log('');

    let checkTranslation = '';
    let reverseTranslation = '';

    translate(toTranslate, 'fr', 'en')
        .then((result) => {
            checkTranslation = result.text;
            console.log("DEBUG : checkTranslation -> " + checkTranslation);
        })
        .catch((error) => {
            console.error(error);
        })
        .then(() => {
            translate(checkTranslation, 'en', 'fr').then((result) => {

                reverseTranslation = result.text;
                console.log("reverseTranslation " + reverseTranslation);

                if (toTranslate.toLowerCase() !== reverseTranslation.toLowerCase()) {
                    console.log('');
                    console.log("    WARNING : reverse translation differs from input");
                    console.log('');
                    console.log("    input :               " + toTranslate);
                    console.log("    reverse translation : " + reverseTranslation);
                    console.log('');
                }
            })
        })
        .then(() => {
            const translations = [];

            langs.forEach(function(toLang) {
                translations.push(translate(toTranslate, 'fr', toLang));
            });

            Promise.all(translations).then(printResult).then(printDone);
        });



}

main();


function showHelp() {
    console.log(`
    usage: ` + path.basename(process.argv[1]) + ` [OPTIONS] string_to_translate

    options:

      -f, --from        language of input string
      -t, --to          languages to translate to
      -h, --help        show help
      -v, --version     show version
`);
}
