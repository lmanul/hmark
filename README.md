# hmark
Simple benchmarking tool for HTML rendering

## Usage

* Copy the HTML files you want to test under `place_your_html_files_here`
* In a terminal, do `./run`
* Open `http://localhost:8000` in a browser

## How this works

* A minimal Python web server serves the local files.
* Each HTML page is fetched through an XML HTTP request and stored in RAM as a string.
* Each page is rendered, alternatively, by setting the `body` element's `innerHTML`.
