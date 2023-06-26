---
date: 2023-06-25
title: How to Create a Tag Cloud (without JavaScript)
taxonomies:
  categories:
    - dev
  tags:
    - web
---
With just CSS, HTML, and a generator.

![](/tagcloud.png)

To create this, use a tool that can generate HTML from a template. Create a list of tags, setting in the `style` tag a CSS variable `--size` set to the number of pages which have a tag.

```html
{% set categories = get_taxonomy(kind="tags") %}
<ul class="cloud" role="navigation">
    {% for tag in categories.items %}
        <li>
            <a style="--size: {{tag.pages | length}}" href="/tags/{{tag.slug}}">{{tag.name}}</a>
        </li>
    {% endfor %}
</ul>
```
And then in your CSS, Make your list element a centered flex element, setting the default value of the CSS variable `--size` to 1.

```css
ul.cloud {
    list-style: none;
    padding-left: 0;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    line-height: 2.5rem;
    --size: 1;
}

ul.cloud a {
    color: #a33;
    display: block;
    font-size: calc(var(--size) * 0.01rem + 1rem);
    opacity: calc((15 - (9 - var(--size))) / 15);
    padding: 0.125rem 0.25rem;
    text-decoration: none;
    position: relative;
}
```

The font size in this case would be i.e. for a tag on 3 pages `3 * (16 * 0.01) + 16` = 16.48px. It will be necessary to play with the multiplier depending on the variance in number of tags. (i.e. If you have some tags that are on 100 pages, and others on 2 the size scaling would be massive.)