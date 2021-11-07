---
title: Readability
date: 2020-12-11
extra:
  link: https://github.com/dustinknopoff/raster-md
taxonomies:
  categories:
    - dev
  tags:
    - rust

---

What do you do when you want to keep online content that's password protected, _offline_?

For the past year or two, [A shortcut to add to iA Writer](https://wimpostma.com/blog/ia-writer-read-later-app/) worked fantastically! Except that all the sudden the sites I was using it on just stopped working.

Naturally, that requires me to figure out how to do it myself...and on a mac.

## Step 1. Lookup html to markdown

And you'll find a ton of examples of libraries for PHP, JavaScript, and Python. So, maybe a serverless function? 

## Step 2. Go too far down a rabbit hole only to realize it doesn't work.

It's a _challenge_ to pass direct HTML to a serverless function. It's more common to receive a URL and then fetch it within the function (less bits over the wire). But, then how do you get past the password protection? You don't. Or at least the effort to do so is not worth it.

## Step 3. Node CLI?

I found a couple of tutorials for serverless functions that retrieve the contents of a URL, run it through the [readability library](https://github.com/mozilla/readability) from mozilla and then have `pandoc` convert from HTML to markdown. Sounds reasonable.

Except that a Node CLI is clearly dark magic that is impossible for mere humans to comprehend.

## Step 4. Sweet, sweet rust

A quick `!crates readability` (because duckduckgo bangs are _awesome_) and there's a rust version! Finally, something that makes sense. And the final result is barely worth an entire cargo project.

```rust
use clap::Clap;
use readability::extractor::extract;
use std::fs::File;
use std::io::{self, BufReader, Write};
use std::path::PathBuf;

/// HTML to Readability CLI
#[derive(Clap)]
#[clap(version = "1.0")]
struct Args {
    file: PathBuf,
    url: url::Url,
}

fn main() -> Result<(), anyhow::Error> {
    let opts: Args = Args::parse();
    let file = File::open(&opts.file)?;
    let mut reader = BufReader::new(file);
    let product = extract(&mut reader, &opts.url)?;
    let stdout = io::stdout();
    let mut handle = stdout.lock();
    handle.write_all(format!("<h1>{}</h1>", product.title).as_bytes())?;
    handle.write_all(product.content.as_bytes())?;
    handle.write_all(
        format!(r#"<p>Source: <a href="{}">{}</a>"#, opts.url, product.title).as_bytes(),
    )?;
    Ok(())
}
```

That's it. If you go with stdlib error handling and arguments, it's probably even less lines.

## Alfred/Applescript Magic

So that's wonderful. We've got our stripped HTML and piping to `pandoc` is easy. But what's the most accessible way to access this? Alfred.

<kbd>command</kbd> + <kbd>space</kbd>

<kbd>html2md</kbd> + <kbd>enter</kmd>

Done 💥

And the magic behind it all

```bash
content=$(osascript -e 'tell application "Safari" to return the source of front document')
url=$(osascript -e 'tell application "Safari" to return the URL of front document')

cd <reader location>/target/release/
  
./reader <(echo $content) $url | /usr/local/bin/pandoc -f html -t commonmark-raw_html --wrap none

 # <() is really cool. Treats stdin as a file
```

Retrieves the html and url from the current tab in Safari and runs the readability script. Then pipes to pandoc. This then gets passed to iA Writer and saved to a file (This is only necessary because I love that iA Writer auto-titles the file).