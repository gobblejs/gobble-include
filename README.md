# gobble-include

Gobble plugin to naïvely include some files into other files.

Sometimes you need to include some file into other files. Maybe you've tried [`gobble-replace`](https://github.com/gobblejs/gobble-replace) but doesn't work with files, and [`gobble-browserify`](https://github.com/gobblejs/gobble-browserify) is overkill.

`gobble-include` covers that gap. Just Write `include('otherfile.ext')`.


## Installation

I assume you already know the basics of [Gobble](https://github.com/gobblejs/gobble).

```bash
npm i -D gobble-include
```

## Usage

Let's assume you've got two files named `data.json` and `code.js`:

```json
{ "foo": "foo", "bar": "bar" }
```

```javascript
var something = include('data.json');
do(something);
```

After running `gobble-include`, the file `data.json` will be deleted and `code.js` will contain:

```javascript
var something = { "foo": "foo", "bar", "bar" };
do(something);
```


Available options are those described in this `gobblefile.js` example:

```javascript
var gobble = require( 'gobble' );
module.exports = gobble( 'src' ).transform( 'include', {
  // supply custom delimiters
  delimiters: [ '<%=', '%>' ],

  // Force generating a sourcemap (by default maps are generated for .css and .js)
  sourceMap: true
});
```

## Caveats

`gobble-include` is **naïve**. This means it:

* Ignores double quotes in `include("file")`. The default is single quotes.
* Doesn't care about language syntax. e.g. `include('file')` doesn't mean anything in raw HTML, but files will still be included because the string matches. Custom delimiters can alleviate this.
* Doesn't care about multiple levels of included files or dependency graphs. Consider `gobble-browserify` or carefully run `gobble-include` in serial.
* Sourcemaps do not include information about the included files.

## License

```
"THE BEER-WARE LICENSE":
<ivan@sanchezortega.es> wrote this file. As long as you retain this notice you
can do whatever you want with this stuff. If we meet some day, and you think
this stuff is worth it, you can buy me a beer in return.
```
