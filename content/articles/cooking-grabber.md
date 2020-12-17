+++
title = "Recipe Grabber"
date = 2020-12-14
[extra]
link = "https://github.com/dustinknopoff/nytcooking-grabber/tree/ld-schema"
discussion = "https://github.com/dustinknopoff/forage/discussions/2"
[taxonomies]
categories = ["dev"]
tags = ["rust", "webassembly"]
+++

Keeping track of things you find on the internet is hard. Every service either wants to be **the** service for everything on the web and does a poor job displaying/indexing the content, or focuses in on a single data type and then you forget about every one of the individual services that are 'perfect' for that data type.

Recipes are a great example of this. You have fantastic recipes from Food & Wine or NYTimes Cooking but there's no guarantee that the recipe will remain publicly available. There's also a website like yummly which requires a lot of sifting to find great recipes.

## How do you save a recipe?

One of my key requirements was that whatever format it's saved in needs to be the same format it's viewed in. This pretty much narrowed it down to just markdown. I've mentioned previously my go to shortcut for saving things from the internet offline, [A shortcut to add to iA Writer](https://wimpostma.com/blog/ia-writer-read-later-app/).

Unfortunately, having a plain recipe on a page doesn't do great things for SEO. Nearly all recipe sites have a full story which is sometimes interesting (and often not!), but is entirely unnecessary when you're going to make the recipe.

Around this time, I'd come across a blog post, [Scraping Recipe Websites](https://www.benawad.com/scraping-recipe-websites/), which leverages JSON-LD to retrieve data. Which seemed perfect for extracting just the recipe from a page!

## Step back: How's this going to run?

Ideally in a way that's free! And accessible from my computer or phone. _What about serverless?_ Why not.
Cloudflare has a generous free plan and their CLI tool is in rust. Also, the nice thing about cloudflare's API is that the worker-specific stuff is separate from your code. 

I highly recommend [cloudflare's docs](https://developers.cloudflare.com/workers/) for info on how to get started.

## The Structure

There's 3 key parts here:

1. Worker glue code
2. JSON-LD schema leveraging
3. Actual rust code.

### 1. Worker glue code

Anything compiled to web assembly must be called from javascript as a response to a network request in cloudflare's workers.

```js
// Direct from cloudflare's template
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  // Retrieve the 'url' from parameters
  let url = get("url", request.url);
  if (url) {
    // async load the wasm binary to be used
    const { get_ld_json } = wasm_bindgen;
    await wasm_bindgen(wasm);

    // fetch the HTML from url
    let data = await fetch(url).then((r) => r.text());

    // run rust code.
    const recipe_context = `${get_ld_json(data)}(${url})`;

    // return it!
    let res = new Response(recipe_context, {
      status: 200,
      headers: { "Content-Type": "text/markdown" },
    });
    return res;
  }
  return new Response(
    "ERROR. No url passed to perform conversion to markdown",
    { status: 400 }
  );
}

function get(name, url) {
  if (
    (name = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)").exec(
      url
    ))
  )
    return decodeURIComponent(name[1]);
}
```

Really simple! the `handleRequest` function extracts out the url from it's parameters, loads the wasm binary, fetches the passed in URL, runs the wasm binary on the received HTML and then returns it.

On the mac, doing this in the browser (or curl) and then copy pasting in to my markdown editor is trivial. I've leveraged [shortcuts](https://www.icloud.com/shortcuts/e7bfe5625bd84bfbb4decef7db559e43) to do the same on mobile.

### 2. JSON-LD Schema Leveraging

JSON-LD schema as defined by their [website](https://schema.org):

> Schema.org is a collaborative, community activity with a mission to create, maintain, and promote schemas for structured data on the Internet, on web pages, in email messages, and beyond. 

It's also how you see this when you search chocolate cake:

![](https://res.cloudinary.com/dknopoff/image/upload/f_auto/v1607957030/portfolio/ddg_recipe.png)

_Most_ recipe websites include this in the `<head>` region.

```html
  <head>
    <title>Dinner Hummus with Spiced Chicken and Cauliflower Recipe  - Leah Koenig | Food &amp; Wine</title>
    <meta charset="utf-8">
    <link rel="shortcut icon" href="/favicon.ico" type="image/vnd.microsoft.icon">
    <link rel="icon" href="/img/favicons/favicon-32.png" sizes="32x32">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="apple-touch-icon" href="/img/favicons/favicon-57.png">
    <!-- many more -->
    <script type="application/ld+json">
      // ...The full JSON schema for this recipe
    </script>
  </head>
   <!-- the actual webpage -->
```

### 3. The worker/rust code

I'm using the [scraper crate](https://crates.io/crates/scraper) for extracting from HTML using CSS selectors. Here's the entry function.

```rust
#[wasm_bindgen]
/// Given the contents of a website, The `application/ld+json` attribute is extracted,
/// parsed, and converted in to a markdown document.
pub fn get_ld_json(contents: &str) -> String {
    let document = Html::parse_document(contents);
    // We're getting out that JSON from the <head>
    let selector = Selector::parse(r#"script[type="application/ld+json"]"#).unwrap();
    let ctx = document.select(&selector).next().unwrap();
    let text = ctx.text().collect::<Vec<_>>();
    // Converting it in to plain text to then serialize as JSON
    let as_txt = text.join("");
    let as_txt = traverse_for_type_recipe(&as_txt);
    let as_recipe: LdRecipe<'_> = match serde_json::from_str(&as_txt) {
        Ok(val) => val,
        Err(_) => {
            return String::from(
                "Whoops! Something went wrong. This worker does not support that url :(.",
            )
        }
    };
    let mut builder = RecipeMarkdownBuilder::new(&as_recipe);
    builder.build().into()
}
```

The `wasm_bindgen` macro handles the web-assembly-fication of the code. We start by parsing the HTML document and extracting the JSON-LD. From trial and error, I've discovered while most recipe sites utilize the Recipe schema, they do it in different ways.

This where the `traverse_for_type_recipe` comes in.

```rust
fn traverse_for_type_recipe(content: &str) -> String {
    let tree: serde_json::Value = serde_json::from_str(content).unwrap();
    let _recipe_str = serde_json::json!("Recipe");
    // Example: tests/ragu.json
    if let Some(_recipe_str) = tree.get("@type") {
        return content.to_string();
    }
    // Example: tests/chocolate_olive_oil.json
    if let Some(val) = tree.get("@graph") {
        val.as_array()
            .unwrap()
            .iter()
            .filter(|graph_item| graph_item.get("@type") == Some(&_recipe_str))
            .collect::<Vec<_>>()
            .first()
            .unwrap()
            .to_string()
    }
    // Example: tests/full_hummus.json
    else if tree.is_array() {
        tree.as_array()
            .unwrap()
            .iter()
            .filter(|graph_item| graph_item.get("@type") == Some(&_recipe_str))
            .collect::<Vec<_>>()
            .first()
            .unwrap()
            .to_string()
    } else {
        panic!("Invalid recipe!")
    }
}
```

Since rust is not a dynamic language, we're using serde_json's Value enum to find the `@type` attribute with value `Recipe`.

The rest, is quite simply magic!

```rust
#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct LdRecipe<'r> {
    #[serde(borrow)]
    pub(crate) name: Cow<'r, str>,
    #[serde(borrow)]
    pub(crate) description: Cow<'r, str>,
    pub(crate) author: SingleOrArray<Author<'r>>,
    #[serde(borrow)]
    pub(crate) image: Image<'r>,
    #[serde(rename = "totalTime")]
    #[serde(borrow)]
    pub(crate) total_time: Option<Cow<'r, str>>,
    #[serde(rename = "recipeYield")]
    #[serde(borrow)]
    pub(crate) recipe_yield: SingleOrArray<Cow<'r, str>>,
    #[serde(rename = "recipeIngredient")]
    #[serde(borrow)]
    pub(crate) recipe_ingredient: Vec<Cow<'r, str>>,
    #[serde(rename = "recipeInstructions")]
    pub(crate) recipe_instructions: StringOrInstruction<'r>,
    pub(crate) video: Option<Video<'r>>,
}
```

This is the `struct` we are trying to parse from the JSON we filtered for. It pretty much works or it doesn't.

Then we simply construct the markdown and return it.

So a recipe like [https://www.foodandwine.com/recipes/lamb-martabak](https://www.foodandwine.com/recipes/lamb-martabak)

Becomes

```md
# Lamb Martabak

By: Lara Lee

![](https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F9%2F2020%2F11%2F19%2Flamb-martabak-FT-RECIPE1120.jpg)

This martabak is one of Lara Leeâ€™s favorite snacks from her Indonesian cookbook Coconut & Sambal. The traditional version is made with a thin, translucent sheet of oiled homemade dough that is pan-fried in a cast-iron pan, but for easy entertaining, Lee recommends using spring roll wrappers. Lamb martabak is a fantastic canapÃ© or appetizer to kick-start a dinner party. Itâ€™s best eaten immediately and served with sambal on the side for dipping.

Yields: 8 to 10 in P0DT0h 45m

## Ingredients
- 1 pound ground lamb
- 2 garlic cloves, peeled and crushed
- 2 small shallots, peeled and finely chopped
- 3 inch piece of ginger, peeled and finely chopped
- 2 spring onions, finely chopped
- 1/2 bunch of chives, finely chopped
- 1 teaspoon ground coriander
- 1/2 teaspoon ground cumin
- 1/2 teaspoon sea salt
- 1/4 teaspoon ground black pepper
- 30 wheat spring roll wrappers, 6 inches square
- 1 banana or 1 beaten egg, for sealing
- Coconut oil or sunflower oil, for pan-frying
- <a href="https://www.foodandwine.com/recipes/caramelized-shallot-sambal-bawang">Caramelized Shallot Sambal Bawang</a>, for serving

## Instructions
1. Combine all the ingredients for the filling in a bowl and mix well. Heat 1 to 2 tablespoons of oil in a large frying pan over a medium-high heat, add all the ingredients for the lamb filling and cook, stirring, until it is cooked through. Taste and adjust the seasoning as needed. Transfer to a bowl and allow to cool.

2. Line a sheet pan with parchment paper. Place one spring roll wrapper on a cutting board, storing any unused wrappers under a clean tea towel so they do not dry out. Spread 1 to 2 tablespoons of the filling over one half of the wrapper, leaving a quarter-inch border. Cut a thick slice of the banana with the skin on and rub the banana flesh over the edges of the wrapper to help seal the skin together (if you prefer, you can brush the edge with beaten egg). Fold the other half of the wrapper over the filling and press all the edges down. Place on a sheet pan. Repeat until all the filling has been used up.

3. Fill a deep saucepan one-third full with oil and heat to 320Â°F. (If you do not have a kitchen thermometer, check the oil is at temperature by adding a cube of bread; it should turn golden in 25 to 30 seconds.) Fry the martabak in batches for 2 to 3 minutes until golden. Transfer to a sheet pan lined with paper towels to absorb any excess oil.

4. Cut the martabak in half so the filling can be seen, then serve with caramelized shallot sambal bawang.


Source: [Lamb Martabak](https://www.foodandwine.com/recipes/lamb-martabak)
```