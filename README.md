# multrans

a node.js script to translate to one or more languages

## Usage

```bash
$ node multrans
Usage: multrans [options] string_to_translate

translate to one or more languages

Options:
  -f, --from <lang>  language of input string (default: "fr")
  -t, --to <lang>    languages to translate to (default: "it")
  -v, --verbose      
  -V, --version      output the version number
  -h, --help         output usage information

Commands:
  set [options]      view and edit default in and out lang(s). (-h for help)

Examples:
  $ multrans "I am a translator"
  $ multrans -f en -t fr,it,de,es,ru "I can translate in multiple languages"
```
```bash
node multrans set -h
Usage: set [options]

view and edit default in and out lang(s). (-h for help)

Options:
 -i, --input <lang>      Set input lang
 -o, --output <lang(s)>  Set output lang(s)
 -h, --help              output usage information

Examples:
 $ multrans set             show defaults
 $ multrans set -i fr       set input lang to fr
 $ multrans set -o es,de    set output langs to es and de
```

## Setup

clone or download

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)

## Credits
[Matheus Fernandes](https://github.com/matheuss) for [google-translate-api](https://github.com/matheuss/google-translate-api).

[Sankarsan Kampa](https://github.com/k3rn31p4nic) for his [rewrite](https://github.com/k3rn31p4nic/google-translate-api).
