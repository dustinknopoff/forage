default: install styles build

install:
    npm install lightningcss-cli -g

styles:
    BROWSERSLIST=">= 0.25%" lightningcss --browserslist --sourcemap advanced-css/styles.css -o static/styles.css

dev:
    zola serve

build:
    zola build