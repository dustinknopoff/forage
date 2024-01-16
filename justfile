default: install styles build

install:
    npm install lightningcss-cli -g

styles:
    lightningcss --browserslist --sourcemap advanced-css/styles.css --minify -o static/styles.css

dev:
    zola serve

build:
    zola build