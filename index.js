/*jshint esversion: 6 */

const program = require('commander');
const googleTranslateApi = require('@k3rn31p4nic/google-translate-api');
const he = require('he');

const version = require('./package.json').version;

// -- flag ; we want ro check this only once
let didYouMeanCheck = true;


const multrans = {
    printDone: function(verbose) {
        if (verbose) {
            console.log('');
            console.log("done");
        }
    },
    translate: function(string, fromLang, toLang, multiTrans) {

        return new Promise(function(resolve, reject) {

            googleTranslateApi(
                string, {
                    from: fromLang,
                    to: toLang,
                    raw: true}
                ).then(res => {
                    if (res.from.text.didYouMean && didYouMeanCheck === true) {
                        didYouMeanCheck = false;
                        console.log("  Did you mean  : " + he.decode(res.from.text.value));
                        console.log('');
                    }
                    resolve({text: res.text, lang: toLang, multiTrans: multiTrans});
                }
            ).catch(err => {
                reject(err);
            });
        });
    },
    printResult: function(results) {
        if (results[0].multiTrans === false) {
            console.log("  " + results[0].text);
            return;
        }
        results.forEach(function(result) {
            console.log("  " + result.lang + " : " + result.text);
        });
    },
    parseArgs: function(conf) {
        program
            .usage('[options] string_to_translate')
            .description('translate to one or more languages')
            .option('-f, --from <lang>', 'language of input string', conf.defaultFromLang)
            .option('-t, --to <lang>', 'languages to translate to', conf.defaultToLangs)
            .option('-v, --verbose');

        program
            .command('set')
            .description('view and edit default in and out lang(s). (-h for help)')
            .option("-i, --input <lang>", "Set input lang")
            .option("-o, --output <lang(s)>", "Set output lang(s)")
            .action(function(options) {
                if (options.input === undefined && options.output === undefined) {
                    console.log("default input lang :     " + conf.defaultFromLang);
                    console.log("default output lang(s) : " + conf.defaultToLangs);
                    process.exit(0);
                }
                else if (options.input) {
                    console.log('set input lang to : ' + options.input);
                    conf.defaultFromLang = options.input;
                    let newConf = JSON.stringify(conf, null, 4);
                    fs.writeFileSync('config.json', newConf);
                    process.exit(0);
                }
                else if (options.output) {
                    console.log('set output lang(s) to ' + options.output);
                    conf.defaultToLangs = options.output;
                    let newConf = JSON.stringify(conf, null, 4);
                    fs.writeFileSync('config.json', newConf);
                    process.exit(0);
                }
            })
            .on('--help', function(){
              console.log('');
              console.log('Examples:');
              console.log('  $ ' + program._name + ' set             show defaults');
              console.log('  $ ' + program._name + ' set -i fr       set input lang to fr');
              console.log('  $ ' + program._name + ' set -o es,de    set output langs to es and de');
            });

            program.on('--help', function(){
              console.log('');
              console.log('Examples:');
              console.log('  $ ' + program._name + ' "I am a translator"');
              console.log('  $ ' + program._name + ' -f en -t fr,it,de,es,ru "I can translate in multiple languages"');
            });

        program
            .version(version)
            .parse(process.argv);

        return program;
    }
};

module.exports = multrans;
